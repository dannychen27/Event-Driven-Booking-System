import { ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

import { GlobalExceptionFilter } from '../../../4. backend/src/observability/global-exception.filter';
import { RequestContextService } from '../../../4. backend/src/observability/request-context.service';
import { StructuredLogger } from '../../../4. backend/src/observability/structured-logger';

describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;
    let logger: StructuredLogger;
    let requestContext: RequestContextService;
    let baseCatchSpy: jest.SpyInstance;

    const request = {
        method: 'GET',
        path: '/events/123',
    };

    const host = {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    } as unknown as ArgumentsHost;

    beforeEach(() => {
        logger = {
            error: jest.fn(),
        } as unknown as StructuredLogger;

        requestContext = new RequestContextService();

        const adapterHost = {
            httpAdapter: {},
        } as HttpAdapterHost;

        filter = new GlobalExceptionFilter(
            adapterHost,
            logger,
            requestContext,
        );

        baseCatchSpy = jest
            .spyOn(BaseExceptionFilter.prototype, 'catch')
            .mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each([400, 403, 404, 409])(
        'should not log expected HTTP %i exceptions',
        (statusCode) => {
            const exception = new HttpException(
                'Expected client error',
                statusCode,
            );

            filter.catch(exception, host);

            expect(logger.error).not.toHaveBeenCalled();
            expect(baseCatchSpy).toHaveBeenCalledWith(exception, host);
        },
    );

    it('should log HTTP 5xx exceptions with request context', () => {
        requestContext.run('request-500', () => {
            const exception = new HttpException(
                'Internal server error',
                500,
            );

            filter.catch(exception, host);

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'http.request.failed',
                    requestId: 'request-500',
                    method: 'GET',
                    path: '/events/123',
                    statusCode: 500,
                    errorName: 'HttpException',
                    stack: expect.any(String),
                }),
            );

            expect(baseCatchSpy).toHaveBeenCalledWith(exception, host);
        });
    });

    it('should log unexpected errors with their stack trace', () => {
        requestContext.run('request-unexpected-error', () => {
            const exception = new Error('Unexpected failure');

            filter.catch(exception, host);

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'http.request.failed',
                    requestId: 'request-unexpected-error',
                    method: 'GET',
                    path: '/events/123',
                    statusCode: 500,
                    errorName: 'Error',
                    stack: exception.stack,
                }),
            );

            expect(baseCatchSpy).toHaveBeenCalledWith(exception, host);
        });
    });

    it('should handle non-Error thrown values safely', () => {
        requestContext.run('request-unknown-error', () => {
            filter.catch('unexpected thrown value', host);

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'http.request.failed',
                    requestId: 'request-unknown-error',
                    method: 'GET',
                    path: '/events/123',
                    statusCode: 500,
                    errorName: 'UnknownError',
                    stack: undefined,
                }),
            );
        });
    });
});
