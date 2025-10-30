import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { Story } from '../shared/models/Story';
import { Like } from '../shared/models/Like';
import { CommentLike } from '../shared/models/CommentLike';
import { User } from '../shared/models/User';
import { Mushroom } from '../shared/models/Mushroom';
import { MushroomAdmin } from '../shared/models/MushroomAdmin';
import { SavedStory } from '../shared/models/SavedStory';
import { UserStoryView } from '../shared/models/UserStoryView';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { GatekeeperModule } from '../gatekeeper/gatekeeper.module';
import { AuthModule } from '../authentication/auth.module';
import { MiddlewaresModule } from '../shared/middlewares/middlewares.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { RedisCacheInterceptor } from '../shared/interceptors/redis-cache.interceptor';
import {
  StoryContent,
  StoryContentSchema,
} from './schemas/story-content.schema';
import { StoryAggregate, StoryAggregateSchema } from './schemas/story-aggregate.schema';
import { StoryBlock, StoryBlockSchema } from './schemas/story-block.schema';
import { Comment as CommentMongo, CommentSchema } from './schemas/comment.schema';
import { PaginationMiddleware } from '../shared/middlewares/pagination.middleware';
import { RequestMethod } from '@nestjs/common';

@Module({
  imports: [
    SequelizeModule.forFeature([Story, Like, CommentLike, User, Mushroom, MushroomAdmin, SavedStory, UserStoryView]),
    MongooseModule.forFeature([
      { name: 'StoryContent', schema: StoryContentSchema },
      { name: 'StoryAggregate', schema: StoryAggregateSchema },
      { name: 'StoryBlock', schema: StoryBlockSchema },
      { name: 'Comment', schema: CommentSchema },
    ], 'blog'),
    MiddlewaresModule,
    GatekeeperModule,
    AuthModule,
    RecommendationModule,
  ],
  controllers: [StoriesController],
  providers: [StoriesService, RedisCacheInterceptor],
  exports: [StoriesService],
})
export class StoriesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PaginationMiddleware)
      .forRoutes(
        { path: 'stories', method: RequestMethod.GET },
        { path: 'stories/my-stories', method: RequestMethod.GET },
        { path: 'stories/:storyId/blocks', method: RequestMethod.GET },
        { path: 'stories/comments', method: RequestMethod.GET },
      );
  }
}

