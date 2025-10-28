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

@Table({ tableName: 'likes', schema: 'storie' })
export class Like extends Model<Like> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Story)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare storyId: string;

  @BelongsTo(() => Story)
  declare story: Story;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare commentId: string; // MongoDB comment ID

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}

