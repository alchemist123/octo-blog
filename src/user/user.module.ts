import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../shared/models/User';
import { MiddlewaresModule } from '../shared/middlewares/middlewares.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { GatekeeperModule } from '../gatekeeper/gatekeeper.module';
@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    MiddlewaresModule,
    GatekeeperModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
