import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { Story } from '../shared/models/Story';
import { Like } from '../shared/models/Like';
import { SavedStory } from '../shared/models/SavedStory';
import { UserSubscription } from '../shared/models/UserSubscription';
import { Subscriber } from '../shared/models/Subscriber';
import { User } from '../shared/models/User';
import { Mushroom } from '../shared/models/Mushroom';
import { RecommendationService } from './recommendation.service';
import { RecommendationComputeService } from './recommendation-compute.service';
import { RecommendationSchedulerService } from './recommendation-scheduler.service';
import { RecommendationController } from './recommendation.controller';
import { StoryAggregate, StoryAggregateSchema } from '../stories/schemas/story-aggregate.schema';
import {
  UserRecommendation,
  UserRecommendationSchema,
} from './schemas/user-recommendation.schema';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Story,
      Like,
      SavedStory,
      UserSubscription,
      Subscriber,
      User,
      Mushroom,
    ]),
    MongooseModule.forFeature(
      [
        { name: 'StoryAggregate', schema: StoryAggregateSchema },
        { name: 'UserRecommendation', schema: UserRecommendationSchema },
      ],
      'blog',
    ),
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationComputeService,
    RecommendationSchedulerService,
  ],
  exports: [
    RecommendationService,
    RecommendationComputeService,
    RecommendationSchedulerService,
  ],
})
export class RecommendationModule {}

