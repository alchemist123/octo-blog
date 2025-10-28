import {
  Column,
  Model,
  Table,
  AllowNull,
  PrimaryKey,
  DataType,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './User';
import { Mushroom } from './Mushroom';

@Table({ tableName: 'stories', schema: 'storie' })
export class Story extends Model<Story> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare title: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare type: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare thumbnails_url: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare tagLine: string;

  @AllowNull(true)
  @Column(DataType.ARRAY(DataType.STRING))
  declare hashtags: string[];

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare authorId: string;

  @BelongsTo(() => User)
  declare author: User;

  @ForeignKey(() => Mushroom)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare mushroomId: string;

  @BelongsTo(() => Mushroom)
  declare mushroom: Mushroom;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare postType: 'self' | 'mushroom';

  @AllowNull(false)
  @Column(DataType.STRING)
  declare storyType: 'tutorial' | 'blog';

  @AllowNull(false)
  @Default('draft')
  @Column(DataType.STRING)
  declare status: 'draft' | 'requested' | 'published';

  @AllowNull(true)
  @Column(DataType.DOUBLE)
  declare sentimentalScore: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare likesCount: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare commentsCount: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare viewsCount: number;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}

