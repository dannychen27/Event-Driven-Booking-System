import type { LogLevel } from '@nestjs/common';

import { getLoggedEntry } from './structuredLoggerHelpers';
import { StructuredLogger } from '../../../4. backend/src/observability/structured-logger';


describe('StructuredLogger', () => {
    let logger: StructuredLogger;
    let stdoutSpy: jest.SpyInstance;
    let stderrSpy: jest.SpyInstance;

    beforeEach(() => {
        logger = new StructuredLogger();

        stdoutSpy = jest
            .spyOn(process.stdout, 'write')
            .mockImplementation((() => true) as typeof process.stdout.write);
        stderrSpy = jest
            .spyOn(process.stderr, 'write')
            .mockImplementation((() => true) as typeof process.stderr.write);
    });

    afterEach(() => {
        stderrSpy.mockRestore();
        stdoutSpy.mockRestore();
    });

    it('should emit a JSON log record with a timestamp and level', () => {
        logger.log('Application started');

        const entry = getLoggedEntry(stdoutSpy);

        expect(entry).toMatchObject({
            level: 'log',
            message: 'Application started',
        });
        expect(entry.timestamp).toEqual(expect.any(String));
        expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
        expect(stdoutSpy).toHaveBeenCalledTimes(1);
        expect(stdoutSpy.mock.calls[0][0]).toMatch(/\n$/);
    });

    it('should preserve object messages as structured JSON objects', () => {
        const message = {
            event: 'booking.created',
            bookingId: 42,
            durationMs: 125,
        };

        logger.log(message);

        expect(getLoggedEntry(stdoutSpy).message).toEqual(message);
    });

    it('should safely handle circular references', () => {
        const circular: { self?: unknown } = {};
        circular.self = circular;

        expect(() => logger.log({
            event: 'booking.created',
            details: circular,
        })).not.toThrow();

        expect(getLoggedEntry(stdoutSpy)).toMatchObject({
            level: 'log',
            message: '[Log record omitted: serialization failed]',
            serializationError: 'Unable to serialize structured log record',
        });
    });

    it('should safely handle BigInt values', () => {
        expect(() => logger.log({
            bookingId: 123n,
        })).not.toThrow();

        expect(getLoggedEntry(stdoutSpy)).toMatchObject({
            level: 'log',
            message: '[Log record omitted: serialization failed]',
            serializationError: 'Unable to serialize structured log record',
        });
    });

    it('should include the context supplied to a standard log method', () => {
        logger.log('Booking created', 'BookingsService');

        expect(getLoggedEntry(stdoutSpy)).toMatchObject({
            level: 'log',
            message: 'Booking created',
            context: 'BookingsService',
        });
    });

    it('should preserve an error stack and context', () => {
        const error = new Error('Transaction failed');

        logger.error(
            'Transaction rollback failed',
            error.stack,
            'DatabaseTransaction',
        );

        expect(getLoggedEntry(stderrSpy)).toMatchObject({
            level: 'error',
            message: 'Transaction rollback failed',
            stack: error.stack,
            context: 'DatabaseTransaction',
        });
    });

    it('should serialize an Error passed as the message', () => {
        const error = new Error('Database unavailable');

        logger.error(error);

        expect(getLoggedEntry(stderrSpy)).toMatchObject({
            level: 'error',
            message: 'Database unavailable',
            stack: error.stack,
        });
    });

    it('should retain additional structured parameters', () => {
        const metadata = {
            bookingId: 42,
            operation: 'rollback',
        };

        logger.warn('Booking operation warning', 'BookingsService', metadata);

        expect(getLoggedEntry(stderrSpy)).toMatchObject({
            level: 'warn',
            message: 'Booking operation warning',
            context: 'BookingsService',
            additionalParams: [metadata],
        });
    });

    it('should respect configured log levels', () => {
        logger.setLogLevels(['error', 'warn'] satisfies LogLevel[]);

        logger.log('This should not be emitted');
        logger.warn('This should be emitted');

        expect(stdoutSpy).not.toHaveBeenCalled();
        expect(stderrSpy).toHaveBeenCalledTimes(1);

        expect(getLoggedEntry(stderrSpy)).toMatchObject({
            level: 'warn',
            message: 'This should be emitted',
        });
    });

    it('should emit all supported log levels by default', () => {
        logger.log('log');
        logger.error('error');
        logger.warn('warn');
        logger.debug('debug');
        logger.verbose('verbose');
        logger.fatal('fatal');

        expect(stdoutSpy).toHaveBeenCalledTimes(3);
        expect(stderrSpy).toHaveBeenCalledTimes(3);

        const stdoutLevels = stdoutSpy.mock.calls.map((call) => {
            return JSON.parse((call[0] as string).trim()).level;
        });

        const stderrLevels = stderrSpy.mock.calls.map((call) => {
            return JSON.parse((call[0] as string).trim()).level;
        });

        expect(stdoutLevels).toEqual(['log', 'debug', 'verbose']);
        expect(stderrLevels).toEqual(['error', 'warn', 'fatal']);
    });
});
