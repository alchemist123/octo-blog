import { Module, Global } from '@nestjs/common';
import { MongoLoggerService } from './mongodb.logger';
import { PostgresLoggerService } from './postgres.logger';
import { RedisLoggerService } from './redis.logger';

@Global()
@Module({
  providers: [
    MongoLoggerService,
    PostgresLoggerService,
    RedisLoggerService,
  ],
  exports: [
    MongoLoggerService,
    PostgresLoggerService,
    RedisLoggerService,
  ],
})
export class DatabaseModule {}

