import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // Only cache authenticated requests with userId
    if (!userId) {
      return next.handle();
    }

    // Build cache key based on userId and query params
    const cacheKey = this.getCacheKey(request, userId);

    // Try to get from cache
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      return of(cachedData);
    }

    // If not in cache, proceed and cache the result
    return next.handle().pipe(
      tap(async (data) => {
        // Cache for 5 minutes (300 seconds)
        await this.cacheManager.set(cacheKey, data, 300);
      }),
    );
  }

  private getCacheKey(request: any, userId: string): string {
    const path = request.route?.path || request.url;
    const page = request.query?.page || '1';
    const size = request.query?.size || '20';

    // Include page and size in cache key for pagination
    return `feed:${userId}:${path}:${page}:${size}`;
  }
}

