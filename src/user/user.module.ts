import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RequestMethod } from '@nestjs/common';
import { User } from '../shared/models/User';
import { UserSubscription } from '../shared/models/UserSubscription';
import { MiddlewaresModule } from '../shared/middlewares/middlewares.module';
import { PaginationMiddleware } from '../shared/middlewares/pagination.middleware';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { GatekeeperModule } from '../gatekeeper/gatekeeper.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User, UserSubscription]),
    MiddlewaresModule,
    GatekeeperModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PaginationMiddleware)
      .forRoutes(
        { path: 'user/subscribers', method: RequestMethod.GET },
        { path: 'user/following', method: RequestMethod.GET },
      );
  }
}
