import { Injectable, Res } from '@nestjs/common';
import { StatusCodes } from 'http-status-codes';

@Injectable()
export class errorHandler {
  async handle(res, error) {
    switch (error.status) {
      case 400 | 502:
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: error.message,
          status: 400,
        });
      case 404:
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: error.message, status: error.status });
      case 401:
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: error.message,
          status: 404,
        });
      case 409:
        return res.status(StatusCodes.CONFLICT).json({
          message: error.message,
          status: 409,
        });
      default:
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: error.message,
          status: error.status,
        });
    }
  }
}
