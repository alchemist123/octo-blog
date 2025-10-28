import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type StoryAggregateDocument = StoryAggregate & Document;

@Schema({ collection: 'stories', timestamps: true })
export class StoryAggregate extends Document {
  @Prop({ type: String, required: true, unique: true })
  storyId: string; // mirrors Postgres story id

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({
    type: [{
      name: { type: String },
      dp_url: { type: String },
      bio: { type: String },
      id: { type: String }
    }],
    default: []
  })
  like: { name: string; dp_url?: string; bio?: string; id?: string }[];

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({
    type: [{
      name: { type: String },
      dp_url: { type: String },
      bio: { type: String },
      id: { type: String }
    }],
    default: []
  })
  comment: { name: string; dp_url?: string; bio?: string; id?: string }[];

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  type?: string;

  @Prop()
  thumbnails_url?: string;

  @Prop()
  tagLine?: string;

  @Prop({ type: [String], default: [] })
  hashtags?: string[];

  @Prop({ type: String, default: null })
  mushroomId?: string | null;

  @Prop({ type: Object, default: {} })
  mushroom?: Record<string, any>;

  @Prop({ type: Object, default: {} })
  authordetails?: { name?: string; dp_url?: string };

  @Prop({ type: String, required: true, enum: ['self', 'mushroom'] })
  postType: 'self' | 'mushroom';

  @Prop({ type: String, required: true, enum: ['tutorial', 'blog'] })
  storyType: 'tutorial' | 'blog';

  @Prop({ type: String, default: 'draft', enum: ['draft', 'requested', 'published'] })
  status: 'draft' | 'requested' | 'published';

  @Prop({ type: String, required: true })
  authorId: string;

  @Prop({ type: Number, default: null })
  sentimentalScore?: number | null;
}

export const StoryAggregateSchema = SchemaFactory.createForClass(StoryAggregate);

// Configure the schema to use _id as a string and ensure storyId is unique
StoryAggregateSchema.set('_id', true);
StoryAggregateSchema.index({ storyId: 1 }, { unique: true });

