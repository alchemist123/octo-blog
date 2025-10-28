import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { CheckExistDto } from './dto/check-exist.dto';
import { AddInterestDto } from './dto/add-interest.dto';
import { SubscribeUserDto } from './dto/subscribe-user.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt.guard';
import {
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiSecurity,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@ApiTags('user')
@ApiSecurity('x-access-token')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Throttle({ medium: { ttl: 10000, limit: 10 } }) // 10 requests per 10 seconds
  getUser(): string {
    return 'hello world';
  }

  @Get('check-exist')
  @Throttle({ medium: { ttl: 10000, limit: 10 } })
  async checkExist(
    @Query() query: CheckExistDto,
  ): Promise<{ exists: boolean }> {
    const { type, value } = query;

    try {
      let exists: boolean;

      if (type === 'email') {
        exists = await this.userService.checkEmailExist(value);
      } else if (type === 'username') {
        exists = await this.userService.checkUsernameExist(value);
      } else {
        throw new HttpException(
          'Invalid type. Must be "email" or "username"',
          HttpStatus.BAD_REQUEST,
        );
      }

      return { exists };
    } catch (error) {
      throw new HttpException(
        'Error checking existence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('interests')
  @UseGuards(JwtAuthGuard)
  async addInterest(
    @Req() request: any,
    @Body() addInterestDto: AddInterestDto,
  ): Promise<{ message: string; interests: string[] }> {
    const user = request.user;
    await this.userService.addInterest(user.id, addInterestDto.interest);
    const updatedInterests = await this.userService.getUserInterests(user.id);
    return {
      message: 'Interest added successfully',
      interests: updatedInterests,
    };
  }

  @Delete('interests')
  @UseGuards(JwtAuthGuard)
  async removeInterest(
    @Req() request: any,
    @Body() addInterestDto: AddInterestDto,
  ): Promise<{ message: string; interests: string[] }> {
    const user = request.user;
    await this.userService.removeInterest(user.id, addInterestDto.interest);
    const updatedInterests = await this.userService.getUserInterests(user.id);
    return {
      message: 'Interest removed successfully',
      interests: updatedInterests,
    };
  }

  @Get('interests')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  async getInterests(@Req() request: any): Promise<{ interests: string[] }> {
    const user = request.user;
    const interests = await this.userService.getUserInterests(user.id);
    return { interests };
  }

  /**
   * Subscribe to a user
   */
  @Post('subscribe')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Subscribe to a user' })
  @ApiCreatedResponse({ description: 'Successfully subscribed to user' })
  @ApiBadRequestResponse({ description: 'Invalid payload or cannot subscribe to yourself' })
  @ApiConflictResponse({ description: 'Already subscribed to this user' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async subscribeToUser(
    @Req() request: any,
    @Body() subscribeUserDto: SubscribeUserDto,
  ): Promise<{ message: string; subscription: any }> {
    const user = request.user;
    const subscription = await this.userService.subscribeToUser(
      user.id,
      subscribeUserDto.userId,
    );
    return {
      message: 'Successfully subscribed to user',
      subscription,
    };
  }

  /**
   * Unsubscribe from a user
   */
  @Delete('subscribe/:userId')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unsubscribe from a user' })
  @ApiOkResponse({ description: 'Successfully unsubscribed from user' })
  @ApiBadRequestResponse({ description: 'Invalid user ID or cannot unsubscribe from yourself' })
  @ApiNotFoundResponse({ description: 'Subscription not found or user not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async unsubscribeFromUser(
    @Req() request: any,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    const user = request.user;
    await this.userService.unsubscribeFromUser(user.id, userId);
    return { message: 'Successfully unsubscribed from user' };
  }

  /**
   * Get subscribers for a user
   */
  @Get('subscribers')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get subscribers list',
    description: 'If userId is provided in query, returns that user\'s subscribers. Otherwise, returns the authenticated user\'s subscribers.'
  })
  @ApiOkResponse({ 
    description: 'Subscribers fetched successfully',
    schema: {
      type: 'object',
      properties: {
        subscribers: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              subscribedAt: { type: 'string', format: 'date-time' },
              subscriber: { type: 'object' }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        size: { type: 'number' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getSubscribers(
    @Req() request: any,
    @Query('userId') userId?: string,
  ): Promise<{ subscribers: any[]; total: number; page: number; size: number }> {
    const pagination = request.pagination || {
      page: 1,
      size: 20,
      limit: 20,
      offset: 0,
    };

    const { limit, offset, page, size } = pagination;

    // Use provided userId or authenticated user's ID
    const targetUserId = userId || request.user.id;

    const result = await this.userService.getSubscribers(targetUserId, limit, offset);

    return {
      ...result,
      page,
      size,
    };
  }

  /**
   * Get users that the authenticated user is subscribed to (following)
   */
  @Get('following')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get users that the authenticated user is following' })
  @ApiOkResponse({ 
    description: 'Following list fetched successfully',
    schema: {
      type: 'object',
      properties: {
        following: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              subscribedAt: { type: 'string', format: 'date-time' },
              user: { type: 'object' }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        size: { type: 'number' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getFollowing(@Req() request: any): Promise<{ following: any[]; total: number; page: number; size: number }> {
    const pagination = request.pagination || {
      page: 1,
      size: 20,
      limit: 20,
      offset: 0,
    };

    const { limit, offset, page, size } = pagination;
    const result = await this.userService.getFollowing(request.user.id, limit, offset);

    return {
      ...result,
      page,
      size,
    };
  }

  /**
   * Get user profile
   */
  @Get('profile')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'If userId is provided in query, returns that user\'s profile. Otherwise, returns the authenticated user\'s profile.'
  })
  @ApiOkResponse({ 
    description: 'User profile fetched successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        userName: { type: 'string' },
        email: { type: 'string' },
        dp_url: { type: 'string' },
        bio: { type: 'string' },
        location: { type: 'string' },
        personal_website: { type: 'array' },
        interests: { type: 'array', items: { type: 'string' } },
        subscribersCount: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getProfile(
    @Req() request: any,
    @Query('userId') userId?: string,
  ): Promise<any> {
    // Use provided userId or authenticated user's ID
    const targetUserId = userId || request.user.id;
    
    const profile = await this.userService.getUserProfile(targetUserId);
    return profile;
  }
}
