import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { StoriesService } from './stories.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import { RedisCacheInterceptor } from '../shared/interceptors/redis-cache.interceptor';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { FilterStoryDto } from './dto/filter-story.dto';
import { MyStoriesFilterDto } from './dto/my-stories-filter.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateStoryBlockDto } from './dto/create-story-block.dto';
import { UpdateStoryBlockDto } from './dto/update-story-block.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt.guard';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('stories')
@ApiSecurity('x-access-token')
@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly recommendationService: RecommendationService,
  ) {}

  /**
   * Create a new story
   */
  @Post()
  @Throttle({ medium: { ttl: 10000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new story' })
  @ApiCreatedResponse({ description: 'Story created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @Body() createStoryDto: CreateStoryDto,
    @Req() request: any,
  ): Promise<{ story: any }> {
    const user = request.user;
    const story = await this.storiesService.create(user, createStoryDto);
    return { story };
  }

  /**
   * Get all stories with filters and pagination
   */
  @Get()
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all stories with filters and pagination' })
  @ApiOkResponse({ 
    description: 'Stories fetched successfully',
    schema: {
      type: 'object',
      properties: {
        stories: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        page: { type: 'number' },
        size: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAll(
    @Query() filter: FilterStoryDto,
    @Req() request: any,
  ): Promise<{
    stories: any[];
    total: number;
    page: number;
    size: number;
  }> {
    const pagination = request.pagination || {
      page: 1,
      size: 20,
      limit: 20,
      offset: 0,
    };

    const { limit, offset, page, size } = pagination;

    const result = await this.storiesService.findAll(filter, limit, offset);

    return {
      stories: result.stories,
      total: result.total,
      page,
      size,
    };
  }

  /**
   * Get my stories with filters (drafted, requested, published) and pagination
   */
  @Get('my-stories')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get my stories with filters and pagination',
    description: 'Retrieve stories created by the authenticated user. Filter by status (draft, requested, published) and paginate results using query parameters: ?status=draft&page=1&size=10'
  })
  @ApiOkResponse({ 
    description: 'My stories fetched successfully',
    schema: {
      type: 'object',
      properties: {
        stories: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        page: { type: 'number' },
        size: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyStories(
    @Query() filter: MyStoriesFilterDto,
    @Req() request: any,
  ): Promise<{
    stories: any[];
    total: number;
    page: number;
    size: number;
  }> {
    const pagination = request.pagination || {
      page: 1,
      size: 10,
      limit: 10,
      offset: 0,
    };

    const { limit, offset, page, size } = pagination;
    
    // Get authenticated user from JWT token (authorId)
    const user = request.user;
    
    if (!user || !user.id) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.storiesService.findMyStories(
      user.id,
      filter.status,
      limit,
      offset,
    );

    return {
      stories: result.stories,
      total: result.total,
      page,
      size,
    };
  }

  /**
   * Get all blocks for a story with pagination
   */
  @Get(':storyId/blocks')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all content blocks for a story with pagination' })
  @ApiOkResponse({ 
    description: 'Story blocks fetched successfully',
    schema: {
      type: 'object',
      properties: {
        blocks: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        page: { type: 'number' },
        size: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  async getStoryBlocks(
    @Param('storyId') storyId: string,
    @Req() request: any,
  ): Promise<{ blocks: any[]; total: number; page: number; size: number }> {
    const pagination = request.pagination || {
      page: 1,
      size: 20,
      limit: 20,
      offset: 0,
    };

    const { limit, offset, page, size } = pagination;

    const result = await this.storiesService.getStoryBlocks(storyId, limit, offset);

    return {
      blocks: result.blocks,
      total: result.total,
      page,
      size,
    };
  }

  /**
   * Add a content block to a story
   */
  @Post(':storyId/blocks')
  @Throttle({ medium: { ttl: 10000, limit: 15 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a content block to a story' })
  @ApiCreatedResponse({ description: 'Story block created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  async addStoryBlock(
    @Param('storyId') storyId: string,
    @Body() createBlockDto: CreateStoryBlockDto,
    @Req() request: any,
  ): Promise<{ block: any }> {
    const user = request.user;
    const block = await this.storiesService.addStoryBlock(
      storyId,
      user.id,
      createBlockDto,
    );
    return { block };
  }

  /**
   * Update story
   */
  @Put(':id')
  @Throttle({ medium: { ttl: 10000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a story' })
  @ApiOkResponse({ description: 'Story updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  async update(
    @Param('id') id: string,
    @Body() updateStoryDto: UpdateStoryDto,
    @Req() request: any,
  ): Promise<{ story: any }> {
    const user = request.user;
    const story = await this.storiesService.update(id, user.id, updateStoryDto);
    return { story };
  }

  /**
   * Delete story
   */
  @Delete(':id')
  @Throttle({ medium: { ttl: 10000, limit: 5 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a story' })
  @ApiOkResponse({ description: 'Story deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  async delete(@Param('id') id: string, @Req() request: any): Promise<{ message: string }> {
    const user = request.user;
    await this.storiesService.delete(id, user.id);
    return { message: 'Story deleted successfully' };
  }

  /**
   * Publish a story
   */
  @Post(':id/publish')
  @Throttle({ medium: { ttl: 10000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Publish a story' })
  @ApiOkResponse({ description: 'Story published or requested successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  @ApiBadRequestResponse({ description: 'Story already published or requested' })
  async publishStory(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ story: any; message: string }> {
    const user = request.user;
    const story = await this.storiesService.publishStory(id, user.id);
    return {
      story,
      message: `Story ${story.status === 'requested' ? 'requested for approval' : 'published'} successfully`,
    };
  }

  /**
   * Approve a requested story (admin only)
   */
  @Post(':id/approve')
  @Throttle({ medium: { ttl: 10000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve a requested story (admin only)' })
  @ApiOkResponse({ description: 'Story approved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  @ApiBadRequestResponse({ description: 'Story not in requested status' })
  async approveStory(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ story: any; message: string }> {
    const user = request.user;
    const story = await this.storiesService.approveStory(id, user.id);
    return {
      story,
      message: 'Story approved and published successfully',
    };
  }

  /**
   * Create comment on a story
   */
  @Post(':id/comments')
  @Throttle({ medium: { ttl: 10000, limit: 15 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a comment on a story' })
  @ApiCreatedResponse({ description: 'Comment created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story or parent comment not found' })
  async createComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() request: any,
  ): Promise<{ comment: any }> {
    const user = request.user;
    const comment = await this.storiesService.createComment(
      id,
      user.id,
      createCommentDto,
    );
    return { comment };
  }

  /**
   * Get comments for a story or replies for a comment
   */
  @Get('comments')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get comments for a story or replies for a comment' })
  @ApiOkResponse({ 
    description: 'Comments fetched successfully',
    schema: {
      type: 'object',
      properties: {
        comments: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        page: { type: 'number' },
        size: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  async getComments(
    @Query('parentId') parentId: string,
    @Req() request: any,
  ): Promise<{ comments: any[]; total: number; page: number; size: number }> {
    const pagination = request.pagination || {
      page: 1,
      size: 5, // Default 5 as requested
      limit: 5,
      offset: 0,
    };

    const { limit, offset, page, size } = pagination;

    const result = await this.storiesService.getComments(parentId, limit, offset);

    return {
      ...result,
      page,
      size,
    };
  }

  /**
   * Like/unlike a story
   */
  @Post(':id/like')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Like/unlike a story' })
  @ApiOkResponse({ description: 'Toggles like status' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  async likeStory(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ liked: boolean; message: string }> {
    const user = request.user;
    const result = await this.storiesService.toggleStoryLike(id, user.id);
    return {
      ...result,
      message: result.liked ? 'Story liked' : 'Story unliked',
    };
  }

  /**
   * Save/unsave a story to user's library
   */
  @Post(':id/save')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save/unsave a story' })
  @ApiOkResponse({ description: 'Toggles save status' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  async saveStory(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ saved: boolean; message: string }> {
    const user = request.user;
    const result = await this.storiesService.toggleStorySave(id, user.id);
    return {
      ...result,
      message: result.saved ? 'Story saved' : 'Story unsaved',
    };
  }

  /**
   * Get my saved library
   */
  @Get('library')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user\'s saved library' })
  @ApiOkResponse({ description: 'Returns paginated saved stories' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyLibrary(
    @Req() request: any,
    @Query('page') page = '1',
    @Query('size') size = '10',
  ): Promise<{ stories: any[]; total: number; page: number; size: number }> {
    const user = request.user;
    const result = await this.storiesService.getMyLibrary(user.id, Number(page), Number(size));
    return {
      ...result,
      page: Number(page) || 1,
      size: Number(size) || 10,
    };
  }

  /**
   * Get personalized feed
   */
  @Get('feed')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(RedisCacheInterceptor)
  @ApiOperation({ summary: 'Get personalized feed of stories' })
  @ApiOkResponse({ description: 'Returns personalized feed with recommendations' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPersonalizedFeed(
    @Req() request: any,
    @Query('page') page = '1',
    @Query('size') size = '20',
  ): Promise<{ stories: any[]; total: number; page: number; size: number }> {
    const user = request.user;
    const result = await this.recommendationService.getPersonalizedFeed(
      user.id,
      Number(page) || 1,
      Number(size) || 20,
    );
    return {
      ...result,
      page: Number(page) || 1,
      size: Number(size) || 20,
    };
  }

  /**
   * Like/unlike a comment
   */
  @Post('comments/:commentId/like')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Like/unlike a comment' })
  @ApiOkResponse({ description: 'Toggles like status' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async likeComment(
    @Param('commentId') commentId: string,
    @Req() request: any,
  ): Promise<{ liked: boolean; message: string }> {
    const user = request.user;
    const result = await this.storiesService.toggleCommentLike(commentId, user.id);
    return {
      ...result,
      message: result.liked ? 'Comment liked' : 'Comment unliked',
    };
  }

  /**
   * Update a content block
   */
  @Put('blocks/:blockId')
  @Throttle({ medium: { ttl: 10000, limit: 15 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a story block' })
  @ApiOkResponse({ description: 'Story block updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Block not found' })
  async updateStoryBlock(
    @Param('blockId') blockId: string,
    @Body() updateBlockDto: UpdateStoryBlockDto,
    @Req() request: any,
  ): Promise<{ block: any }> {
    const user = request.user;
    const block = await this.storiesService.updateStoryBlock(
      blockId,
      user.id,
      updateBlockDto,
    );
    return { block };
  }

  /**
   * Delete a content block
   */
  @Delete('blocks/:blockId')
  @Throttle({ medium: { ttl: 10000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a story block' })
  @ApiOkResponse({ description: 'Story block deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Block not found' })
  async deleteStoryBlock(
    @Param('blockId') blockId: string,
    @Req() request: any,
  ): Promise<{ message: string }> {
    const user = request.user;
    await this.storiesService.deleteStoryBlock(blockId, user.id);
    return { message: 'Story block deleted successfully' };
  }
  
  
}

