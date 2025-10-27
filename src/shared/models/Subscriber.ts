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

@Table({ tableName: 'subscribers', schema: 'mushroom' })
export class Subscriber extends Model<Subscriber> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Mushroom)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare mushroomId: string;

  @BelongsTo(() => Mushroom)
  declare mushroom: Mushroom;

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.STRING)
  declare status: 'pending' | 'invited' | 'joined';

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}

