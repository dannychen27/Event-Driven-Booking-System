import type { Booking } from './bookings.types';
import type { PoolClient } from 'pg';

export type IdempotencyOperation = 'create_booking' | 'confirm_hold';

export interface IdempotencyRecord {
    request_hash: string;
    response_body: Booking;
}

export interface CreateRequestHashParams {
    operation: IdempotencyOperation;
    user_id: number;
    resource_id: number;
}

export interface FindIdempotencyRecordParams {
    client: PoolClient;
    user_id: number;
    operation: IdempotencyOperation;
    idempotency_key: string;
    request_hash: string;
}

export interface SaveIdempotencyRecordParams
    extends FindIdempotencyRecordParams {
    response_body: Booking;
}

export interface ValidateIdempotencyKeyParams {
    key?: string;
}
