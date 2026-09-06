import { BookingsService } from "../../../4. backend/src/bookings/bookings.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";


describe("BookingsService", () => {

    describe("createBooking", () => {
        it("creates a booking successfully", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [{ id: 1 }],
                    })
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 1,
                                start_time: "2026-09-10T10:00:00Z",
                                end_time: "2026-09-10T11:00:00Z",
                                capacity: 10,
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [],
                    })
                    .mockResolvedValueOnce({
                        rows: [{ booking_count: "2" }],
                    })
                    .mockResolvedValueOnce({
                        rows: [],
                    })
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 5,
                                user_id: 1,
                                event_id: 1,
                                created_at: "2026-09-06T18:00:00Z",
                            },
                        ],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            const result = await service.createBooking(1, 1);

            expect(result).toEqual({
                id: 5,
                user_id: 1,
                event_id: 1,
                created_at: "2026-09-06T18:00:00Z",
            });

            expect(db.transaction).toHaveBeenCalled();
        });

        it("throws an error when the user does not exist", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.createBooking(1, 1),
            ).rejects.toThrow("User 1 not found");
        });

        it("throws an error when the event does not exist", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [{ id: 1 }],
                    })
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.createBooking(1, 1),
            ).rejects.toThrow("Event 1 not found");
        });

        it("throws an error when the user has already booked the event", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [{ id: 1 }],
                    })
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 1,
                                start_time: "2026-09-10T10:00:00Z",
                                end_time: "2026-09-10T11:00:00Z",
                                capacity: 10,
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [{ id: 5 }],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.createBooking(1, 1),
            ).rejects.toThrow(
                "User 1 has already booked event 1",
            );
        });

        it("throws an error when the event is fully booked", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [{ id: 1 }],
                    })
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 1,
                                start_time: "2026-09-10T10:00:00Z",
                                end_time: "2026-09-10T11:00:00Z",
                                capacity: 10,
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [],
                    })
                    .mockResolvedValueOnce({
                        rows: [{ booking_count: "10" }],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.createBooking(1, 1),
            ).rejects.toThrow(
                "Event 1 is fully booked",
            );
        });

        it("throws an error when the user has a conflicting booking", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [{ id: 1 }],
                    })
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 1,
                                start_time: "2026-09-10T10:00:00Z",
                                end_time: "2026-09-10T11:00:00Z",
                                capacity: 10,
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [],
                    })
                    .mockResolvedValueOnce({
                        rows: [{ booking_count: "2" }],
                    })
                    .mockResolvedValueOnce({
                        rows: [{ id: 7 }],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.createBooking(1, 1),
            ).rejects.toThrow(
                "User 1 has a conflicting booking with event 7",
            );
        });
    })

    describe("cancelBooking", () => {

        it("cancels a booking successfully", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 5,
                                user_id: 1,
                                event_id: 1,
                                created_at: "2026-09-06T18:00:00Z",
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [{ id: 1 }],
                    })
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 1,
                                start_time: "2026-09-10T10:00:00Z",
                                end_time: "2026-09-10T11:00:00Z",
                                capacity: 10,
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 5,
                                user_id: 1,
                                event_id: 1,
                                created_at: "2026-09-06T18:00:00Z",
                            },
                        ],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            const result = await service.cancelBooking(1, 5);

            expect(result).toEqual({
                id: 5,
                user_id: 1,
                event_id: 1,
                created_at: "2026-09-06T18:00:00Z",
            });

            expect(db.transaction).toHaveBeenCalled();
        });

        it("throws an error when the booking does not exist", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.cancelBooking(1, 5),
            ).rejects.toThrow("Booking 5 not found");
        });

        it("throws an error when the user does not exist", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 5,
                                user_id: 1,
                                event_id: 1,
                                created_at: "2026-09-06T18:00:00Z",
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.cancelBooking(2, 5),
            ).rejects.toThrow("User 2 not found");
        });

        it("throws an error when the event does not exist", async () => {
            const mockClient = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [
                            {
                                id: 5,
                                user_id: 1,
                                event_id: 1,
                                created_at: "2026-09-06T18:00:00Z",
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        rows: [{ id: 1 }],
                    })
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            };

            const db = {
                transaction: jest.fn(
                    async (
                        callback: (client: typeof mockClient) => Promise<unknown>,
                    ) => {
                        return callback(mockClient);
                    },
                ),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.cancelBooking(1, 5),
            ).rejects.toThrow("Event 1 not found");
        });
    });

    describe("getBookingHistory", () => {

        it("throws an error when the user does not exist", async () => {
            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            await expect(
                service.getBookingHistory(1),
            ).rejects.toThrow("User 1 does not exist");
        });

        it("returns the user's booking history", async () => {
            const bookings = [
                {
                    id: 2,
                    user_id: 1,
                    event_id: 2,
                    created_at: "2026-09-06T18:00:00Z",
                },
                {
                    id: 1,
                    user_id: 1,
                    event_id: 1,
                    created_at: "2026-09-05T18:00:00Z",
                },
            ];

            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [{ id: 1 }],
                    })
                    .mockResolvedValueOnce({
                        rows: bookings,
                    }),
            } as unknown as DatabaseService;

            const service = new BookingsService(db);

            const result = await service.getBookingHistory(1);

            expect(result).toEqual(bookings);
            expect(db.query).toHaveBeenCalledTimes(2);
        });
    });
});

