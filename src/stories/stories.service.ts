import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongooseModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Op } from 'sequelize';
import { Story } from '../shared/models/Story';
import { Comment } from '../shared/models/Comment';
import { Like } from '../shared/models/Like';
import { User } from '../shared/models/User';
import { Mushroom } from '../shared/models/Mushroom';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { FilterStoryDto } from './dto/filter-story.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  StoryContent,
  StoryContentSchema,
} from './schemas/story-content.schema';
import {
  CommentContent,
  CommentContentSchema,
} from './schemas/comment-content.schema';
import {
  StoryLikeDetails,
  StoryLikeDetailsSchema,
  CommentLikeDetails,
  CommentLikeDetailsSchema,
} from './schemas/like-details.schema';
import { StoryAggregate } from './schemas/story-aggregate.schema';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story) private readonly storyModel: typeof Story,
    @InjectModel(Comment) private readonly commentModel: typeof Comment,
    @InjectModel(Like) private readonly likeModel: typeof Like,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Mushroom) private readonly mushroomModel: typeof Mushroom,
    @InjectMongooseModel('StoryContent', 'blog')
    private readonly storyContentModel: Model<StoryContent>,
    @InjectMongooseModel('CommentContent', 'blog')
    private readonly commentContentModel: Model<CommentContent>,
    @InjectMongooseModel('StoryLikeDetails', 'blog')
    private readonly storyLikeDetailsModel: Model<StoryLikeDetails>,
    @InjectMongooseModel('CommentLikeDetails', 'blog')
    private readonly commentLikeDetailsModel: Model<CommentLikeDetails>,
    @InjectMongooseModel('StoryAggregate', 'blog')
    private readonly storyAggregateModel: Model<StoryAggregate>,
  ) {}

  /**
   * Create a new story
   */
  async create(user: any, createStoryDto: CreateStoryDto): Promise<any> {
    // Check if mushroomId is provided and validate it
    if (createStoryDto.mushroomId) {
      const mushroom = await this.mushroomModel.findByPk(
        createStoryDto.mushroomId,
      );
      if (!mushroom) {
        throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
      }
    }

    // Check for duplicate story with same title, thumbnails_url, and authorId
    const existingStory = await this.storyModel.findOne({
      where: {
        title: createStoryDto.title,
        thumbnails_url: createStoryDto.thumbnails_url,
        authorId: user.id,
      },
    });

    if (existingStory) {
      throw new HttpException(
        'A story with the same title and thumbnail URL already exists',
        HttpStatus.CONFLICT,
      );
    }

    // Create story in PostgreSQL
    const story = await this.storyModel.create({
      ...createStoryDto,
      authorId: user.id,
      status: createStoryDto.status || 'draft',
    } as any);

    try {
      // Store content in MongoDB if provided
      if (createStoryDto.content) {
        await this.storyContentModel.create({
          storyId: story.id,
          content: createStoryDto.content,
          metadata: {
            lastEdited: new Date(),
          },
        });
      }

      // Create aggregate document in MongoDB 'stories' collection
      const mongoStory = await this.storyAggregateModel.create({
        storyId: story.id,
        likesCount: story.likesCount || 0,
        like: [],
        commentsCount: story.commentsCount || 0,
        comment: [],
        viewsCount: story.viewsCount || 0,
        title: story.title,
        type: story.type,
        thumbnails_url: story.thumbnails_url,
        tagLine: story.tagLine,
        hashtags: story.hashtags || [],
        mushroomId: story.mushroomId || null,
        mushroom: {},
        authordetails: { name: user?.name || '', dp_url: user?.dp_url || '',bio: user?.bio || '' },
        postType: story.postType,
        storyType: story.storyType,
        status: story.status,
        authorId: story.authorId,
        sentimentalScore: story.sentimentalScore ?? 0,
      });

      return { ...story.toJSON(), mongoStory: mongoStory.toJSON() };
    } catch (mongoError) {
      console.error('MongoDB creation error:', mongoError);
      // If MongoDB creation fails, delete the story from PostgreSQL
      await story.destroy();
      throw new HttpException(
        `Failed to create story in MongoDB: ${mongoError.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all stories with filters
   */
  async findAll(filter: FilterStoryDto): Promise<Story[]> {
    const where: any = {};

    if (filter.postType) {
      where.postType = filter.postType;
    }

    if (filter.storyType) {
      where.storyType = filter.storyType;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.authorId) {
      where.authorId = filter.authorId;
    }

    if (filter.mushroomId) {
      where.mushroomId = filter.mushroomId;
    }

    if (filter.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${filter.search}%` } },
        { tagLine: { [Op.iLike]: `%${filter.search}%` } },
        { hashtags: { [Op.contains]: [filter.search] } },
      ];
    }

    return await this.storyModel.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'dp_url', 'bio'] },
        { model: Mushroom, attributes: ['id', 'name', 'type', 'dp_url'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get story by ID with content
   */
  async findById(id: string): Promise<any> {
    const story = await this.storyModel.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'name', 'dp_url', 'bio'] },
        { model: Mushroom, attributes: ['id', 'name', 'type', 'dp_url'] },
      ],
    });

    if (!story) {
      throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
    }

    // Get content from MongoDB
    const storyContent = await this.storyContentModel.findOne({ storyId: id });

    return {
      ...story.toJSON(),
      content: storyContent?.content,
    };
  }

  /**
   * Update story
   */
  async update(
    id: string,
    userId: string,
    updateStoryDto: UpdateStoryDto,
  ): Promise<any> {
    const story = await this.storyModel.findByPk(id);

    if (!story) {
      throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
    }

    // Check ownership
    if (story.authorId !== userId) {
      throw new HttpException(
        'Forbidden: You can only update your own stories',
        HttpStatus.FORBIDDEN,
      );
    }

    // Update PostgreSQL record
    await story.update(updateStoryDto);

    // Update MongoDB content if provided
    if (updateStoryDto.content) {
      await this.storyContentModel.findOneAndUpdate(
        { storyId: id },
        {
          content: updateStoryDto.content,
          'metadata.lastEdited': new Date(),
        },
        { upsert: true },
      );
    }

    return story;
  }

  /**
   * Delete story
   */
  async delete(id: string, userId: string): Promise<void> {
    const story = await this.storyModel.findByPk(id);

    if (!story) {
      throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
    }

    // Check ownership
    if (story.authorId !== userId) {
      throw new HttpException(
        'Forbidden: You can only delete your own stories',
        HttpStatus.FORBIDDEN,
      );
    }

    // Delete from PostgreSQL
    await story.destroy();

    // Delete from MongoDB
    await this.storyContentModel.deleteOne({ storyId: id });
    await this.storyLikeDetailsModel.deleteOne({ storyId: id });

    // Delete related comments and likes
    const comments = await this.commentModel.findAll({ where: { storyId: id } });
    const commentIds = comments.map((c) => c.id);

    await this.commentModel.destroy({ where: { storyId: id } });
    await this.likeModel.destroy({
      where: { [Op.or]: [{ storyId: id }, { commentId: { [Op.in]: commentIds } }] },
    });

    // Delete comment contents and likes from MongoDB
    await this.commentContentModel.deleteMany({ commentId: { $in: commentIds } });
    await this.commentLikeDetailsModel.deleteMany({ commentId: { $in: commentIds } });
  }

  /**
   * Create comment on a story
   */
  async createComment(
    storyId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<any> {
    // Check if story exists
    const story = await this.storyModel.findByPk(storyId);
    if (!story) {
      throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
    }

    // If parentId exists, validate the parent comment
    if (createCommentDto.parentId) {
      const parentComment = await this.commentModel.findByPk(
        createCommentDto.parentId,
      );
      if (!parentComment || parentComment.storyId !== storyId) {
        throw new HttpException(
          'Parent comment not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Create comment in PostgreSQL
    const comment = await this.commentModel.create({
      storyId,
      userId,
      parentId: createCommentDto.parentId,
    } as any);

    // Store comment content in MongoDB
    await this.commentContentModel.create({
      commentId: comment.id,
      content: createCommentDto.content,
      createdAt: new Date(),
    });

    // Update comments count
    await this.storyModel.update(
      { commentsCount: story.commentsCount + 1 },
      { where: { id: storyId } },
    );

    // Get user info
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...comment.toJSON(),
      user: {
        id: user.id,
        name: user.name,
        dp_url: user.dp_url,
        bio: user.bio,
      },
      content: createCommentDto.content,
    };
  }

  /**
   * Get comments for a story with replies
   */
  async getComments(storyId: string, limit: number, offset: number): Promise<any> {
    const comments = await this.commentModel.findAll({
      where: { storyId, parentId: null as any }, // Only top-level comments
      include: [
        { model: User, attributes: ['id', 'name', 'dp_url', 'bio'] },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Get content from MongoDB
    const commentIds = comments.map((c) => c.id);
    const commentContents = await this.commentContentModel.find({
      commentId: { $in: commentIds },
    });
    const contentMap = new Map(
      commentContents.map((cc) => [cc.commentId, cc.content]),
    );

    // Get like details for each comment
    const likeDetails = await this.commentLikeDetailsModel.find({
      commentId: { $in: commentIds },
    });
    const likesMap = new Map(
      likeDetails.map((ld) => [ld.commentId, ld.toJSON()]),
    );

    // Get replies for each comment
    const replyPromises = comments.map(async (comment) => {
      const replies = await this.commentModel.findAll({
        where: { parentId: comment.id },
        include: [
          { model: User, attributes: ['id', 'name', 'dp_url', 'bio'] },
        ],
        order: [['createdAt', 'ASC']],
      });

      // Get reply contents
      if (replies.length > 0) {
        const replyIds = replies.map((r) => r.id);
        const replyContents = await this.commentContentModel.find({
          commentId: { $in: replyIds },
        });
        const replyContentsMap = new Map(
          replyContents.map((rc) => [rc.commentId, rc.content]),
        );

        return replies.map((reply) => ({
          ...reply.toJSON(),
          content: replyContentsMap.get(reply.id),
        }));
      }
      return [];
    });

    const allReplies = await Promise.all(replyPromises);

    return {
      comments: comments.map((comment, idx) => ({
        ...comment.toJSON(),
        content: contentMap.get(comment.id),
        likes: likesMap.get(comment.id) || { count: 0, likes: [] },
        replies: allReplies[idx],
      })),
      total: await this.commentModel.count({ where: { storyId, parentId: null as any } }),
    };
  }

  /**
   * Like/unlike a story
   */
  async toggleStoryLike(storyId: string, userId: string): Promise<any> {
    const story = await this.storyModel.findByPk(storyId);
    if (!story) {
      throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
    }

    // Check if already liked
    const existingLike = await this.likeModel.findOne({
      where: { storyId, userId },
    });

    if (existingLike) {
      // Unlike: remove from PostgreSQL
      await existingLike.destroy();

      // Update count
      await this.storyModel.update(
        { likesCount: story.likesCount - 1 },
        { where: { id: storyId } },
      );

      // Remove from MongoDB
      const likeDetails = await this.storyLikeDetailsModel.findOne({ storyId });
      if (likeDetails) {
        likeDetails.likes = likeDetails.likes.filter(
          (l) => l.userId !== userId,
        );
        likeDetails.count = likeDetails.likes.length;
        await likeDetails.save();
      }

      return { liked: false };
    } else {
      // Like: add to PostgreSQL
      await this.likeModel.create({ storyId, userId } as any);

      // Get user info
      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'name', 'dp_url', 'bio'],
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Update count
      await this.storyModel.update(
        { likesCount: story.likesCount + 1 },
        { where: { id: storyId } },
      );

      // Add to MongoDB (store first 3 likers with details)
      let likeDetails = await this.storyLikeDetailsModel.findOne({ storyId });
      if (!likeDetails) {
        likeDetails = await this.storyLikeDetailsModel.create({
          storyId,
          likes: [],
          count: 0,
          lastUpdated: new Date(),
        });
      }

      const likeEntry = {
        userId: user.id,
        userName: user.name,
        userDpUrl: user.dp_url,
        createdAt: new Date(),
      };

      // Add if not already there
      if (
        !likeDetails.likes.some((l) => l.userId === userId)
      ) {
        likeDetails.likes.unshift(likeEntry);
        // Keep only first 3
        if (likeDetails.likes.length > 3) {
          likeDetails.likes = likeDetails.likes.slice(0, 3);
        }
        likeDetails.count = await this.likeModel.count({ where: { storyId } });
        likeDetails.lastUpdated = new Date();
        await likeDetails.save();
      }

      return { liked: true };
    }
  }

  /**
   * Like/unlike a comment
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<any> {
    const comment = await this.commentModel.findByPk(commentId);
    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    // Check if already liked
    const existingLike = await this.likeModel.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      // Unlike: remove from PostgreSQL
      await existingLike.destroy();

      // Update count
      await this.commentModel.update(
        { likesCount: comment.likesCount - 1 },
        { where: { id: commentId } },
      );

      // Remove from MongoDB
      const likeDetails = await this.commentLikeDetailsModel.findOne({
        commentId,
      });
      if (likeDetails) {
        likeDetails.likes = likeDetails.likes.filter((l) => l.userId !== userId);
        likeDetails.count = likeDetails.likes.length;
        await likeDetails.save();
      }

      return { liked: false };
    } else {
      // Like: add to PostgreSQL
      await this.likeModel.create({ commentId, userId } as any);

      // Get user info
      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'name', 'dp_url', 'bio'],
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Update count
      await this.commentModel.update(
        { likesCount: comment.likesCount + 1 },
        { where: { id: commentId } },
      );

      // Add to MongoDB (store first 3 likers with details)
      let likeDetails = await this.commentLikeDetailsModel.findOne({
        commentId,
      });
      if (!likeDetails) {
        likeDetails = await this.commentLikeDetailsModel.create({
          commentId,
          likes: [],
          count: 0,
          lastUpdated: new Date(),
        });
      }

      const likeEntry = {
        userId: user.id,
        userName: user.name,
        userDpUrl: user.dp_url,
        createdAt: new Date(),
      };

      // Add if not already there
      if (
        !likeDetails.likes.some((l) => l.userId === userId)
      ) {
        likeDetails.likes.unshift(likeEntry);
        // Keep only first 3
        if (likeDetails.likes.length > 3) {
          likeDetails.likes = likeDetails.likes.slice(0, 3);
        }
        likeDetails.count = await this.likeModel.count({
          where: { commentId },
        });
        likeDetails.lastUpdated = new Date();
        await likeDetails.save();
      }

      return { liked: true };
    }
  }
}

