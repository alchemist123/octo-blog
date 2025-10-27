import {
  Column,
  Model,
  Table,
  AllowNull,
  PrimaryKey,
  DataType,
  Default,
} from 'sequelize-typescript';

export enum OtpType {
  LOGIN = 'login',
  SIGNUP = 'signup',
  RESET_PASSWORD = 'reset-password',
  CHANGE_EMAIL = 'change-email',
  VERIFY_EMAIL = 'verify-email',
}

@Table({ tableName: 'otps', schema: 'public' })
export class Otp extends Model<Otp> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(OtpType)))
  declare type: OtpType;

  @AllowNull(false)
  @Column(DataType.STRING(6))
  declare otpCode: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expiresAt: Date;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare isUsed: boolean;
}
