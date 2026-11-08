import {
    ArgumentsHost,
    Catch,
    HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';

import { RequestContextService } from './request-context.service';
import { StructuredLogger } from './structured-logger';

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
    constructor(
        adapterHost: HttpAdapterHost,
        private readonly logger: StructuredLogger,
        private readonly requestContext: RequestContextService,
    ) {
        super(adapterHost.httpAdapter);
    }

    catch(exception: unknown, host: ArgumentsHost): void {
        const request = host.switchToHttp().getRequest<Request>();

        const statusCode =
            exception instanceof HttpException
                ? exception.getStatus()
                : 500;

        if (statusCode >= 500) {
            this.logger.error({
                event: 'http.request.failed',
                requestId: this.requestContext.getRequestId(),
                method: request.method,
                path: request.path,
                statusCode,
                errorName:
                    exception instanceof Error
                        ? exception.name
                        : 'UnknownError',
                stack:
                    exception instanceof Error
                        ? exception.stack
                        : undefined,
            });
        }

        super.catch(exception, host);
    }
}
