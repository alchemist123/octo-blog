import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { User } from './User';
import { Story } from './Story';

@Table({ tableName: 'user_story_views', schema: 'storie' })
export class UserStoryView extends Model<UserStoryView> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Story)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare storyId: string;

  @BelongsTo(() => Story)
  declare story: Story;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare viewCount: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastViewedAt: Date | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}


