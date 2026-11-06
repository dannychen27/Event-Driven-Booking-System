export type HoldStatus = "active" | "confirmed" | "expired" | "cancelled";

export type HoldStatusRecord = {
    status: HoldStatus;
};

export type HoldStatusCount = {
    status: HoldStatus;
    count: number;
};

export type HoldExpirationTestCase = {
    status: HoldStatus;
    expired: boolean;
    expected: HoldStatus;
};

export type IndexNameRecord = {
    index_name: string;
};

export interface BookingHoldExpirationTestHelpers {
    createEvents(count: number): Promise<number[]>;
    createEvent(): Promise<number>;
    createHold(eventId: number, status: HoldStatus, expired: boolean): Promise<number>;
    cleanup(): Promise<void>;
}
