import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MongooseModule } from '@nestjs/mongoose';
import { Story } from '../shared/models/Story';
import { Comment } from '../shared/models/Comment';
import { Like } from '../shared/models/Like';
import { User } from '../shared/models/User';
import { Mushroom } from '../shared/models/Mushroom';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { GatekeeperModule } from '../gatekeeper/gatekeeper.module';
import { AuthModule } from '../authentication/auth.module';
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
import { StoryAggregate, StoryAggregateSchema } from './schemas/story-aggregate.schema';

@Module({
  imports: [
    SequelizeModule.forFeature([Story, Comment, Like, User, Mushroom]),
    MongooseModule.forFeature([
      { name: 'StoryContent', schema: StoryContentSchema },
      { name: 'CommentContent', schema: CommentContentSchema },
      { name: 'StoryLikeDetails', schema: StoryLikeDetailsSchema },
      { name: 'CommentLikeDetails', schema: CommentLikeDetailsSchema },
      { name: 'StoryAggregate', schema: StoryAggregateSchema },
    ], 'blog'),
    GatekeeperModule,
    AuthModule,
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}

