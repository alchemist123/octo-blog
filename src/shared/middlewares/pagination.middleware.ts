import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PaginationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Parse pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;

    // Calculate offset and limit
    const limit = size;
    const offset = (page - 1) * size;

    // Attach pagination info to request object
    req['pagination'] = {
      page,
      size,
      limit,
      offset,
    };

    next();
  }
}
