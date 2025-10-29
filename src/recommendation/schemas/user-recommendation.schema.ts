import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserRecommendationDocument = UserRecommendation & Document;

@Schema({ collection: 'user_recommendations', timestamps: true })
export class UserRecommendation extends Document {
  @Prop({ type: String, required: true, unique: true, index: true })
  userId: string;

  @Prop({
    type: [
      {
        storyId: { type: String, required: true },
        score: { type: Number, required: true },
        computedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  storyRecommendations: {
    storyId: string;
    score: number;
    computedAt: Date;
  }[];

  @Prop({
    type: [
      {
        mushroomId: { type: String, required: true },
        score: { type: Number, required: true },
        computedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  mushroomRecommendations: {
    mushroomId: string;
    score: number;
    computedAt: Date;
  }[];

  @Prop({
    type: [
      {
        userId: { type: String, required: true },
        score: { type: Number, required: true },
        computedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  userRecommendations: {
    userId: string;
    score: number;
    computedAt: Date;
  }[];

  @Prop({ type: Object, default: {} })
  userPreferences: {
    subscribedUserIds: string[];
    subscribedMushroomIds: string[];
    likedStoryIds: string[];
    savedStoryIds: string[];
    interests: string[];
    lastUpdated: Date;
  };

  @Prop({ type: Date, default: Date.now })
  lastComputed: Date;

  @Prop({ type: Number, default: 0 })
  version: number; // Increment on full recompute
}

export const UserRecommendationSchema =
  SchemaFactory.createForClass(UserRecommendation);

// Indexes for faster queries
UserRecommendationSchema.index({ userId: 1 }, { unique: true });
UserRecommendationSchema.index({ lastComputed: 1 });

