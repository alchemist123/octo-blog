import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../shared/models/User';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [JwtService],
  exports: [JwtService, SequelizeModule.forFeature([User])],
})
export class GatekeeperModule {}
