import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoryLikeDetailsDocument = StoryLikeDetails & Document;
export type CommentLikeDetailsDocument = CommentLikeDetails & Document;

@Schema({ collection: 'story_likes' })
export class StoryLikeDetails extends Document {
  @Prop({ required: true })
  storyId: string;

  @Prop({ type: [Object], default: [] })
  likes: {
    userId: string;
    userName: string;
    userDpUrl?: string;
    createdAt: Date;
  }[];

  @Prop({ default: 0 })
  count: number;

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;
}

export const StoryLikeDetailsSchema = SchemaFactory.createForClass(StoryLikeDetails);

@Schema({ collection: 'comment_likes' })
export class CommentLikeDetails extends Document {
  @Prop({ required: true })
  commentId: string;

  @Prop({ type: [Object], default: [] })
  likes: {
    userId: string;
    userName: string;
    userDpUrl?: string;
    createdAt: Date;
  }[];

  @Prop({ default: 0 })
  count: number;

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;
}

export const CommentLikeDetailsSchema = SchemaFactory.createForClass(CommentLikeDetails);

