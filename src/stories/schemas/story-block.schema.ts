import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoryBlockDocument = StoryBlock & Document;

@Schema({ collection: 'story_blocks', timestamps: true })
export class StoryBlock extends Document {
  @Prop({ type: String, required: true, index: true })
  storyId: string; // From PostgreSQL stories table

  @Prop({ type: String })
  mongoId?: string; // MongoDB _id of the story aggregate document for lookup

  @Prop({ type: Number, required: true, default: 0 })
  orderNo: number; // Order of the content block

  @Prop({
    type: {
      lastEdited: { type: Date },
    },
  })
  metadata?: {
    lastEdited?: Date;
  };

  @Prop({ type: String, required: true, index: true })
  authorId: string; // Author of the story

  @Prop({ type: Object })
  authorDetails?: {
    name?: string;
    dp_url?: string;
    bio?: string;
  };

  @Prop({
    type: String,
    required: true,
    enum: ['text', 'video_url', 'image', 'html', 'footer'],
  })
  type: 'text' | 'video_url' | 'image' | 'html' | 'footer';

  @Prop({ type: Object, required: true })
  content: Record<string, any>;
}

export const StoryBlockSchema = SchemaFactory.createForClass(StoryBlock);

// Create indexes for efficient queries
StoryBlockSchema.index({ storyId: 1, orderNo: 1 });
StoryBlockSchema.index({ authorId: 1 });
