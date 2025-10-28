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
import { Like } from '../shared/models/Like';
import { CommentLike } from '../shared/models/CommentLike';
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
import { Comment as CommentMongo, CommentSchema } from './schemas/comment.schema';
// CommentLikeDetails removed - using PostgreSQL likes table
import { StoryAggregate } from './schemas/story-aggregate.schema';
import {
  StoryBlock,
  StoryBlockSchema,
} from './schemas/story-block.schema';
import { CreateStoryBlockDto } from './dto/create-story-block.dto';
import { UpdateStoryBlockDto } from './dto/update-story-block.dto';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story) private readonly storyModel: typeof Story,
    @InjectModel(Like) private readonly likeModel: typeof Like,
    @InjectModel(CommentLike) private readonly commentLikeModel: typeof CommentLike,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Mushroom) private readonly mushroomModel: typeof Mushroom,
    @InjectMongooseModel('StoryContent', 'blog')
    private readonly storyContentModel: Model<StoryContent>,
    @InjectMongooseModel('Comment', 'blog')
    private readonly commentMongoModel: Model<CommentMongo>,
    @InjectMongooseModel('StoryAggregate', 'blog')
    private readonly storyAggregateModel: Model<StoryAggregate>,
    @InjectMongooseModel('StoryBlock', 'blog')
    private readonly storyBlockModel: Model<StoryBlock>,
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
   * Get all stories with filters from MongoDB
   */
  async findAll(
    filter: FilterStoryDto,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ stories: any[]; total: number }> {
    const query: any = {};

    if (filter.postType) {
      query.postType = filter.postType;
    }

    if (filter.storyType) {
      query.storyType = filter.storyType;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.authorId) {
      query.authorId = filter.authorId;
    }

    if (filter.mushroomId) {
      query.mushroomId = filter.mushroomId;
    }

    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { tagLine: { $regex: filter.search, $options: 'i' } },
        { hashtags: { $in: [filter.search] } },
      ];
    }

    const stories = await this.storyAggregateModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    const total = await this.storyAggregateModel.countDocuments(query);

    return {
      stories: stories.map((story) => story.toJSON()),
      total,
    };
  }

  /**
   * Get my stories with filters (status) and pagination from MongoDB
   * @param userId - The authenticated user's ID from JWT token (used as authorId)
   * @param status - Optional filter by story status (draft, requested, published)
   * @param limit - Number of stories to retrieve per page
   * @param offset - Number of stories to skip
   */
  async findMyStories(
    userId: string, // From JWT token - always the authenticated user's ID
    status?: 'draft' | 'requested' | 'published',
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ stories: any[]; total: number }> {
    const query: any = {
      authorId: userId, // Filter by authenticated user's ID from token
    };

    if (status) {
      query.status = status;
    }

    const stories = await this.storyAggregateModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    const total = await this.storyAggregateModel.countDocuments(query);

    return {
      stories: stories.map((story) => story.toJSON()),
      total,
    };
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

    // Update MongoDB aggregate document
    await this.storyAggregateModel.findOneAndUpdate(
      { storyId: id },
      { $set: updateStoryDto },
      { upsert: true },
    );

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

    // Delete related comments from MongoDB and likes from PostgreSQL
    const comments = await this.commentMongoModel.find({
      $or: [{ parentId: id }, { parentId: { $in: [id] } }],
    });
    
    // Delete likes for this story
    await this.likeModel.destroy({
      where: { storyId: id },
    });

    // Delete comment contents from MongoDB
    // comment contents stored in PostgreSQL; no MongoDB cleanup needed
  }

  /**
   * Create comment on a story
   */
  async createComment(
    storyId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<any> {
    // Get user info for the comment
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'name', 'dp_url', 'bio'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // If parentId exists, validate the parent comment exists in MongoDB
    if (createCommentDto.parentId) {
      const parentComment = await this.commentMongoModel.findById(
        createCommentDto.parentId,
      );
      if (!parentComment) {
        throw new HttpException(
          'Parent comment not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Create comment in MongoDB
    const comment = await this.commentMongoModel.create({
      parentId: createCommentDto.parentId || storyId,
      content: createCommentDto.content,
      userdetails: {
        name: user.name || '',
        id: user.id || '',
        dp_url: user.dp_url || '',
        bio: user.bio || '',
      },
      likesCount: 0,
      repliesCount: 0,
    });

    // Get total comment count from MongoDB for this story
    const totalComments = await this.commentMongoModel.countDocuments({
      $or: [{ parentId: storyId }, { _id: storyId }],
    });

    // If this is a reply, update parent comment's repliesCount
    if (createCommentDto.parentId) {
      await this.commentMongoModel.findByIdAndUpdate(createCommentDto.parentId, {
        $inc: { repliesCount: 1 },
      });
    }

    // Update MongoDB story aggregate with comment count
    let updateData: any = {
      $set: {
        commentsCount: totalComments,
      },
    };

    // Only add to comment array if:
    // 1. This is not a reply (no parentId)
    // 2. Total comment count is less than 5
    if (!createCommentDto.parentId && totalComments <= 5) {
      // Get existing comments array
      const storyAggregate = await this.storyAggregateModel.findOne({ storyId });
      const existingComments = storyAggregate?.comment || [];

      // Check if user is already in the array
      const userAlreadyInArray = existingComments.some((c: any) => c.id === userId);

      if (!userAlreadyInArray) {
        // Add this user to the array
        updateData.$push = {
          comment: {
            name: user.name || '',
            dp_url: user.dp_url || '',
            bio: user.bio || '',
            id: user.id || '',
          },
        };
      }
    }

    // Update MongoDB story aggregate
    await this.storyAggregateModel.findOneAndUpdate({ storyId }, updateData);

    return {
      ...comment.toJSON(),
      userdetails: comment.userdetails,
    };
  }

  /**
   * Get comments for a story or replies for a comment from MongoDB
   */
  async getComments(
    parentId: string,
    limit: number = 5,
    offset: number = 0,
  ): Promise<any> {
    // Query MongoDB for comments with the given parentId
    const query = { parentId };

    const comments = await this.commentMongoModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    const total = await this.commentMongoModel.countDocuments(query);

    return {
      comments: comments.map((comment) => {
        const commentObj = comment.toJSON();
        const doc = comment as any;
        return {
          ...commentObj,
          id: doc._id?.toString() || commentObj.id,
          replyCount: commentObj.repliesCount,
          likesCount: commentObj.likesCount,
        };
      }),
      total,
    };
  }

  /**
   * Like/unlike a story
   */
  async toggleStoryLike(storyId: string, userId: string): Promise<any> {
    // Check if story exists in PostgreSQL
    const story = await this.storyModel.findByPk(storyId);
    if (!story) {
      throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
    }

    // Check if already liked in PostgreSQL
    const existingLike = await this.likeModel.findOne({
      where: { storyId, userId },
    });

    if (existingLike) {
      // Unlike: destroy the entry in PostgreSQL
      await existingLike.destroy();
      
      // Get total count from PostgreSQL
      const totalLikes = await this.likeModel.count({ where: { storyId } });
      
      // Get first 3 likers from PostgreSQL
      let likes: any[] = [];
      if (totalLikes < 3) {
        likes = await this.likeModel.findAll({
          where: { storyId },
          include: [{ model: User, attributes: ['id', 'name', 'dp_url', 'bio'] }],
          order: [['createdAt', 'ASC']],
          limit: 3,
        });
      }


      // Update MongoDB story aggregate
      await this.storyAggregateModel.findOneAndUpdate(
        { storyId },
        {
          $set: {
            likesCount: totalLikes-1,
            like: likes.map((l: any) => ({
              name: l.user?.name || '',
              dp_url: l.user?.dp_url || '',
              bio: l.user?.bio || '',
              id: l.user?.id || '',
            })),
          },
        },
      );

      return { liked: false };
    } else {
      // Like: create entry in PostgreSQL
      await this.likeModel.create({ storyId, userId } as any);

      // Get user info
      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'name', 'dp_url', 'bio'],
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Get total count from PostgreSQL
      const totalLikes = await this.likeModel.count({ where: { storyId } });
      
      // Get first 3 likers from PostgreSQL
      let likes: any[] = [];
      if (totalLikes <= 3) {
        likes = await this.likeModel.findAll({
          where: { storyId },
          include: [{ model: User, attributes: ['id', 'name', 'dp_url', 'bio'] }],
          order: [['createdAt', 'ASC']],
          limit: 3,
        });
      }

      // Update MongoDB story aggregate
      await this.storyAggregateModel.findOneAndUpdate(
        { storyId },
        {
          $set: {
            likesCount: totalLikes+1,
            like: likes.map((l: any) => ({
              name: l.user?.name || '',
              dp_url: l.user?.dp_url || '',
              bio: l.user?.bio || '',
              id: l.user?.id || '',
            })),
          },
        },
      );

      return { liked: true };
    }
  }

  /**
   * Like/unlike a comment (from MongoDB)
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<any> {
    const comment = await this.commentMongoModel.findById(commentId);
    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    // Check if already liked in PostgreSQL (comment_likes)
    const existingLike = await this.commentLikeModel.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      // Unlike: remove from PostgreSQL
      await existingLike.destroy();

      // Update count in MongoDB
      await this.commentMongoModel.findByIdAndUpdate(commentId, {
        $inc: { likesCount: -1 },
      });

      return { liked: false };
    } else {
      // Like: add to PostgreSQL (comment_likes)
      await this.commentLikeModel.create({ commentId, userId } as any);

      // Update count in MongoDB
      await this.commentMongoModel.findByIdAndUpdate(commentId, {
        $inc: { likesCount: 1 },
      });

      return { liked: true };
    }
  }

  /**
   * Add a content block to a story
   */
  async addStoryBlock(
    storyId: string,
    userId: string,
    createBlockDto: CreateStoryBlockDto,
  ): Promise<any> {
    // Verify story exists and user owns it
    const story = await this.storyModel.findByPk(storyId);
    if (!story) {
      throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
    }

    if (story.authorId !== userId) {
      throw new HttpException(
        'Forbidden: You can only add blocks to your own stories',
        HttpStatus.FORBIDDEN,
      );
    }

    // Get author details
    const author = await this.userModel.findByPk(userId, {
      attributes: ['id', 'name', 'dp_url', 'bio'],
    });

    if (!author) {
      throw new HttpException('Author not found', HttpStatus.NOT_FOUND);
    }

    // Create the block
    const block = await this.storyBlockModel.create({
      storyId,
      orderNo: createBlockDto.orderNo,
      authorId: userId,
      authorDetails: {
        name: author.name,
        dp_url: author.dp_url,
        bio: author.bio,
      },
      type: createBlockDto.type,
      content: createBlockDto.content,
      mongoId: createBlockDto.mongoId,
      metadata: {
        lastEdited: new Date(),
      },
    });

    return block.toJSON();
  }

  /**
   * Update a story block
   */
  async updateStoryBlock(
    blockId: string,
    userId: string,
    updateBlockDto: UpdateStoryBlockDto,
  ): Promise<any> {
    const block = await this.storyBlockModel.findById(blockId);
    if (!block) {
      throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
    }

    // Verify user owns the block
    if (block.authorId !== userId) {
      throw new HttpException(
        'Forbidden: You can only update your own blocks',
        HttpStatus.FORBIDDEN,
      );
    }

    // Update only content and type
    if (updateBlockDto.type !== undefined) {
      block.type = updateBlockDto.type;
    }
    if (updateBlockDto.content !== undefined) {
      block.content = updateBlockDto.content;
    }
    
    // Update last edited timestamp
    block.metadata = {
      ...block.metadata,
      lastEdited: new Date(),
    };

    await block.save();
    return block.toJSON();
  }

  /**
   * Get all blocks for a story with pagination
   */
  async getStoryBlocks(
    storyId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ blocks: any[]; total: number }> {
    // Verify story exists
    const story = await this.storyModel.findByPk(storyId);
    if (!story) {
      throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
    }

    const blocks = await this.storyBlockModel
      .find({ storyId })
      .sort({ orderNo: 1 }) // Sort by orderNo ascending
      .limit(limit)
      .skip(offset)
      .exec();

    const total = await this.storyBlockModel.countDocuments({ storyId });

    return {
      blocks: blocks.map((block) => block.toJSON()),
      total,
    };
  }

  /**
   * Delete a story block
   */
  async deleteStoryBlock(blockId: string, userId: string): Promise<void> {
    const block = await this.storyBlockModel.findById(blockId);
    if (!block) {
      throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
    }

    // Verify user owns the block
    if (block.authorId !== userId) {
      throw new HttpException(
        'Forbidden: You can only delete your own blocks',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.storyBlockModel.deleteOne({ _id: blockId });
  }
}

