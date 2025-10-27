import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpException, UseGuards, Req } from '@nestjs/common';
import { MushroomService } from './mushroom.service';
import { CreateMushroomDto } from './dto/create-mushroom.dto';
import { UpdateMushroomDto } from './dto/update-mushroom.dto';
import { FilterMushroomDto } from './dto/filter-mushroom.dto';
import { AddAdminDto } from './dto/add-admin.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt.guard';

@Controller('mushroom')
export class MushroomController {
  constructor(private readonly mushroomService: MushroomService) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  async getAll(@Query() filter: FilterMushroomDto): Promise<{ mushrooms: any[] }> {
    const mushrooms = await this.mushroomService.findAll(filter);
    return { mushrooms };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string): Promise<{ mushroom: any }> {
    const mushroom = await this.mushroomService.findById(id);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }
    return { mushroom };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() mushroomData: CreateMushroomDto, @Req() request: any): Promise<{ mushroom: any }> {
    const user = request.user;
    const mushroom = await this.mushroomService.create({
      ...mushroomData,
      userId: user.id,
    });
    return { mushroom };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updates: UpdateMushroomDto, @Req() request: any): Promise<{ mushroom: any }> {
    const user = request.user;
    
    // Check if user owns the mushroom
    const mushroom = await this.mushroomService.findById(id);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }
    
    if (mushroom.userId !== user.id) {
      throw new HttpException('Forbidden: You can only update your own mushrooms', HttpStatus.FORBIDDEN);
    }
    
    const updatedMushroom = await this.mushroomService.update(id, updates);
    return { mushroom: updatedMushroom };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() request: any): Promise<{ message: string }> {
    const user = request.user;
    
    // Check if user owns the mushroom
    const mushroom = await this.mushroomService.findById(id);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }
    
    if (mushroom.userId !== user.id) {
      throw new HttpException('Forbidden: You can only delete your own mushrooms', HttpStatus.FORBIDDEN);
    }
    
    await this.mushroomService.delete(id);
    return { message: 'Mushroom deleted successfully' };
  }

  @Post(':id/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ message: string; subscriber: any }> {
    const user = request.user;
    
    const subscriber = await this.mushroomService.subscribe(id, user.id);
    return { 
      message: subscriber.status === 'pending' 
        ? 'Subscription request sent and awaiting approval'
        : 'Successfully subscribed to mushroom',
      subscriber,
    };
  }

  @Delete(':id/unsubscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ message: string }> {
    const user = request.user;
    
    await this.mushroomService.unsubscribe(id, user.id);
    return { message: 'Successfully unsubscribed from mushroom' };
  }

  @Post(':id/admins')
  @UseGuards(JwtAuthGuard)
  async addAdmin(
    @Param('id') id: string,
    @Body() addAdminData: AddAdminDto,
    @Req() request: any,
  ): Promise<{ message: string; admin: any }> {
    const user = request.user;
    
    // Check if user is admin of this mushroom
    const isAdmin = await this.mushroomService.isAdmin(id, user.id);
    if (!isAdmin) {
      throw new HttpException('Forbidden: Only admins can add other admins', HttpStatus.FORBIDDEN);
    }
    
    const admin = await this.mushroomService.addAdmin(id, addAdminData.userId);
    return { 
      message: 'Successfully added admin to mushroom',
      admin,
    };
  }

  @Get(':id/admins')
  @UseGuards(JwtAuthGuard)
  async getAdmins(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ admins: any[]; total: number; page: number; size: number }> {
    const pagination = request.pagination || { page: 1, size: 10, limit: 10, offset: 0 };
    const { limit, offset, page, size } = pagination;
    
    const { admins, total } = await this.mushroomService.getAdmins(id, limit, offset);
    return { 
      admins,
      total,
      page,
      size,
    };
  }

  @Get(':id/subscribers/pending')
  @UseGuards(JwtAuthGuard)
  async getPendingSubscribers(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ pendingSubscribers: any[]; total: number; page: number; size: number }> {
    const user = request.user;
    const pagination = request.pagination ;
    const { limit, offset, page, size } = pagination;

    const isAdmin = await this.mushroomService.isAdmin(id, user.id);
    if (!isAdmin) {
      throw new HttpException('Forbidden: Only admins can view pending subscribers', HttpStatus.FORBIDDEN);
    }
    
    const { subscribers, total } = await this.mushroomService.getPendingSubscribers(id, limit, offset);
    return { 
      pendingSubscribers: subscribers,
      total,
      page,
      size,
    };
  }

  @Post(':id/subscribers/:subscriberId/approve')
  @UseGuards(JwtAuthGuard)
  async approveSubscription(
    @Param('id') id: string,
    @Param('subscriberId') subscriberId: string,
    @Req() request: any,
  ): Promise<{ message: string; subscriber: any }> {
    const user = request.user;
    
    // Check if user is admin
    const isAdmin = await this.mushroomService.isAdmin(id, user.id);
    if (!isAdmin) {
      throw new HttpException('Forbidden: Only admins can approve subscribers', HttpStatus.FORBIDDEN);
    }
    
    const subscriber = await this.mushroomService.approveSubscription(id, subscriberId);
    return { 
      message: 'Subscription approved successfully',
      subscriber,
    };
  }

  @Delete(':id/subscribers/:subscriberId/reject')
  @UseGuards(JwtAuthGuard)
  async rejectSubscription(
    @Param('id') id: string,
    @Param('subscriberId') subscriberId: string,
    @Req() request: any,
  ): Promise<{ message: string }> {
    const user = request.user;
    
    // Check if user is admin
    const isAdmin = await this.mushroomService.isAdmin(id, user.id);
    if (!isAdmin) {
      throw new HttpException('Forbidden: Only admins can reject subscribers', HttpStatus.FORBIDDEN);
    }
    
    await this.mushroomService.rejectSubscription(id, subscriberId);
    return { message: 'Subscription rejected successfully' };
  }
  @Get(':id/subscribers/joined')
  @UseGuards(JwtAuthGuard)
  async getJoinedSubscribers(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ joinedSubscribers: any[]; total: number; page: number; size: number }> {
    const pagination = request.pagination || { page: 1, size: 10, limit: 10, offset: 0 };
    const { limit, offset, page, size } = pagination;
    
    const { subscribers, total } = await this.mushroomService.getJoinedSubscribers(id, limit, offset);
    return { 
      joinedSubscribers: subscribers,
      total,
      page,
      size,
    };
  }
}

