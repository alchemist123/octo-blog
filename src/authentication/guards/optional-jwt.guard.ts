import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-access-token'];

    // If no token is provided, allow the request to proceed without authentication
    if (!token || token.trim().length === 0) {
      request.user = null; // Explicitly set user to null for unauthenticated requests
      return true;
    }

    // If token is provided, validate it
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // If token is invalid/expired, we allow the request but set user to null
    // This way the endpoint can still be accessed without authentication
    if (err || !user || info) {
      return null; // Return null instead of throwing error
    }
    return user;
  }
}

