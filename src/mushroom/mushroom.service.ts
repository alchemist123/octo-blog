import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Mushroom } from '../shared/models/Mushroom';
import { Subscriber } from '../shared/models/Subscriber';
import { MushroomAdmin } from '../shared/models/MushroomAdmin';
import { User } from '../shared/models/User';
import { FilterMushroomDto } from './dto/filter-mushroom.dto';

@Injectable()
export class MushroomService {
  constructor(
    @InjectModel(Mushroom) private readonly mushroomModel: typeof Mushroom,
    @InjectModel(Subscriber)
    private readonly subscriberModel: typeof Subscriber,
    @InjectModel(MushroomAdmin)
    private readonly mushroomAdminModel: typeof MushroomAdmin,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  /**
   * Create a new mushroom
   */
  async create(mushroomData: {
    name: string;
    description?: string;
    status?: 'closed' | 'open';
    dp_url?: string;
    type: 'dev' | 'art' | 'entertainment' | 'other' | 'philosophy';
    userId: string;
  }): Promise<Mushroom> {
    const mushroom = await this.mushroomModel.create(mushroomData as any);

    // Add the creator as an admin (they're already an admin by being userId,
    // but we'll also add them to the admins table for consistency)
    await this.mushroomAdminModel.create({
      userId: mushroomData.userId,
      mushroomId: mushroom.id,
    } as any);

    return mushroom;
  }

  /**
   * Find mushroom by ID
   */
  async findById(id: string): Promise<Mushroom | null> {
    return await this.mushroomModel.findByPk(id);
  }

  /**
   * Find all mushrooms
   */
  async findAll(filter?: FilterMushroomDto): Promise<Mushroom[]> {
    const where: any = {};

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filter.search}%` } },
        { description: { [Op.iLike]: `%${filter.search}%` } },
      ];
    }

    return await this.mushroomModel.findAll({ where });
  }

  /**
   * Find mushrooms by user ID
   */
  async findByUserId(userId: string): Promise<Mushroom[]> {
    return await this.mushroomModel.findAll({ where: { userId } });
  }

  /**
   * Update mushroom
   */
  async update(id: string, updates: Partial<Mushroom>): Promise<Mushroom> {
    const mushroom = await this.mushroomModel.findByPk(id);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }
    await mushroom.update(updates);
    return mushroom;
  }

  /**
   * Delete mushroom
   */
  async delete(id: string): Promise<void> {
    const mushroom = await this.mushroomModel.findByPk(id);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }
    await mushroom.destroy();
  }

  /**
   * Subscribe to a mushroom
   */
  async subscribe(mushroomId: string, userId: string): Promise<Subscriber> {
    // Check if mushroom exists
    const mushroom = await this.mushroomModel.findByPk(mushroomId);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }

    // Check if already subscribed
    const existingSubscription = await this.subscriberModel.findOne({
      where: { mushroomId, userId },
    });

    if (existingSubscription) {
      throw new HttpException(
        'User is already subscribed to this mushroom',
        HttpStatus.CONFLICT,
      );
    }

    // Determine status based on mushroom status
    // If mushroom is closed, subscription is pending (needs approval)
    // If mushroom is open, subscription is joined (auto-approved)
    const status = mushroom.status === 'closed' ? 'pending' : 'joined';

    // Create subscription
    const subscriber = await this.subscriberModel.create({
      userId,
      mushroomId,
      status,
    } as any);

    // Update subscriber count if status is 'joined'
    if (status === 'joined') {
      await this.mushroomModel.update(
        { subscribers: mushroom.subscribers + 1 },
        { where: { id: mushroomId } },
      );
    }

    return subscriber;
  }

  /**
   * Unsubscribe from a mushroom
   */
  async unsubscribe(mushroomId: string, userId: string): Promise<void> {
    const subscriber = await this.subscriberModel.findOne({
      where: { mushroomId, userId },
    });

    if (!subscriber) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    // Get mushroom to update count
    const mushroom = await this.mushroomModel.findByPk(mushroomId);

    await subscriber.destroy();

    // Decrease subscriber count if status was 'joined'
    if (subscriber.status === 'joined' && mushroom) {
      const newCount = Math.max(0, mushroom.subscribers - 1);
      await this.mushroomModel.update(
        { subscribers: newCount },
        { where: { id: mushroomId } },
      );
    }
  }

  /**
   * Check if user is admin of a mushroom
   */
  async isAdmin(mushroomId: string, userId: string): Promise<boolean> {
    // Check if user is the creator of the mushroom
    const mushroom = await this.mushroomModel.findByPk(mushroomId);
    if (mushroom && mushroom.userId === userId) {
      return true;
    }

    // Check if user is in the admins table
    const admin = await this.mushroomAdminModel.findOne({
      where: { mushroomId, userId },
    });

    return !!admin;
  }

  /**
   * Add admin to a mushroom
   */
  async addAdmin(
    mushroomId: string,
    newAdminUserId: string,
  ): Promise<MushroomAdmin> {
    // Check if mushroom exists
    const mushroom = await this.mushroomModel.findByPk(mushroomId);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }

    // Check if already an admin (either creator or in admins table)
    const isAlreadyAdmin = await this.isAdmin(mushroomId, newAdminUserId);
    if (isAlreadyAdmin) {
      throw new HttpException(
        'User is already an admin of this mushroom',
        HttpStatus.CONFLICT,
      );
    }

    // Check if admin entry already exists
    const existingAdmin = await this.mushroomAdminModel.findOne({
      where: { mushroomId, userId: newAdminUserId },
    });

    if (existingAdmin) {
      throw new HttpException('User is already an admin', HttpStatus.CONFLICT);
    }

    // Add admin
    const admin = await this.mushroomAdminModel.create({
      userId: newAdminUserId,
      mushroomId,
    } as any);

    return admin;
  }

  /**
   * Get all admins of a mushroom
   */
  async getAdmins(
    mushroomId: string,
    limit: number,
    offset: number,
  ): Promise<{ admins: any[]; total: number }> {
    const mushroom = await this.mushroomModel.findByPk(mushroomId);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }

    const adminEntries = await this.mushroomAdminModel.findAll({
      where: { mushroomId },
    });

    // Get all admin user IDs
    const adminUserIds = [
      mushroom.userId,
      ...adminEntries.map((a) => a.userId),
    ];

    // Get total count
    const total = await this.userModel.count({
      where: { id: adminUserIds },
    });

    // Get paginated admin users with their details
    const adminUsers = await this.userModel.findAll({
      where: { id: adminUserIds },
      attributes: ['id', 'name', 'dp_url', 'bio', 'createdAt'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return { admins: adminUsers, total };
  }

  /**
   * Get pending subscribers for a mushroom
   */
  async getPendingSubscribers(
    mushroomId: string,
    limit: number,
    offset: number,
  ): Promise<{ subscribers: any[]; total: number }> {
    const mushroom = await this.mushroomModel.findByPk(mushroomId);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }

    const pendingSubscribers = await this.subscriberModel.findAll({
      where: { mushroomId, status: 'pending' },
      attributes: ['id', 'userId', 'status', 'createdAt'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Get total count
    const total = await this.subscriberModel.count({
      where: { mushroomId, status: 'pending' },
    });

    // Get user details for each pending subscriber
    const userIds = pendingSubscribers.map((s) => s.userId);
    const users = await this.userModel.findAll({
      where: { id: userIds },
      attributes: ['id', 'name', 'dp_url', 'bio', 'createdAt'],
    });

    // Combine subscriber info with user details
    const subscribers = pendingSubscribers.map((subscriber) => {
      const user = users.find((u) => u.id === subscriber.userId);
      return {
        id: subscriber.id,
        userId: subscriber.userId,
        name: user?.name,
        dp_url: user?.dp_url,
        bio: user?.bio,
        createdAt: subscriber.createdAt,
      };
    });

    return { subscribers, total };
  }

  /**
   * Get joined subscribers for a mushroom
   */
  async getJoinedSubscribers(
    mushroomId: string,
    limit: number,
    offset: number,
  ): Promise<{ subscribers: any[]; total: number }> {
    const mushroom = await this.mushroomModel.findByPk(mushroomId);
    if (!mushroom) {
      throw new HttpException('Mushroom not found', HttpStatus.NOT_FOUND);
    }

    const joinedSubscribers = await this.subscriberModel.findAll({
      where: { mushroomId, status: 'joined' },
      attributes: ['id', 'userId', 'status', 'createdAt'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Get total count
    const total = await this.subscriberModel.count({
      where: { mushroomId, status: 'joined' },
    });

    // Get user details for each joined subscriber
    const userIds = joinedSubscribers.map((s) => s.userId);
    const users = await this.userModel.findAll({
      where: { id: userIds },
      attributes: ['id', 'name', 'dp_url', 'bio', 'createdAt'],
    });

    // Combine subscriber info with user details
    const subscribers = joinedSubscribers.map((subscriber) => {
      const user = users.find((u) => u.id === subscriber.userId);
      return {
        id: subscriber.id,
        userId: subscriber.userId,
        name: user?.name,
        dp_url: user?.dp_url,
        bio: user?.bio,
        createdAt: subscriber.createdAt,
      };
    });

    return { subscribers, total };
  }

  /**
   * Approve pending subscription (change from pending to joined)
   */
  async approveSubscription(
    mushroomId: string,
    subscriberId: string,
  ): Promise<Subscriber> {
    const subscriber = await this.subscriberModel.findOne({
      where: { id: subscriberId, mushroomId },
    });

    if (!subscriber) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    if (subscriber.status !== 'pending') {
      throw new HttpException(
        'Only pending subscriptions can be approved',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update status to joined
    await subscriber.update({ status: 'joined' });

    // Get mushroom to update subscriber count
    const mushroom = await this.mushroomModel.findByPk(mushroomId);
    if (mushroom) {
      await this.mushroomModel.update(
        { subscribers: mushroom.subscribers + 1 },
        { where: { id: mushroomId } },
      );
    }

    return subscriber;
  }

  /**
   * Reject pending subscription (delete it)
   */
  async rejectSubscription(
    mushroomId: string,
    subscriberId: string,
  ): Promise<void> {
    const subscriber = await this.subscriberModel.findOne({
      where: { id: subscriberId, mushroomId },
    });

    if (!subscriber) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    if (subscriber.status !== 'pending') {
      throw new HttpException(
        'Only pending subscriptions can be rejected',
        HttpStatus.BAD_REQUEST,
      );
    }

    await subscriber.destroy();
  }
}
