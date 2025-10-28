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
import { Story } from './Story';

@Table({ tableName: 'comments', schema: 'storie' })
export class Comment extends Model<Comment> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Story)
  @Column(DataType.UUID)
  declare storyId: string;

  @BelongsTo(() => Story)
  declare story: Story;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare parentId: string; // For nested replies

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare likesCount: number;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}

