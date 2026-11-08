import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { RequestContextService } from './request-context.service';
import { StructuredLogger } from './structured-logger';

const REQUEST_ID_HEADER = 'X-Request-ID';
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    constructor(
        private readonly requestContext: RequestContextService,
        private readonly logger: StructuredLogger,
    ) {}

    use(
        request: Request,
        response: Response,
        next: NextFunction,
    ): void {
        const incomingRequestId = request.get(REQUEST_ID_HEADER);

        const requestId =
            incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId)
                ? incomingRequestId
                : randomUUID();

        const startTime = process.hrtime.bigint();

        response.setHeader(REQUEST_ID_HEADER, requestId);

        this.requestContext.run(requestId, () => {
            response.on('finish', () => {
                const durationMs =
                    Number(process.hrtime.bigint() - startTime) / 1_000_000;

                this.logger.log({
                    event: 'http.request.completed',
                    requestId,
                    method: request.method,
                    path: request.path,
                    statusCode: response.statusCode,
                    durationMs,
                });
            });

            next();
        });
    }
}
