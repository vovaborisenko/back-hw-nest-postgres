import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import type { ErrorResponseBody } from './error-response-body';

//Все ошибки
@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody = this.buildResponseBody(exception);

    response.status(status).json(responseBody);
  }

  private buildResponseBody(exception: Error): ErrorResponseBody {
    //TODO: Replace with getter from configService. will be in the following lessons
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      console.error(exception);
    }

    return {
      errorsMessages: [{ field: 'exception', message: exception.message }],
    };
  }
}
