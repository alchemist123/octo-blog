import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { User } from '../shared/models/User';
import { UserService } from '../user/user.service';
import { signupDto, loginDto } from './dto/sign';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async registerUser(body: signupDto): Promise<any> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(body.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if username is taken
    const existingUsername = await this.userService.findByUsername(body.userName);

    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create user with hashed password
    const user = await this.userService.createUserWithPassword(hashedPassword, {
      email: body.email,
      name: body.name,
      userName: body.userName,
      dp_url: body.dp_url,
      bio: body.bio,
      location: body.location,
      personal_website: body.personal_website,
    });

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Return user data without password
    const { password, ...userWithoutPassword } = user.toJSON();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(body: loginDto): Promise<any> {
    // Find user by email
    const user = await this.userService.findByEmail(body.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get the password from the user object
    const userPassword = user.getDataValue('password');

    // Check if user has a password (OAuth users might not)
    if (!userPassword) {
      throw new UnauthorizedException('Please sign in with your social account');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(body.password, userPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Return user data without password
    const { password, ...userWithoutPassword } = user.toJSON();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async validateUserById(userId: string): Promise<User | null> {
    const user = await this.userService.findById(userId);
    return user;
  }

  async handleOAuthLogin(profile: any): Promise<any> {
    const { providerId, email, name, dp_url, userName, provider, bio } = profile;

    // Check if user already exists with this provider
    let user = await this.userService.findByProvider(provider, providerId);

    if (user) {
      // User exists, generate token
      const token = this.generateToken(user.id);
      const { password, ...userWithoutPassword } = user.toJSON();
      return {
        user: userWithoutPassword,
        token,
      };
    }

    // Check if user exists with this email
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      // Link OAuth account to existing user
      await this.userService.updateProvider(existingUser.id, provider, providerId);
      existingUser.provider = provider;
      existingUser.providerId = providerId;

      const token = this.generateToken(existingUser.id);
      const { password, ...userWithoutPassword } = existingUser.toJSON();
      return {
        user: userWithoutPassword,
        token,
      };
    }

    // Create new user
    user = await this.userService.createUser({
      email,
      name,
      userName: userName || email.split('@')[0],
      dp_url: dp_url || '',
      bio: bio || '',
      location: '',
      personal_website: [],
      interests: [],
      provider,
      providerId,
    } as any);

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toJSON();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ userId });
  }
}