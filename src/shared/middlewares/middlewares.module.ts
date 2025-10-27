import { Module } from '@nestjs/common';
import { errorHandler } from './error-handler';
import { PaginationMiddleware } from './pagination.middleware';

@Module({
  providers: [errorHandler, PaginationMiddleware],
  exports: [errorHandler, PaginationMiddleware],
})
export class MiddlewaresModule {}
