import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RecommendationService } from './recommendation.service';
import { OptionalJwtAuthGuard } from '../authentication/guards/optional-jwt.guard';
import { RecommendationCacheInterceptor } from '../shared/interceptors/recommendation-cache.interceptor';
import {
  ApiOperation,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  /**
   * Get recommended users - personalized if authenticated, popular if not
   */
  @Get('users')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(RecommendationCacheInterceptor)
  @ApiOperation({
    summary: 'Get recommended users',
    description: 'Returns personalized user recommendations if authenticated, otherwise returns popular users. Token is optional.',
  })
  @ApiOkResponse({ description: 'Returns recommended users' })
  async getRecommendedUsers(
    @Req() request: any,
    @Query('limit') limit = '10',
  ): Promise<any[]> {
    const user = request.user;

    // If user is authenticated, return personalized recommendations
    if (user && user.id) {
      return await this.recommendationService.getRecommendedUsers(
        user.id,
        Number(limit) || 10,
      );
    }

    // Otherwise, return popular users (users with highest subscriber count)
    return await this.recommendationService.getPopularUsers(
      Number(limit) || 10,
    );
  }

  /**
   * Get recommended mushrooms - personalized if authenticated, popular if not
   */
  @Get('mushrooms')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(RecommendationCacheInterceptor)
  @ApiOperation({
    summary: 'Get recommended mushrooms',
    description: 'Returns personalized mushroom recommendations if authenticated, otherwise returns popular mushrooms. Token is optional.',
  })
  @ApiOkResponse({ description: 'Returns recommended mushrooms' })
  async getRecommendedMushrooms(
    @Req() request: any,
    @Query('limit') limit = '10',
  ): Promise<any[]> {
    const user = request.user;

    // If user is authenticated, return personalized recommendations
    if (user && user.id) {
      return await this.recommendationService.getRecommendedMushrooms(
        user.id,
        Number(limit) || 10,
      );
    }

    // Otherwise, return popular mushrooms (mushrooms with highest subscriber count)
    return await this.recommendationService.getPopularMushrooms(
      Number(limit) || 10,
    );
  }

  /**
   * Get recommended stories - personalized if authenticated
   */
  @Get('stories')
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(RecommendationCacheInterceptor)
  @ApiOperation({
    summary: 'Get recommended stories',
    description: 'Returns personalized story recommendations if authenticated, otherwise returns empty. Token is optional.',
  })
  @ApiOkResponse({ description: 'Returns recommended stories' })
  async getRecommendedStories(
    @Req() request: any,
    @Query('page') page = '1',
    @Query('size') size = '20',
  ): Promise<{ stories: any[]; total: number; page: number; size: number }> {
    const user = request.user;

    // If user is authenticated, return personalized recommendations
    if (user && user.id) {
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

    // Otherwise, return empty (recommended stories require authentication for personalization)
    return {
      stories: [],
      total: 0,
      page: Number(page) || 1,
      size: Number(size) || 20,
    };
  }
}

