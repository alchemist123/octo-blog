import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { CheckExistDto } from './dto/check-exist.dto';
import { AddInterestDto } from './dto/add-interest.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Throttle({ medium: { ttl: 10000, limit: 10 } }) // 10 requests per 10 seconds
  getUser(): string {
    return 'hello world';
  }

  @Get('check-exist')
  @Throttle({ medium: { ttl: 10000, limit: 10 } })
  async checkExist(
    @Query() query: CheckExistDto,
  ): Promise<{ exists: boolean }> {
    const { type, value } = query;

    try {
      let exists: boolean;

      if (type === 'email') {
        exists = await this.userService.checkEmailExist(value);
      } else if (type === 'username') {
        exists = await this.userService.checkUsernameExist(value);
      } else {
        throw new HttpException(
          'Invalid type. Must be "email" or "username"',
          HttpStatus.BAD_REQUEST,
        );
      }

      return { exists };
    } catch (error) {
      throw new HttpException(
        'Error checking existence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('interests')
  @UseGuards(JwtAuthGuard)
  async addInterest(
    @Req() request: any,
    @Body() addInterestDto: AddInterestDto,
  ): Promise<{ message: string; interests: string[] }> {
    const user = request.user;
    await this.userService.addInterest(user.id, addInterestDto.interest);
    const updatedInterests = await this.userService.getUserInterests(user.id);
    return {
      message: 'Interest added successfully',
      interests: updatedInterests,
    };
  }

  @Delete('interests')
  @UseGuards(JwtAuthGuard)
  async removeInterest(
    @Req() request: any,
    @Body() addInterestDto: AddInterestDto,
  ): Promise<{ message: string; interests: string[] }> {
    const user = request.user;
    await this.userService.removeInterest(user.id, addInterestDto.interest);
    const updatedInterests = await this.userService.getUserInterests(user.id);
    return {
      message: 'Interest removed successfully',
      interests: updatedInterests,
    };
  }

  @Get('interests')
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  async getInterests(@Req() request: any): Promise<{ interests: string[] }> {
    const user = request.user;
    const interests = await this.userService.getUserInterests(user.id);
    return { interests };
  }
}
