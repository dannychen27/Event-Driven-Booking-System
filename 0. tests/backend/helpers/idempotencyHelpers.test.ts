import { BadRequestException, ConflictException } from '@nestjs/common';

import { MAX_HASH_KEY_LENGTH } from "../constants/booking.constants";
import type { Booking } from '../../../4. backend/src/types/bookings/bookings.types';
import type { IdempotencyOperation } from '../../../4. backend/src/types/bookings/idempotency.types';
import {
    createRequestHash,
    findIdempotencyRecord,
    saveIdempotencyRecord,
    validateIdempotencyKey,
} from '../../../4. backend/src/bookings/bookings.service.helpers';

describe('Idempotency helpers', () => {
    let client: any;

    const booking: Booking = {
        id: 123,
        user_id: 1,
        event_id: 1,
        created_at: '2026-09-05T20:00:00Z',
    };

    const operation: IdempotencyOperation = 'create_booking';
    const key = 'test-idempotency-key';
    const requestHash = 'a'.repeat(64);

    beforeEach(() => {
        client = {
            query: jest.fn(),
        };
    });

    describe('createRequestHash', () => {
        const params = {
            operation,
            user_id: 1,
            resource_id: 123,
        };

        it('should return a 64-character hexadecimal SHA-256 hash', () => {
            const result = createRequestHash(params);

            expect(result).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should return the same hash for identical inputs', () => {
            const firstHash = createRequestHash(params);
            const secondHash = createRequestHash({ ...params });

            expect(firstHash).toBe(secondHash);
        });

        it('should return different hashes when the operation changes', () => {
            const firstHash = createRequestHash(params);
            const secondHash = createRequestHash({
                ...params,
                operation: 'confirm_hold',
            });

            expect(firstHash).not.toBe(secondHash);
        });

        it('should return different hashes when the user ID changes', () => {
            const firstHash = createRequestHash(params);
            const secondHash = createRequestHash({
                ...params,
                user_id: 2,
            });

            expect(firstHash).not.toBe(secondHash);
        });

        it('should return different hashes when the resource ID changes', () => {
            const firstHash = createRequestHash(params);
            const secondHash = createRequestHash({
                ...params,
                resource_id: 456,
            });

            expect(firstHash).not.toBe(secondHash);
        });
    });

    describe('findIdempotencyRecord', () => {
        const getParams = () => ({
            client,
            user_id: 1,
            operation,
            idempotency_key: key,
            request_hash: requestHash,
        });

        it('should return null when no record exists', async () => {
            client.query.mockResolvedValueOnce({ rows: [] });

            const result = await findIdempotencyRecord(getParams());

            expect(result).toBeNull();
        });

        it('should return the stored response when the request hash matches', async () => {
            client.query.mockResolvedValueOnce({
                rows: [{
                    request_hash: requestHash,
                    response_body: booking,
                }],
            });

            const result = await findIdempotencyRecord(getParams());

            expect(result).toEqual(booking);
        });

        it('should reject reuse of a key with a different request hash', async () => {
            client.query.mockResolvedValueOnce({
                rows: [{
                    request_hash: 'b'.repeat(64),
                    response_body: booking,
                }],
            });

            await expect(
                findIdempotencyRecord(getParams()),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('saveIdempotencyRecord', () => {
        it('should persist the successful response', async () => {
            client.query.mockResolvedValueOnce({ rows: [] });

            await saveIdempotencyRecord({
                client,
                user_id: 1,
                operation,
                idempotency_key: key,
                request_hash: requestHash,
                response_body: booking,
            });

            expect(client.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO idempotency_requests'),
                [
                    1,
                    operation,
                    key,
                    requestHash,
                    201,
                    JSON.stringify(booking),
                ],
            );
        });
    });

    describe('validateIdempotencyKey', () => {
        it('should allow an omitted key', () => {
            expect(() => validateIdempotencyKey({})).not.toThrow();
        });

        it('should allow a valid key', () => {
            expect(() => validateIdempotencyKey({ key })).not.toThrow();
        });

        it('should reject an empty key', () => {
            expect(() => validateIdempotencyKey({ key: '' }))
                .toThrow(BadRequestException);
        });

        it('should reject a whitespace-only key', () => {
            expect(() => validateIdempotencyKey({ key: '   ' }))
                .toThrow(BadRequestException);
        });

        it('should reject a key longer than 255 characters', () => {
            expect(() => validateIdempotencyKey({
                key: 'a'.repeat(MAX_HASH_KEY_LENGTH + 1),
            })).toThrow(BadRequestException);
        });

        it('should allow a key exactly 255 characters long', () => {
            expect(() => validateIdempotencyKey({
                key: 'a'.repeat(MAX_HASH_KEY_LENGTH),
            })).not.toThrow();
        });
    });
});
