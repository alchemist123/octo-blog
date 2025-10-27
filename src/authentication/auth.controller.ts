import { Body, Controller, Post, Get, Res, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { signupDto, loginDto } from './dto/sign';
import { errorHandler } from '../shared/middlewares/error-handler';
import { GoogleAuthGuard } from './guards/google.guard';
import { GitHubAuthGuard } from './guards/github.guard';
import { GitLabAuthGuard } from './guards/gitlab.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly errorHandler: errorHandler
  ) {}

  @Post('/signup')
  async registerUser(@Body() body: signupDto, @Res() res: any) {
    try {
      const result = await this.authService.registerUser(body);
      return res
        .status(201)
        .setHeader('x-access-token', result.token)
        .json({ 
          message: 'User registered successfully', 
          user: result.user 
        });
    } catch (error) {
      return this.errorHandler.handle(res, error);
    }
  }

  @Post('/login')
  async login(@Body() body: loginDto, @Res() res: any) {
    try {
      const result = await this.authService.login(body);
      return res
        .setHeader('x-access-token', result.token)
        .json({ 
          message: 'Login successful',
          user: result.user 
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
      return res
        .setHeader('x-access-token', result.token)
        .json({ 
          message: 'Login successful',
          user: result.user 
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
      return res
        .setHeader('x-access-token', result.token)
        .json({ 
          message: 'Login successful',
          user: result.user 
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
      return res
        .setHeader('x-access-token', result.token)
        .json({ 
          message: 'Login successful',
          user: result.user 
        });
    } catch (error) {
      return this.errorHandler.handle(res, error);
    }
  }
}
