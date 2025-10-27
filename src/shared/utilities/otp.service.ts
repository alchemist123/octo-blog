import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Otp, OtpType } from '../models/Otp';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes
  private readonly OTP_LENGTH = 6;

  constructor(
    @InjectModel(Otp) private readonly otpModel: typeof Otp,
  ) {}

  /**
   * Generate a 6-digit random OTP
   */
  private generateOtpCode(): string {
    const otp = crypto.randomInt(0, 999999).toString().padStart(6, '0');
    return otp;
  }

  /**
   * Generate and store OTP for an email
   */
  async generateOtp(email: string, type: OtpType): Promise<string> {
    // Invalidate all previous unused OTPs for this email and type
    await this.otpModel.update(
      { isUsed: true },
      {
        where: {
          email,
          type,
          isUsed: false,
        },
      },
    );

    // Generate new OTP
    const otpCode = this.generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Store in database
    await this.otpModel.create({
      email,
      type,
      otpCode,
      expiresAt,
      isUsed: false,
    } as any);

    return otpCode;
  }

  /**
   * Verify OTP code
   * Returns true if valid, false otherwise
   */
  async verifyOtp(email: string, otpCode: string, type: OtpType): Promise<boolean> {
    const otp = await this.otpModel.findOne({
      where: {
        email,
        otpCode,
        type,
        isUsed: false,
      },
      order: [['createdAt', 'DESC']], // Get the most recent OTP
    });

    if (!otp) {
      return false;
    }

    // Check if expired
    if (new Date() > otp.expiresAt) {
      return false;
    }

    // Mark as used
    await otp.update({ isUsed: true });

    return true;
  }

  /**
   * Get the most recent OTP for an email and type
   */
  async getRecentOtp(email: string, type: OtpType): Promise<Otp | null> {
    return await this.otpModel.findOne({
      where: {
        email,
        type,
        isUsed: false,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Check if OTP is still valid (not expired and not used)
   */
  async isOtpValid(email: string, type: OtpType): Promise<boolean> {
    const otp = await this.getRecentOtp(email, type);
    
    if (!otp) {
      return false;
    }

    // Check if expired
    if (new Date() > otp.expiresAt) {
      await otp.update({ isUsed: true });
      return false;
    }

    return !otp.isUsed;
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOtps(): Promise<void> {
    await this.otpModel.update(
      { isUsed: true },
      {
        where: {
          expiresAt: { [Symbol.for('$lt')]: new Date() },
          isUsed: false,
        },
      },
    );
  }
}
