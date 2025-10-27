import {
  Column,
  Model,
  Table,
  Unique,
  AllowNull,
  PrimaryKey,
  DataType,
  Default,
} from 'sequelize-typescript';

@Table({ tableName: 'topics', schema: 'public' })
export class Topic extends Model<Topic> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique(true)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare category: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
