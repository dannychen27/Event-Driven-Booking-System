import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';

import { RequestContextService } from '../../../4. backend/src/observability/request-context.service';
import { RequestIdMiddleware } from '../../../4. backend/src/observability/request-id.middleware';
import { StructuredLogger } from '../../../4. backend/src/observability/structured-logger';

describe('RequestIdMiddleware', () => {
    let middleware: RequestIdMiddleware;
    let requestContext: RequestContextService;
    let logger: StructuredLogger;
    let request: Request;
    let response: Response;
    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        requestContext = new RequestContextService();

        logger = {
            log: jest.fn(),
        } as unknown as StructuredLogger;

        middleware = new RequestIdMiddleware(requestContext, logger);

        request = {
            get: jest.fn().mockReturnValue(undefined),
            method: 'GET',
            path: '/events',
        } as unknown as Request;

        const responseEmitter = new EventEmitter();

        response = responseEmitter as unknown as Response;
        response.statusCode = 200;
        response.setHeader = jest.fn();

        next = jest.fn();
    });

    it('should preserve a valid incoming request ID', () => {
        (request.get as jest.Mock).mockReturnValue('client-request-123');

        middleware.use(request, response, next);

        expect(response.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            'client-request-123',
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should generate a UUID when the request ID is missing', () => {
        middleware.use(request, response, next);

        const requestId = (response.setHeader as jest.Mock).mock.calls[0][1];

        expect(requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
    });

    it('should generate a UUID when the incoming request ID is invalid', () => {
        (request.get as jest.Mock).mockReturnValue('invalid request ID!');

        middleware.use(request, response, next);

        const requestId = (response.setHeader as jest.Mock).mock.calls[0][1];

        expect(requestId).not.toBe('invalid request ID!');
        expect(requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
    });

    it('should establish the request context before calling next', () => {
        (request.get as jest.Mock).mockReturnValue('request-context-123');

        next.mockImplementation(() => {
            expect(requestContext.getRequestId()).toBe('request-context-123');
        });

        middleware.use(request, response, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should log request completion with the response status and duration', () => {
        (request.get as jest.Mock).mockReturnValue('request-completion-123');

        middleware.use(request, response, next);

        response.statusCode = 201;
        response.emit('finish');

        expect(logger.log).toHaveBeenCalledWith(
            expect.objectContaining({
                event: 'http.request.completed',
                requestId: 'request-completion-123',
                method: 'GET',
                path: '/events',
                statusCode: 201,
                durationMs: expect.any(Number),
            }),
        );
    });
});
