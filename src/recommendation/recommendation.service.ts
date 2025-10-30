import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongooseModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Op } from 'sequelize';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Story } from '../shared/models/Story';
import { Like } from '../shared/models/Like';
import { SavedStory } from '../shared/models/SavedStory';
import { UserSubscription } from '../shared/models/UserSubscription';
import { Subscriber } from '../shared/models/Subscriber';
import { User } from '../shared/models/User';
import { Mushroom } from '../shared/models/Mushroom';
import { StoryAggregate } from '../stories/schemas/story-aggregate.schema';
import {
  UserRecommendation,
  UserRecommendationDocument,
} from './schemas/user-recommendation.schema';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private recomputeQueue: Set<string> = new Set(); // Track users queued for recompute

  constructor(
    @InjectModel(Story) private readonly storyModel: typeof Story,
    @InjectModel(Like) private readonly likeModel: typeof Like,
    @InjectModel(SavedStory) private readonly savedStoryModel: typeof SavedStory,
    @InjectModel(UserSubscription) private readonly userSubscriptionModel: typeof UserSubscription,
    @InjectModel(Subscriber) private readonly subscriberModel: typeof Subscriber,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Mushroom) private readonly mushroomModel: typeof Mushroom,
    @InjectMongooseModel('StoryAggregate', 'blog')
    private readonly storyAggregateModel: Model<StoryAggregate>,
    @InjectMongooseModel('UserRecommendation', 'blog')
    private readonly userRecommendationModel: Model<UserRecommendationDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get random feed for unauthenticated users
   * NOTE: This cache is shared across ALL anonymous users (not user-specific)
   */
  async getRandomFeed(
    page: number = 1,
    size: number = 20,
  ): Promise<{ stories: any[]; total: number }> {
    const limit = Math.max(1, Math.min(50, Number(size)));
    const offset = (Math.max(1, Number(page)) - 1) * limit;

    // Cache key is shared for all anonymous users (not user-specific)
    const cacheKey = `feed:anonymous:${page}:${size}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for random feed`);
      return cached as { stories: any[]; total: number };
    }

    // Get random published stories (only open mushrooms for anonymous users)
    const stories = await this.storyModel.findAll({
      where: {
        status: 'published',
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'dp_url', 'bio', 'subscribersCount', 'interests'],
        },
        {
          model: Mushroom,
          attributes: ['id', 'name', 'description', 'status', 'type', 'dp_url', 'subscribers'],
        },
      ],
      limit: limit * 2, // Get more for filtering
      order: [['createdAt', 'DESC']], // Order by newest first
    });

    // Filter out closed mushroom stories for anonymous users
    const filteredStories = stories
      .map((story: any) => story.toJSON())
      .filter((story: any) => {
        if (story.mushroomId && story.mushroom && story.mushroom.status === 'closed') {
          return false; // Hide closed mushrooms for anonymous users
        }
        return true;
      });

    // Shuffle for randomness (Fisher-Yates shuffle)
    for (let i = filteredStories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filteredStories[i], filteredStories[j]] = [filteredStories[j], filteredStories[i]];
    }

    // Apply pagination
    const total = filteredStories.length;
    const paginatedStories = filteredStories.slice(offset, offset + limit);

    const result = {
      stories: paginatedStories,
      total,
    };

    // Cache result for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Get personalized feed for user (OPTIMIZED with precomputed recommendations)
   */
  async getPersonalizedFeed(
    userId: string,
    page: number = 1,
    size: number = 20,
  ): Promise<{ stories: any[]; total: number }> {
    const limit = Math.max(1, Math.min(50, Number(size)));
    const offset = (Math.max(1, Number(page)) - 1) * limit;

    // Try to get from Redis cache first
    const cacheKey = `feed:${userId}:${page}:${size}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for feed: ${userId}`);
      return cached as { stories: any[]; total: number };
    }

    // Try to get precomputed recommendations from MongoDB
    let precomputed;
    try {
      precomputed = await this.userRecommendationModel.findOne({ userId });
    } catch (error) {
      // MongoDB unavailable - fallback to real-time computation
      this.logger.warn(`MongoDB unavailable, falling back to real-time computation for user: ${userId}`);
      return await this.computeFeedRealTime(userId, limit, offset, cacheKey);
    }
    
    if (precomputed && precomputed.storyRecommendations.length > 0) {
      // Check if recommendations are fresh (less than 1 hour old)
      const ageInHours =
        (Date.now() - precomputed.lastComputed.getTime()) / (1000 * 60 * 60);
      
      if (ageInHours < 1) {
        // Use precomputed recommendations
        this.logger.debug(`Using precomputed recommendations for user: ${userId}`);
        const storyIds = precomputed.storyRecommendations.map((r) => r.storyId);
        
        // Fetch full story data for recommended stories
        const stories = await this.getStoriesByIds(storyIds, limit, offset);
        
        const result = {
          stories,
          total: precomputed.storyRecommendations.length,
        };
        
        // Cache result for 10 minutes
        await this.cacheManager.set(cacheKey, result, 600);
        
        return result;
      }
    }

    // If no precomputed data or stale, compute in real-time
    // Also trigger async background computation for next time
    this.logger.debug(`Computing feed in real-time for user: ${userId}`);
    
    // Trigger background recomputation for future requests (non-blocking)
    this.triggerBackgroundRecompute(userId).catch((err) => {
      this.logger.error(`Background recompute failed for ${userId}:`, err);
    });

    return await this.computeFeedRealTime(userId, limit, offset, cacheKey);
  }

  /**
   * Grouped feed for UI: trending, interest1, interest2, other
   * Pulls stories from MongoDB aggregates and caches results.
   */
  async getGroupedFeed(userId?: string): Promise<any> {
    const cacheKey = userId ? `groupedFeed:${userId}` : `groupedFeed:anonymous`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Determine user interests
    let interests: string[] = [];
    if (userId) {
      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'interests'],
      });
      interests = (user?.interests as string[]) || [];
    }

    if (!interests || interests.length === 0) {
      // Fallback interests if unauthenticated or none set
      const fallback = ['tech', 'javascript', 'ai', 'design', 'startup', 'python', 'cloud', 'db', 'devops', 'security'];
      // pick random 5
      const shuffled = [...fallback].sort(() => Math.random() - 0.5);
      interests = shuffled.slice(0, 5);
    }

    // Trending: top 5 by engagement score (Mongo only)
    const trendingDocs = await this.storyAggregateModel
      .find({ status: 'published' as any })
      .sort({
        // approximate engagement sorting
        likesCount: -1,
        commentsCount: -1,
        viewsCount: -1,
        createdAt: -1,
      })
      .limit(20) // fetch more to post-filter
      .exec();

    const trending = trendingDocs
      .map((d: any) => d.toJSON())
      .slice(0, 5);

    // Build interest buckets keyed by actual interest names (max 5 interests)
    const selectedInterests = interests.slice(0, 5);
    const interestBuckets: Record<string, any[]> = {};
    for (const interest of selectedInterests) {
      const iq: any = {
        status: 'published',
        $or: [
          { hashtags: { $in: [interest] } },
          { title: { $regex: interest, $options: 'i' } },
          { tagLine: { $regex: interest, $options: 'i' } },
        ],
      };
      const docs = await this.storyAggregateModel
        .find(iq)
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();
      interestBuckets[interest] = docs.map((d: any) => d.toJSON()).slice(0, 5);
    }

    // Other: random stories excluding already selected ids
    const pickedIds = new Set<string>([
      ...trending.map((s: any) => s.storyId),
      ...Object.values(interestBuckets).flat().map((s: any) => s.storyId),
    ]);

    // Use aggregation with $match + $sample for randomness
    const otherAgg = await (this.storyAggregateModel as any).aggregate([
      { $match: { status: 'published', storyId: { $nin: Array.from(pickedIds) } } },
      { $sample: { size: 5 } },
    ]);

    const other = otherAgg as any[];

    const result: any = { trending, other, ...interestBuckets };

    // Cache: user-specific for 5 minutes; anonymous shared for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Compute feed in real-time (fallback)
   */
  private async computeFeedRealTime(
    userId: string,
    limit: number,
    offset: number,
    cacheKey: string,
  ): Promise<{ stories: any[]; total: number }> {
    // Get user data
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'interests'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Get user's subscriptions
    const userSubscriptions = await this.userSubscriptionModel.findAll({
      where: { subscriberId: userId },
      attributes: ['subscribedToId'],
    });
    const subscribedUserIds = userSubscriptions.map((s) => s.subscribedToId);

    // Get user's mushroom subscriptions (only joined ones)
    const mushroomSubscriptions = await this.subscriberModel.findAll({
      where: { userId, status: 'joined' },
      attributes: ['mushroomId'],
    });
    const subscribedMushroomIds = mushroomSubscriptions.map((s) => s.mushroomId);

    // Build recommendation query (simplified for performance)
    const stories = await this.buildFeedQuery(
      userId,
      subscribedUserIds,
      subscribedMushroomIds,
      [],
      [],
      (user.interests as string[]) || [],
      limit * 3, // Get 3x for scoring and filtering
    );

    // Score and rank stories
    const scoredStories = await this.scoreStories(
      stories,
      userId,
      subscribedUserIds,
      subscribedMushroomIds,
      (user.interests as string[]) || [],
    );

    // Filter: Remove closed mushroom stories for non-subscribers
    const filteredStories = scoredStories.filter((story: any) => {
      if (story.mushroomId && story.mushroom && story.mushroom.status === 'closed') {
        return subscribedMushroomIds.includes(story.mushroomId);
      }
      return true;
    });

    // Sort by score (descending) and apply pagination
    filteredStories.sort((a: any, b: any) => b.score - a.score);

    const paginatedStories = filteredStories.slice(offset, offset + limit);

    const result = {
      stories: paginatedStories,
      total: filteredStories.length,
    };

    // Cache result for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Get stories by IDs (optimized batch query)
   */
  private async getStoriesByIds(
    storyIds: string[],
    limit: number,
    offset: number,
  ): Promise<any[]> {
    const paginatedIds = storyIds.slice(offset, offset + limit);

    const stories = await this.storyModel.findAll({
      where: {
        id: { [Op.in]: paginatedIds },
        status: 'published',
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'dp_url', 'bio', 'subscribersCount', 'interests'],
        },
        {
          model: Mushroom,
          attributes: ['id', 'name', 'description', 'status', 'type', 'dp_url', 'subscribers'],
        },
      ],
    });

    // Maintain order from recommendations
    const storyMap = new Map(stories.map((s) => [s.id, s.toJSON()]));
    return paginatedIds
      .map((id) => storyMap.get(id))
      .filter((story) => story !== undefined);
  }

  /**
   * Build the initial feed query
   */
  private async buildFeedQuery(
    userId: string,
    subscribedUserIds: string[],
    subscribedMushroomIds: string[],
    likedStoryIds: string[],
    savedStoryIds: string[],
    interests: string[],
    limit: number,
  ): Promise<any[]> {
    const whereClause: any = {
      status: 'published',
    };

    // Exclude stories already liked or saved (we can include them but lower priority)
    // We'll handle this in scoring instead

    const stories = await this.storyModel.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'dp_url', 'bio', 'subscribersCount', 'interests'],
        },
        {
          model: Mushroom,
          attributes: ['id', 'name', 'description', 'status', 'type', 'dp_url', 'subscribers'],
        },
      ],
      limit,
      order: [['createdAt', 'DESC']],
    });

    return stories.map((story: any) => story.toJSON());
  }

  /**
   * Score stories based on multiple factors
   */
  private async scoreStories(
    stories: any[],
    userId: string,
    subscribedUserIds: string[],
    subscribedMushroomIds: string[],
    interests: string[],
  ): Promise<any[]> {
    // Get aggregated story data from MongoDB for engagement metrics
    const storyIds = stories.map((s) => s.id);
    const aggregates = await this.storyAggregateModel.find({
      storyId: { $in: storyIds },
    });

    const aggregateMap = new Map(
      aggregates.map((agg: any) => [agg.storyId, agg]),
    );

    return stories.map((story: any) => {
      const aggregate = aggregateMap.get(story.id);
      let score = 0;

      // 1. Followed author boost (30%)
      if (subscribedUserIds.includes(story.authorId)) {
        score += 30;
      }

      // 2. Subscribed mushroom boost (25%)
      if (
        story.mushroomId &&
        subscribedMushroomIds.includes(story.mushroomId)
      ) {
        score += 25;
      }

      // 3. Content-based matching (interests/hashtags) (20%)
      if (interests.length > 0 && story.hashtags) {
        const matchingHashtags = story.hashtags.filter((tag: string) =>
          interests.some(
            (interest: string) =>
              tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase()),
          ),
        );
        score += (matchingHashtags.length / Math.max(story.hashtags.length, 1)) * 20;
      }

      // 4. Engagement score (15%)
      const likesCount = aggregate?.likesCount || story.likesCount || 0;
      const commentsCount = aggregate?.commentsCount || story.commentsCount || 0;
      const viewsCount = aggregate?.viewsCount || story.viewsCount || 0;
      
      // Normalize engagement (log scale to prevent outliers from dominating)
      const engagementScore =
        Math.log10(likesCount + 1) * 5 +
        Math.log10(commentsCount + 1) * 3 +
        Math.log10(viewsCount + 1) * 2;
      
      score += Math.min(engagementScore, 15); // Cap at 15

      // 5. Freshness boost (10%)
      const daysSinceCreation =
        (Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 1) {
        score += 10; // New today
      } else if (daysSinceCreation < 7) {
        score += 7; // This week
      } else if (daysSinceCreation < 30) {
        score += 4; // This month
      }

      // 6. Story type preference (based on user's saved/liked stories)
      // Could analyze user's historical preference, but for now neutral

      return {
        ...story,
        score: Math.round(score * 100) / 100, // Round to 2 decimals
      };
    });
  }

  /**
   * Get recommended mushrooms for user (OPTIMIZED)
   */
  async getRecommendedMushrooms(
    userId: string,
    limit: number = 10,
  ): Promise<any[]> {
    // Try precomputed first
    let precomputed;
    try {
      precomputed = await this.userRecommendationModel.findOne({ userId });
    } catch (error) {
      // MongoDB unavailable - fallback to real-time
      this.logger.warn(`MongoDB unavailable, using real-time mushroom recommendations for user: ${userId}`);
      return await this.computeMushroomRecommendationsRealTime(userId, limit);
    }
    
    if (precomputed && precomputed.mushroomRecommendations.length > 0) {
      const mushroomIds = precomputed.mushroomRecommendations
        .slice(0, limit)
        .map((r) => r.mushroomId);
      
      const mushrooms = await this.mushroomModel.findAll({
        where: { id: { [Op.in]: mushroomIds } },
        attributes: ['id', 'name', 'description', 'type', 'dp_url', 'subscribers', 'status'],
      });

      // Maintain order
      const mushroomMap = new Map(mushrooms.map((m) => [m.id, m.toJSON()]));
      const scored = precomputed.mushroomRecommendations
        .slice(0, limit)
        .map((rec) => ({
          ...mushroomMap.get(rec.mushroomId),
          score: rec.score,
        }))
        .filter((m) => m.id !== undefined);

      return scored;
    }

    // Fallback to real-time
    return await this.computeMushroomRecommendationsRealTime(userId, limit);
  }

  private async computeMushroomRecommendationsRealTime(
    userId: string,
    limit: number,
  ): Promise<any[]> {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'interests'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const subscribedMushrooms = await this.subscriberModel.findAll({
      where: { userId, status: 'joined' },
      attributes: ['mushroomId'],
    });
    const subscribedMushroomIds = subscribedMushrooms.map((s) => s.mushroomId);

    const mushrooms = await this.mushroomModel.findAll({
      where: {
        id: { [Op.notIn]: subscribedMushroomIds },
        status: 'open',
      },
      attributes: ['id', 'name', 'description', 'type', 'dp_url', 'subscribers', 'status'],
      limit: limit * 2,
    });

    const scored = mushrooms.map((mushroom: any) => {
      let score = 0;

      if (user.interests && user.interests.length > 0) {
        const desc = (mushroom.description || '').toLowerCase();
        const matching = user.interests.some((interest: string) =>
          desc.includes(interest.toLowerCase()),
        );
        if (matching) score += 50;
      }

      score += Math.log10((mushroom.subscribers || 0) + 1) * 10;

      return {
        ...mushroom.toJSON(),
        score: Math.round(score * 100) / 100,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Get recommended users for user (OPTIMIZED)
   */
  async getRecommendedUsers(
    userId: string,
    limit: number = 10,
  ): Promise<any[]> {
    // Try precomputed first
    let precomputed;
    try {
      precomputed = await this.userRecommendationModel.findOne({ userId });
    } catch (error) {
      // MongoDB unavailable - fallback to real-time
      this.logger.warn(`MongoDB unavailable, using real-time user recommendations for user: ${userId}`);
      return await this.computeUserRecommendationsRealTime(userId, limit);
    }
    
    if (precomputed && precomputed.userRecommendations.length > 0) {
      const userIds = precomputed.userRecommendations
        .slice(0, limit)
        .map((r) => r.userId);
      
      const users = await this.userModel.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: [
          'id',
          'name',
          'userName',
          'dp_url',
          'bio',
          'interests',
          'subscribersCount',
        ],
      });

      // Maintain order
      const userMap = new Map(users.map((u) => [u.id, u.toJSON()]));
      const scored = precomputed.userRecommendations
        .slice(0, limit)
        .map((rec) => ({
          ...userMap.get(rec.userId),
          score: rec.score,
        }))
        .filter((u) => u.id !== undefined);

      return scored;
    }

    // Fallback to real-time
    return await this.computeUserRecommendationsRealTime(userId, limit);
  }

  private async computeUserRecommendationsRealTime(
    userId: string,
    limit: number,
  ): Promise<any[]> {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'interests'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const subscriptions = await this.userSubscriptionModel.findAll({
      where: { subscriberId: userId },
      attributes: ['subscribedToId'],
    });
    const subscribedUserIds = subscriptions.map((s) => s.subscribedToId);
    subscribedUserIds.push(userId);

    const users = await this.userModel.findAll({
      where: {
        id: { [Op.notIn]: subscribedUserIds },
      },
      attributes: [
        'id',
        'name',
        'userName',
        'dp_url',
        'bio',
        'interests',
        'subscribersCount',
      ],
      limit: limit * 2,
    });

    const scored = users.map((u: any) => {
      let score = 0;

      if (
        user.interests &&
        u.interests &&
        user.interests.length > 0 &&
        u.interests.length > 0
      ) {
        const commonInterests = user.interests.filter((interest: string) =>
          u.interests.includes(interest),
        );
        score += (commonInterests.length / user.interests.length) * 50;
      }

      score += Math.log10((u.subscribersCount || 0) + 1) * 10;

      return {
        ...u.toJSON(),
        score: Math.round(score * 100) / 100,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Trigger background recomputation for a user (non-blocking)
   * This adds user to queue, and scheduler jobs will process the queue
   */
  private async triggerBackgroundRecompute(userId: string): Promise<void> {
    // Avoid duplicate queue entries
    if (this.recomputeQueue.has(userId)) {
      return;
    }

    this.recomputeQueue.add(userId);
    this.logger.debug(`User ${userId} queued for background recomputation`);

    // The scheduler jobs will process queued users
    // This is a lightweight way to signal that recomputation is needed
  }

  /**
   * Get users queued for recomputation (used by scheduler)
   */
  getQueuedUsers(): string[] {
    const users = Array.from(this.recomputeQueue);
    this.recomputeQueue.clear(); // Clear after reading
    return users;
  }

  /**
   * Get popular users for unauthenticated users
   * Returns users ordered by subscriber count
   * NOTE: This cache is shared across ALL anonymous users (not user-specific)
   */
  async getPopularUsers(limit: number = 10): Promise<any[]> {
    // Cache key is shared for all anonymous users (not user-specific)
    const cacheKey = `popular:users:anonymous:${limit}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for popular users`);
      return cached as any[];
    }

    const users = await this.userModel.findAll({
      attributes: [
        'id',
        'name',
        'userName',
        'dp_url',
        'bio',
        'interests',
        'subscribersCount',
      ],
      limit: limit,
      order: [['subscribersCount', 'DESC']],
    });

    const result = users.map((u: any) => ({
      ...u.toJSON(),
      score: Math.log10((u.subscribersCount || 0) + 1) * 10, // Calculate score based on subscribers
    }));

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600);

    return result;
  }

  /**
   * Get popular mushrooms for unauthenticated users
   * Returns open mushrooms ordered by subscriber count
   * NOTE: This cache is shared across ALL anonymous users (not user-specific)
   */
  async getPopularMushrooms(limit: number = 10): Promise<any[]> {
    // Cache key is shared for all anonymous users (not user-specific)
    const cacheKey = `popular:mushrooms:anonymous:${limit}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for popular mushrooms`);
      return cached as any[];
    }

    const mushrooms = await this.mushroomModel.findAll({
      where: {
        status: 'open', // Only show open mushrooms to unauthenticated users
      },
      attributes: ['id', 'name', 'description', 'type', 'dp_url', 'subscribers', 'status'],
      limit: limit,
      order: [['subscribers', 'DESC']],
    });

    const result = mushrooms.map((m: any) => ({
      ...m.toJSON(),
      score: Math.log10((m.subscribers || 0) + 1) * 10, // Calculate score based on subscribers
    }));

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600);

    return result;
  }
}

