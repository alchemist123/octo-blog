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
  Unique,
} from 'sequelize-typescript';
import { User } from './User';

@Table({ tableName: 'user_subscriptions', schema: 'user' })
export class UserSubscription extends Model<UserSubscription> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare subscriberId: string; // The user who is subscribing

  @BelongsTo(() => User, 'subscriberId')
  declare subscriber: User;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare subscribedToId: string; // The user being subscribed to

  @BelongsTo(() => User, 'subscribedToId')
  declare subscribedTo: User;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}

