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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { FilterStoryDto } from './dto/filter-story.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateLikeDto } from './dto/create-like.dto';
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
  constructor(private readonly storiesService: StoriesService) {}

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
   * Get all stories with filters
   */
  @Get()
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all stories with filters' })
  @ApiOkResponse({ description: 'Stories fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAll(@Query() filter: FilterStoryDto): Promise<{ stories: any[] }> {
    const stories = await this.storiesService.findAll(filter);
    return { stories };
  }

  /**
   * Get story by ID with content
   */
  @Get(':id')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get story by id with content' })
  @ApiOkResponse({ description: 'Story fetched successfully' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getById(@Param('id') id: string): Promise<{ story: any }> {
    const story = await this.storiesService.findById(id);
    return { story };
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
   * Get comments for a story
   */
  @Get(':id/comments')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get comments for a story' })
  @ApiOkResponse({ description: 'Comments fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Story not found' })
  async getComments(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ comments: any[]; total: number }> {
    const pagination = request.pagination || {
      limit: 20,
      offset: 0,
    };

    const result = await this.storiesService.getComments(
      id,
      pagination.limit,
      pagination.offset,
    );
    return result;
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
}

