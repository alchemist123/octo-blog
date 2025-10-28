import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ collection: 'comments', timestamps: true })
export class Comment extends Document {
  @Prop({ type: String })
  parentId?: string; // Can be commentId or storyId

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Object })
  userdetails?: {
    name?: string;
    id?: string;
    dp_url?: string;
    bio?: string;
  };

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  repliesCount: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);


