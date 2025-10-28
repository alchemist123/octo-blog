import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoryContentDocument = StoryContent & Document;

@Schema({ collection: 'story_content' })
export class StoryContent extends Document {
  @Prop({ required: true, unique: true })
  storyId: string;

  @Prop({ type: Object, required: false })
  content?: any; // Store rich content as JSON

  @Prop({ type: Object })
  metadata?: {
    wordCount?: number;
    readingTime?: number;
    lastEdited?: Date;
  };
}

export const StoryContentSchema = SchemaFactory.createForClass(StoryContent);

