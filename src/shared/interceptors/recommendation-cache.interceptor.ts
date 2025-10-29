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
export class RecommendationCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // Build cache key - use userId if authenticated, otherwise use 'anonymous'
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

  private getCacheKey(request: any, userId?: string): string {
    // Normalize path - remove any user-specific segments for anonymous users
    let path = request.route?.path || request.url;
    
    // Extract query params - for anonymous users, only allow pagination params
    let page = '1';
    let size = '20';
    let limit = '';
    
    if (!userId) {
      // For anonymous users: ensure path doesn't contain user-specific data
      // Remove any user ID segments from path (e.g., /users/12345 -> /users/:id)
      path = path.replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/:id');
      
      // Only keep non-user-specific query params (page, size, limit) for anonymous users
      // This ensures all anonymous users share the same cache
      const allowedParams = ['page', 'size', 'limit'];
      if (request.query?.page && allowedParams.includes('page')) {
        page = String(request.query.page);
      }
      if (request.query?.size && allowedParams.includes('size')) {
        size = String(request.query.size);
      }
      if (request.query?.limit && allowedParams.includes('limit')) {
        limit = String(request.query.limit);
      }
    } else {
      // For authenticated users, include all query params (they have user-specific caches)
      page = request.query?.page || '1';
      size = request.query?.size || '20';
      limit = request.query?.limit || '';
    }
    
    // For anonymous users, always use 'anonymous' (shared cache for ALL anonymous users)
    // For authenticated users, use their userId (user-specific cache per user)
    const cacheId = userId || 'anonymous';

    // Build cache key - for anonymous users, this will be identical for all anonymous users
    // Only include allowed query params to ensure cache sharing
    let cacheKey = `recommendation:${cacheId}:${path}`;
    if (page !== '1' || size !== '20' || limit) {
      cacheKey += `:page:${page}:size:${size}`;
      if (limit) {
        cacheKey += `:limit:${limit}`;
      }
    }
    
    return cacheKey;
  }
}

