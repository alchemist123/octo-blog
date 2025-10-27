import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Mushroom } from '../shared/models/Mushroom';
import { User } from '../shared/models/User';
import { Subscriber } from '../shared/models/Subscriber';
import { MushroomAdmin } from '../shared/models/MushroomAdmin';
import { MiddlewaresModule } from '../shared/middlewares/middlewares.module';
import { MushroomController } from './mushroom.controller';
import { MushroomService } from './mushroom.service';
import { GatekeeperModule } from '../gatekeeper/gatekeeper.module';
import { AuthModule } from '../authentication/auth.module';
import { PaginationMiddleware } from '../shared/middlewares/pagination.middleware';

@Module({
  imports: [
    SequelizeModule.forFeature([Mushroom, User, Subscriber, MushroomAdmin]),
    MiddlewaresModule,
    GatekeeperModule,
    AuthModule,
  ],
  controllers: [MushroomController],
  providers: [MushroomService],
  exports: [MushroomService],
})
export class MushroomModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PaginationMiddleware)
      .forRoutes(
        { path: 'mushroom/:id/admins', method: RequestMethod.GET },
        { path: 'mushroom/:id/subscribers/pending', method: RequestMethod.GET },
        { path: 'mushroom/:id/subscribers/joined', method: RequestMethod.GET },
      );
  }
}
