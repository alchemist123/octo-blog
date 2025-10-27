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

@Table({ tableName: 'mushrooms', schema: 'mushroom' })
export class Mushroom extends Model<Mushroom> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare status: 'closed' | 'open';

  @AllowNull(true)
  @Column(DataType.STRING)
  declare dp_url: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: 'dev' | 'art' | 'entertainment' | 'other' | 'philosophy';

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare subscribers: number;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
