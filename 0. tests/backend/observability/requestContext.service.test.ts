import { RequestContextService } from '../../../4. backend/src/observability/request-context.service';

describe('RequestContextService', () => {
    let requestContext: RequestContextService;

    beforeEach(() => {
        requestContext = new RequestContextService();
    });

    it('should return undefined outside a request context', () => {
        expect(requestContext.getRequestId()).toBeUndefined();
    });

    it('should expose the request ID inside its context', () => {
        requestContext.run('request-123', () => {
            expect(requestContext.getRequestId()).toBe('request-123');
        });
    });

    it('should restore the previous context after a nested context completes', () => {
        requestContext.run('request-outer', () => {
            expect(requestContext.getRequestId()).toBe('request-outer');

            requestContext.run('request-inner', () => {
                expect(requestContext.getRequestId()).toBe('request-inner');
            });

            expect(requestContext.getRequestId()).toBe('request-outer');
        });

        expect(requestContext.getRequestId()).toBeUndefined();
    });

    it('should isolate concurrent asynchronous contexts', async () => {
        const firstRequest = requestContext.run('request-1', async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));

            return requestContext.getRequestId();
        });

        const secondRequest = requestContext.run('request-2', async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));

            return requestContext.getRequestId();
        });

        await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
            'request-1',
            'request-2',
        ]);
    });
});
