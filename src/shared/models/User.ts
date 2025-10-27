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
@Table({ tableName: 'users', schema: 'user' })
export class User extends Model<User> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique(true)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Unique(true)
  @AllowNull(false)
  @Column
  declare userName: string;

  @Unique(true)
  @AllowNull(false)
  @Column
  declare email: string;

  @AllowNull(true)
  @Column
  declare dp_url: string;

  @AllowNull(true)
  @Column
  declare password: string;

  @AllowNull(true)
  @Column
  declare bio: string;

  @AllowNull(true)
  @Column
  declare location: string;

  @AllowNull(true)
  @Column(DataType.ARRAY(DataType.JSON))
  declare personal_website: any[];

  @AllowNull(true)
  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  declare interests: string[];

  @AllowNull(true)
  @Column
  declare provider?: string; // 'local', 'google', 'github', 'gitlab'

  @AllowNull(true)
  @Column
  declare providerId?: string; // OAuth provider ID
}
