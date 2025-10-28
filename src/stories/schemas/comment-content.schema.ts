import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommentContentDocument = CommentContent & Document;

@Schema({ collection: 'comments' })
export class CommentContent extends Document {
  @Prop({ required: true, unique: true })
  commentId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  mentions: string[]; // User mentions in the comment

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const CommentContentSchema = SchemaFactory.createForClass(CommentContent);

