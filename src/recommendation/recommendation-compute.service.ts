import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongooseModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Op } from 'sequelize';
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
export class RecommendationComputeService {
  private readonly logger = new Logger(RecommendationComputeService.name);

  constructor(
    @InjectModel(Story) private readonly storyModel: typeof Story,
    @InjectModel(Like) private readonly likeModel: typeof Like,
    @InjectModel(SavedStory) private readonly savedStoryModel: typeof SavedStory,
    @InjectModel(UserSubscription)
    private readonly userSubscriptionModel: typeof UserSubscription,
    @InjectModel(Subscriber) private readonly subscriberModel: typeof Subscriber,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Mushroom) private readonly mushroomModel: typeof Mushroom,
    @InjectMongooseModel('StoryAggregate', 'blog')
    private readonly storyAggregateModel: Model<StoryAggregate>,
    @InjectMongooseModel('UserRecommendation', 'blog')
    private readonly userRecommendationModel: Model<UserRecommendationDocument>,
  ) {}

  /**
   * Precompute recommendations for a single user
   */
  async computeUserRecommendations(userId: string): Promise<void> {
    try {
      this.logger.log(`Computing recommendations for user: ${userId}`);

      // Get user data
      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'interests'],
      });

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        return;
      }

      // Get user preferences (cached for faster access)
      const userPreferences = await this.getUserPreferences(userId);

      // Get all published stories (with limits for performance)
      const stories = await this.storyModel.findAll({
        where: { status: 'published' },
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
        limit: 500, // Limit for performance
        order: [['createdAt', 'DESC']],
      });

      // Get aggregated story data
      const storyIds = stories.map((s) => s.id);
      const aggregates = await this.storyAggregateModel.find({
        storyId: { $in: storyIds },
      });
      const aggregateMap = new Map(
        aggregates.map((agg: any) => [agg.storyId, agg]),
      );

      // Score stories
      const scoredStories = await this.scoreStories(
        stories.map((s) => s.toJSON()),
        userId,
        userPreferences.subscribedUserIds,
        userPreferences.subscribedMushroomIds,
        userPreferences.interests,
        aggregateMap,
      );

      // Filter closed mushrooms
      const filteredStories = scoredStories.filter((story: any) => {
        if (story.mushroomId && story.mushroom && story.mushroom.status === 'closed') {
          return userPreferences.subscribedMushroomIds.includes(story.mushroomId);
        }
        return true;
      });

      // Sort and take top 100
      filteredStories.sort((a: any, b: any) => b.score - a.score);
      const topStories = filteredStories.slice(0, 100).map((story: any) => ({
        storyId: story.id,
        score: story.score,
        computedAt: new Date(),
      }));

      // Compute mushroom recommendations
      const mushroomRecommendations = await this.computeMushroomRecommendations(
        userId,
        userPreferences,
      );

      // Compute user recommendations
      const userRecommendations = await this.computeUserRecommendationsForUsers(
        userId,
        userPreferences,
      );

      // Save to MongoDB (with error handling)
      try {
        const existing = await this.userRecommendationModel.findOne({ userId });
        const newVersion = existing ? (existing.version || 0) + 1 : 1;

        await this.userRecommendationModel.findOneAndUpdate(
          { userId },
          {
            $set: {
              storyRecommendations: topStories,
              mushroomRecommendations,
              userRecommendations,
              userPreferences,
              lastComputed: new Date(),
              version: newVersion,
            },
          },
          { upsert: true },
        );
      } catch (error) {
        this.logger.error(`Failed to save recommendations to MongoDB for user ${userId}:`, error);
        // Continue without throwing - recommendations computed but not saved
      }

      this.logger.log(`Successfully computed recommendations for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error computing recommendations for user ${userId}:`,
        error.stack,
      );
    }
  }

  /**
   * Batch compute recommendations for multiple users
   */
  async batchComputeRecommendations(
    userIds: string[],
    batchSize: number = 10,
  ): Promise<void> {
    this.logger.log(`Starting batch compute for ${userIds.length} users`);

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      await Promise.all(
        batch.map((userId) => this.computeUserRecommendations(userId)),
      );
      this.logger.log(`Processed batch ${Math.floor(i / batchSize) + 1}`);
    }

    this.logger.log('Batch compute completed');
  }

  /**
   * Compute recommendations for active users
   */
  async computeActiveUsersRecommendations(limit: number = 100): Promise<void> {
    // Get active users (users who have liked, saved, or subscribed recently)
    const recentDays = 30;
    const cutoffDate = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

    // Get users with recent likes
    const recentLikes = await this.likeModel.findAll({
      where: {
        createdAt: {
          [Op.gte]: cutoffDate,
        },
      },
      attributes: ['userId'],
      group: ['userId'],
      raw: true,
    });

    // Get users with recent saves
    const recentSaves = await this.savedStoryModel.findAll({
      where: {
        createdAt: {
          [Op.gte]: cutoffDate,
        },
      },
      attributes: ['userId'],
      group: ['userId'],
      raw: true,
    });

    // Combine and get unique user IDs
    const allActiveUserIds = [
      ...new Set([
        ...recentLikes.map((l: any) => l.userId),
        ...recentSaves.map((s: any) => s.userId),
      ]),
    ];

    // Limit to top active users
    const userIds = allActiveUserIds.slice(0, limit);
    
    if (userIds.length > 0) {
      await this.batchComputeRecommendations(userIds);
    }
  }

  /**
   * Compute recommendations for ALL users (in batches for performance)
   */
  async computeAllUsersRecommendations(): Promise<void> {
    this.logger.log('Computing recommendations for all users');

    // Get all user IDs
    const allUsers = await this.userModel.findAll({
      attributes: ['id'],
    });

    const userIds = allUsers.map((u) => u.id);
    this.logger.log(`Found ${userIds.length} users to process`);

    // Process in batches of 50 to avoid overwhelming the system
    await this.batchComputeRecommendations(userIds, 50);
  }

  /**
   * Compute recommendations for inactive users (those without recent recommendations)
   */
  async computeInactiveUsersRecommendations(batchSize: number = 200): Promise<void> {
    this.logger.log(`Computing recommendations for inactive users (batch: ${batchSize})`);

    // Get all users
    const allUsers = await this.userModel.findAll({
      attributes: ['id'],
    });

    // Get users who already have recent recommendations (< 7 days old)
    const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let recentRecommendations = [];
    try {
      recentRecommendations = await this.userRecommendationModel.find({
        lastComputed: { $gte: recentCutoff },
      });
    } catch (error) {
      this.logger.warn('MongoDB unavailable for checking recent recommendations, processing all inactive users');
      // Continue without filtering - will process all inactive users
    }

    const usersWithRecentRecs = new Set(
      recentRecommendations.map((r: any) => r.userId),
    );

    // Filter to get users without recent recommendations
    const inactiveUserIds = allUsers
      .map((u) => u.id)
      .filter((id) => !usersWithRecentRecs.has(id))
      .slice(0, batchSize);

    this.logger.log(
      `Found ${inactiveUserIds.length} inactive users without recent recommendations`,
    );

    if (inactiveUserIds.length > 0) {
      // Process in smaller batches
      await this.batchComputeRecommendations(inactiveUserIds, 25);
    }
  }

  /**
   * Incremental update - only update recommendations when user actions occur
   */
  async incrementalUpdate(
    userId: string,
    action: 'like' | 'save' | 'subscribe' | 'unsubscribe',
  ): Promise<void> {
    // For incremental updates, we can either:
    // 1. Mark recommendations as stale and recompute on next request
    // 2. Do partial update
    // For now, we'll mark as stale and recompute in background

    await this.userRecommendationModel.updateOne(
      { userId },
      {
        $set: {
          'userPreferences.lastUpdated': new Date(),
        },
      },
    );

    // Trigger async recompute
    setImmediate(() => {
      this.computeUserRecommendations(userId).catch((err) => {
        this.logger.error(`Incremental update failed for ${userId}:`, err);
      });
    });
  }

  /**
   * Get user preferences (with caching)
   */
  private async getUserPreferences(userId: string): Promise<{
    subscribedUserIds: string[];
    subscribedMushroomIds: string[];
    likedStoryIds: string[];
    savedStoryIds: string[];
    interests: string[];
  }> {
    const [
      userSubscriptions,
      mushroomSubscriptions,
      likedStories,
      savedStories,
      user,
    ] = await Promise.all([
      this.userSubscriptionModel.findAll({
        where: { subscriberId: userId },
        attributes: ['subscribedToId'],
      }),
      this.subscriberModel.findAll({
        where: { userId, status: 'joined' },
        attributes: ['mushroomId'],
      }),
      this.likeModel.findAll({
        where: { userId },
        attributes: ['storyId'],
        limit: 100,
      }),
      this.savedStoryModel.findAll({
        where: { userId },
        attributes: ['storyId'],
        limit: 100,
      }),
      this.userModel.findByPk(userId, { attributes: ['interests'] }),
    ]);

    return {
      subscribedUserIds: userSubscriptions.map((s) => s.subscribedToId),
      subscribedMushroomIds: mushroomSubscriptions.map((s) => s.mushroomId),
      likedStoryIds: likedStories.map((l) => l.storyId),
      savedStoryIds: savedStories.map((s) => s.storyId),
      interests: (user?.interests as string[]) || [],
    };
  }

  /**
   * Score stories (extracted from recommendation service)
   */
  private async scoreStories(
    stories: any[],
    userId: string,
    subscribedUserIds: string[],
    subscribedMushroomIds: string[],
    interests: string[],
    aggregateMap: Map<string, any>,
  ): Promise<any[]> {
    return stories.map((story: any) => {
      const aggregate = aggregateMap.get(story.id);
      let score = 0;

      // Followed author boost
      if (subscribedUserIds.includes(story.authorId)) {
        score += 30;
      }

      // Subscribed mushroom boost
      if (story.mushroomId && subscribedMushroomIds.includes(story.mushroomId)) {
        score += 25;
      }

      // Content matching
      if (interests.length > 0 && story.hashtags) {
        const matchingHashtags = story.hashtags.filter((tag: string) =>
          interests.some(
            (interest: string) =>
              tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase()),
          ),
        );
        score +=
          (matchingHashtags.length / Math.max(story.hashtags.length, 1)) * 20;
      }

      // Engagement score
      const likesCount = aggregate?.likesCount || story.likesCount || 0;
      const commentsCount =
        aggregate?.commentsCount || story.commentsCount || 0;
      const viewsCount = aggregate?.viewsCount || story.viewsCount || 0;

      const engagementScore =
        Math.log10(likesCount + 1) * 5 +
        Math.log10(commentsCount + 1) * 3 +
        Math.log10(viewsCount + 1) * 2;

      score += Math.min(engagementScore, 15);

      // Freshness boost
      const daysSinceCreation =
        (Date.now() - new Date(story.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 1) {
        score += 10;
      } else if (daysSinceCreation < 7) {
        score += 7;
      } else if (daysSinceCreation < 30) {
        score += 4;
      }

      return {
        ...story,
        score: Math.round(score * 100) / 100,
      };
    });
  }

  /**
   * Compute mushroom recommendations
   */
  private async computeMushroomRecommendations(
    userId: string,
    preferences: any,
  ): Promise<any[]> {
    const subscribedMushroomIds = preferences.subscribedMushroomIds;

    const mushrooms = await this.mushroomModel.findAll({
      where: {
        id: { [Op.notIn]: subscribedMushroomIds },
        status: 'open',
      },
      attributes: ['id', 'name', 'description', 'type', 'dp_url', 'subscribers', 'status'],
      limit: 50,
    });

    const scored = mushrooms.map((mushroom: any) => {
      let score = 0;

      if (preferences.interests && preferences.interests.length > 0) {
        const desc = (mushroom.description || '').toLowerCase();
        const matching = preferences.interests.some((interest: string) =>
          desc.includes(interest.toLowerCase()),
        );
        if (matching) score += 50;
      }

      score += Math.log10((mushroom.subscribers || 0) + 1) * 10;

      return {
        mushroomId: mushroom.id,
        score: Math.round(score * 100) / 100,
        computedAt: new Date(),
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 20);
  }

  /**
   * Compute user recommendations
   */
  private async computeUserRecommendationsForUsers(
    userId: string,
    preferences: any,
  ): Promise<any[]> {
    const subscribedUserIds = [...preferences.subscribedUserIds, userId];

    const users = await this.userModel.findAll({
      where: {
        id: { [Op.notIn]: subscribedUserIds },
      },
      attributes: ['id', 'name', 'userName', 'dp_url', 'bio', 'interests', 'subscribersCount'],
      limit: 50,
    });

    const scored = users.map((u: any) => {
      let score = 0;

      if (
        preferences.interests &&
        u.interests &&
        preferences.interests.length > 0 &&
        u.interests.length > 0
      ) {
        const commonInterests = preferences.interests.filter((interest: string) =>
          u.interests.includes(interest),
        );
        score +=
          (commonInterests.length / preferences.interests.length) * 50;
      }

      score += Math.log10((u.subscribersCount || 0) + 1) * 10;

      return {
        userId: u.id,
        score: Math.round(score * 100) / 100,
        computedAt: new Date(),
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 20);
  }
}

