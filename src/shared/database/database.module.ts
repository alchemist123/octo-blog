import { Module, Global } from '@nestjs/common';
import { MongoLoggerService } from './mongodb.logger';

@Global()
@Module({
  providers: [MongoLoggerService],
  exports: [MongoLoggerService],
})
export class DatabaseModule {}

