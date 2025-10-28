import {
  Body,
  Controller,
  Post,
  Get,
  Res,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { signupDto, loginDto } from './dto/sign';
import { errorHandler } from '../shared/middlewares/error-handler';
import { GoogleAuthGuard } from './guards/google.guard';
import { GitHubAuthGuard } from './guards/github.guard';
import { GitLabAuthGuard } from './guards/gitlab.guard';
import { OtpService } from '../shared/utilities/otp.service';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { OtpVerificationInterceptor } from '../shared/interceptors/otp-verification.interceptor';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly errorHandler: errorHandler,
    private readonly otpService: OtpService,
  ) {}

  @Post('/signup')
  @Throttle({ short: { ttl: 60000, limit: 3 } }) // 3 signups per minute
  @ApiOperation({ summary: 'Register a new user (Rate: 3 per minute)' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 429, description: 'Too many signup attempts' })
  @ApiBody({ type: signupDto })
  async registerUser(@Body() body: signupDto, @Res() res: any) {
    try {
      const result = await this.authService.registerUser(body);
      return res.status(201).setHeader('x-access-token', result.token).json({
        message: 'User registered successfully',
        user: result.user,
      });
    } catch (error) {
      return this.errorHandler.handle(res, error);
    }
  }

  @Post('/login')
  @Throttle({ short: { ttl: 60000, limit: 5 } }) // 5 login attempts per minute
  @ApiOperation({ summary: 'Login with email, password and OTP (Rate: 5 per minute)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or OTP' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @ApiBody({ type: loginDto })
  @UseInterceptors(OtpVerificationInterceptor)
  async login(@Body() body: loginDto, @Req() req: any, @Res() res: any) {
    try {
      // Use verified email from interceptor
      const updatedBody = { ...body, email: req.verifiedEmail };
      const result = await this.authService.login(updatedBody);
      return res.setHeader('x-access-token', result.token).json({
        message: 'Login successful',
        user: result.user,
      });
    } catch (error) {
      return this.errorHandler.handle(res, error);
    }
  }

  // Google OAuth
  @Get('/google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {
    // Guard redirects to Google
  }

  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res: any) {
    try {
      const result = await this.authService.handleOAuthLogin(req.user);
      return res.setHeader('x-access-token', result.token).json({
        message: 'Login successful',
        user: result.user,
      });
    } catch (error) {
      return this.errorHandler.handle(res, error);
    }
  }

  // GitHub OAuth
  @Get('/github')
  @UseGuards(GitHubAuthGuard)
  async githubAuth(@Req() req) {
    // Guard redirects to GitHub
  }

  @Get('/github/callback')
  @UseGuards(GitHubAuthGuard)
  async githubAuthCallback(@Req() req, @Res() res: any) {
    try {
      const result = await this.authService.handleOAuthLogin(req.user);
      return res.setHeader('x-access-token', result.token).json({
        message: 'Login successful',
        user: result.user,
      });
    } catch (error) {
      return this.errorHandler.handle(res, error);
    }
  }

  // GitLab OAuth
  @Get('/gitlab')
  @UseGuards(GitLabAuthGuard)
  async gitlabAuth(@Req() req) {
    // Guard redirects to GitLab
  }

  @Get('/gitlab/callback')
  @UseGuards(GitLabAuthGuard)
  async gitlabAuthCallback(@Req() req, @Res() res: any) {
    try {
      const result = await this.authService.handleOAuthLogin(req.user);
      return res.setHeader('x-access-token', result.token).json({
        message: 'Login successful',
        user: result.user,
      });
    } catch (error) {
      return this.errorHandler.handle(res, error);
    }
  }

  // OTP Endpoints
  @Post('/generate-otp')
  // @Throttle({ short: { ttl: 60000, limit: 3 } }) // 3 OTP requests per minute
  @ApiOperation({ summary: 'Generate OTP for email verification (Rate: 3 per minute)' })
  @ApiResponse({ status: 200, description: 'OTP generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  @ApiBody({ type: GenerateOtpDto })
  async generateOtp(@Body() body: GenerateOtpDto, @Res() res: any) {
    try {
      const otpCode = await this.otpService.generateOtp(body.email, body.type as any);
      
      // In production, send OTP via email/SMS
      // For now, return it in response (remove in production)
      console.log(`OTP for ${body.email} (${body.type}): ${otpCode}`);
      return res.json({
        message: 'OTP generated successfully',
        // Remove this in production - only return OTP in email/SMS
        otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      });
    } catch (error) {
      return this.errorHandler.handle(res, error);
    }
  }

}
