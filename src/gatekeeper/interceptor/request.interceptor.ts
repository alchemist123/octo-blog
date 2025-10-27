import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/User';
import AuthenticationConstant from '../../shared/contants/AuthenticationConstant';
@Injectable()
export class RequestInterceptor implements NestInterceptor {
  constructor(
    private readonly jwt: JwtService,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    const headers = request['headers'];
    if (
      !headers['x-access-token'] ||
      headers['x-access-token'].trim().length == 0
    ) {
      response.status(401);
      return response.json({ message: 'unauthorized' });
    }
    const x_access_token = headers['x-access-token'];
    let decoded: any;
    try {
      decoded = this.jwt.decode(x_access_token);
    } catch (e) {
      response.status(401).json({ message: 'unauthorised' });
    }
    if (!decoded) response.status(401).json({ message: 'unauthorised' });
    const key = {
      secret: AuthenticationConstant.ACCESS_TOKEN_SECRET,
    };
    try {
      await this.jwt.verify(x_access_token, key);
    } catch (error) {
      console.log(error);
      if (error == 'TokenExpiredError: jwt expired') {
        return response.status(401).send({
          message: 'Unauthorized! Access Token was expired!',
        });
      }
      if (error == 'JsonWebTokenError: invalid signature') {
        return response.status(401).send({
          message: 'Unauthorized! Access Token secret key mismatch!',
        });
      } else {
        return response.status(401).send({
          message: 'Unauthorized',
        });
      }
    }
    const user = await this.userModel.findOne({
      where: {
        id: decoded.userId,
      },
      attributes: [
        'id',
        'name',
        'userName',
        'email',
        'dp_url',
        'bio',
        'location',
        'personal_website',
        'interests',
      ],
    });
    request['_user'] = user;
    return next.handle();
  }
}
