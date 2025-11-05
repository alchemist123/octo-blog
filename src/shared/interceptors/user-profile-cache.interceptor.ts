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
export class UserProfileCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Get targetUserId: from query param or from authenticated user
    const targetUserId = request.query?.userId || request.user?.id;
    
    // If no targetUserId, don't cache (let the endpoint handle validation)
    if (!targetUserId) {
      return next.handle();
    }

    // Build cache key based on targetUserId
    const cacheKey = `user:profile:${targetUserId}`;

    // Try to get from cache
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      return of(cachedData);
    }

    // If not in cache, proceed and cache the result
    // Note: Errors thrown by the controller will not reach tap, so only successful responses are cached
    return next.handle().pipe(
      tap(async (data) => {
        // Cache for 10 minutes (600 seconds)
        await this.cacheManager.set(cacheKey, data, 600);
      }),
    );
  }
}

