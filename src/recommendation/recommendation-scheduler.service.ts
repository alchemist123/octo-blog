import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { InjectConnection } from '@nestjs/sequelize';
import { User } from '../shared/models/User';
import { RecommendationComputeService } from './recommendation-compute.service';

@Injectable()
export class RecommendationSchedulerService {
  private readonly logger = new Logger(RecommendationSchedulerService.name);

  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly computeService: RecommendationComputeService,
  ) {}

  /**
   * Check database connection before running jobs
   */
  private async ensureDatabaseConnection(): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (error) {
      this.logger.warn('Database connection check failed, attempting reconnection...');
      try {
        // Close existing connection
        await this.sequelize.connectionManager.close();
        // Force reconnection
        await this.sequelize.authenticate();
        this.logger.log('Database reconnection successful');
        return true;
      } catch (reconnectError) {
        this.logger.error('Database reconnection failed:', reconnectError);
        return false;
      }
    }
  }

  /**
   * Retry wrapper for jobs with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
  ): Promise<T> {
    let lastError: Error;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check connection before each retry
        const isConnected = await this.ensureDatabaseConnection();
        if (!isConnected && attempt < maxRetries) {
          this.logger.warn(`Database not ready, waiting before retry ${attempt}/${maxRetries}`);
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
          continue;
        }
        
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const waitTime = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.warn(`Attempt ${attempt}/${maxRetries} failed, retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
    throw lastError!;
  }

  /**
   * Daily job to recompute recommendations for active users
   * Runs at 2 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyRecommendationCompute() {
    this.logger.log('Starting daily recommendation computation job');

    try {
      await this.retryWithBackoff(async () => {
        // Compute for active users (top 100 active users)
        await this.computeService.computeActiveUsersRecommendations(100);
      });
      this.logger.log('Daily recommendation computation completed');
    } catch (error) {
      this.logger.error('Error in daily recommendation computation after retries:', error);
    }
  }

  /**
   * Hourly job to recompute recommendations for very active users
   * Runs every hour at minute 30
   */
  @Cron('30 * * * *')
  async hourlyRecommendationCompute() {
    this.logger.log('Starting hourly recommendation computation job');

    try {
      await this.retryWithBackoff(async () => {
        // Compute for top 20 most active users (very recent activity)
        await this.computeService.computeActiveUsersRecommendations(20);
      });
      this.logger.log('Hourly recommendation computation completed');
    } catch (error) {
      this.logger.error('Error in hourly recommendation computation after retries:', error);
    }
  }

  /**
   * Weekly job to compute recommendations for ALL users (in batches)
   * Runs every Sunday at 3 AM
   */
  @Cron('0 3 * * 0')
  async weeklyAllUsersRecommendationCompute() {
    this.logger.log('Starting weekly recommendation computation for all users');

    try {
      await this.retryWithBackoff(async () => {
        // Compute for all users in batches
        await this.computeService.computeAllUsersRecommendations();
      }, 5); // More retries for weekly job
      this.logger.log('Weekly all users recommendation computation completed');
    } catch (error) {
      this.logger.error('Error in weekly all users recommendation computation after retries:', error);
    }
  }

  /**
   * Daily batch job to process inactive users (those without recent recommendations)
   * Runs every day at 4 AM (after active users job)
   */
  @Cron('0 4 * * *')
  async dailyInactiveUsersRecommendationCompute() {
    this.logger.log('Starting daily recommendation computation for inactive users');

    try {
      await this.retryWithBackoff(async () => {
        // Compute for users without recent recommendations (process 200 users per day)
        await this.computeService.computeInactiveUsersRecommendations(200);
      });
      this.logger.log('Daily inactive users recommendation computation completed');
    } catch (error) {
      this.logger.error('Error in daily inactive users recommendation computation after retries:', error);
    }
  }

  /**
   * Process queued users (users who requested feed but had no precomputed data)
   * Runs every 15 minutes
   */
  @Cron('*/15 * * * *')
  async processQueuedUsers() {
    this.logger.log('Processing queued users for recommendation computation');

    try {
      // Note: This requires access to RecommendationService's queue
      // For now, this is handled by the inactive users job
      // Could be enhanced with a proper queue system (Redis Queue, Bull, etc.)
      this.logger.debug('Queue processing (currently handled by inactive users job)');
    } catch (error) {
      this.logger.error('Error processing queued users:', error);
    }
  }

  /**
   * Manual trigger for computing recommendations for a specific user
   */
  async triggerUserRecompute(userId: string): Promise<void> {
    this.logger.log(`Manual trigger for user: ${userId}`);
    await this.computeService.computeUserRecommendations(userId);
  }

  /**
   * Batch compute for multiple users (admin function)
   */
  async batchComputeUsers(userIds: string[]): Promise<void> {
    this.logger.log(`Batch computing for ${userIds.length} users`);
    await this.computeService.batchComputeRecommendations(userIds);
  }
}

