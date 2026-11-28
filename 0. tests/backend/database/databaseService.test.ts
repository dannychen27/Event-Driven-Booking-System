import type { QueryResult } from "pg";
import { Logger } from "@nestjs/common";
import { DatabaseService } from "../../../4. backend/src/database/database.service";

jest.mock("../../../4. backend/node_modules/pg", () => ({
    Pool: jest.fn(),
}));

const MockPool = jest.requireMock("../../../4. backend/node_modules/pg").Pool as jest.Mock;


describe("DatabaseService", () => {
    let service: DatabaseService;
    let mockPool: {
        query: jest.Mock;
        connect: jest.Mock;
        end: jest.Mock;
    };
    let mockClient: {
        query: jest.Mock;
        release: jest.Mock;
    };

    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();

        process.env = {
            ...originalEnv,
            DB_NAME: "booking_system_test",
            DB_HOST: "localhost",
            DB_PORT: "5432",
            DB_USER: "test_user",
            DB_PASSWORD: "test_password",
            DATABASE_URL: "",
            DB_SSL: "false",
            DB_POOL_MAX: "5",
        };

        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };

        mockPool = {
            query: jest.fn(),
            connect: jest.fn().mockResolvedValue(mockClient),
            end: jest.fn().mockResolvedValue(undefined),
        };

        MockPool.mockImplementation(() => mockPool);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe("constructor", () => {
        it("should reject a missing DB_NAME", () => {
            delete process.env.DB_NAME;

            expect(() => new DatabaseService()).toThrow("DB_NAME must be explicitly configured.");
            expect(MockPool).not.toHaveBeenCalled();
        });

        it("should reject a missing DB_USER", () => {
            delete process.env.DB_USER;

            expect(() => new DatabaseService()).toThrow(
                "DB_USER must be explicitly configured."
            );
            expect(MockPool).not.toHaveBeenCalled();
        });

        it("should reject a blank DB_USER", () => {
            process.env.DB_USER = "   ";

            expect(() => new DatabaseService()).toThrow(
                "DB_USER must be explicitly configured."
            );
            expect(MockPool).not.toHaveBeenCalled();
        });

        it("should reject a blank DB_NAME", () => {
            process.env.DB_NAME = "   ";

            expect(() => new DatabaseService()).toThrow("DB_NAME must be explicitly configured.",);
            expect(MockPool).not.toHaveBeenCalled();
        });

        it("should create a pool with configured connection options", () => {
            service = new DatabaseService();

            expect(MockPool).toHaveBeenCalledWith({
                host: "localhost",
                port: 5432,
                database: "booking_system_test",
                user: "test_user",
                password: "test_password",
                max: 5,
                ssl: undefined,
            });

            expect(service).toBeInstanceOf(DatabaseService);
        });

        it("should use default host and port when optional variables are absent", () => {
            delete process.env.DB_HOST;
            delete process.env.DB_PORT;
            delete process.env.DB_PASSWORD;

            service = new DatabaseService();

            expect(MockPool).toHaveBeenCalledWith({
                host: "localhost",
                port: 5432,
                database: "booking_system_test",
                user: "test_user",
                password: undefined,
                max: 5,
                ssl: undefined,
            });
        });

        it("should configure SSL when DB_SSL is enabled", () => {
            process.env.DB_SSL = "true";

            service = new DatabaseService();

            expect(MockPool).toHaveBeenCalledWith(
                expect.objectContaining({
                    ssl: { rejectUnauthorized: true },
                }),
            );
        });

        it("should use a configured pool size", () => {
            process.env.DB_POOL_MAX = "3";

            service = new DatabaseService();

            expect(MockPool).toHaveBeenCalledWith(
                expect.objectContaining({ max: 3 }),
            );
        });

        it.each(["0", "21", "1.5", "invalid"])(
            "should reject an invalid pool size: %s",
            (poolMax) => {
                process.env.DB_POOL_MAX = poolMax;

                expect(() => new DatabaseService()).toThrow(
                    "DB_POOL_MAX must be an integer between 1 and 20.",
                );
                expect(MockPool).not.toHaveBeenCalled();
            },
        );

        it("should create a pool using a TLS PostgreSQL connection URL", () => {
            const connectionString =
                "postgresql://test_user:test_password@localhost:5432/booking_system_test?sslmode=require";

            process.env.DATABASE_URL = connectionString;
            delete process.env.DB_NAME;
            delete process.env.DB_USER;

            service = new DatabaseService();

            expect(MockPool).toHaveBeenCalledWith({
                connectionString,
                max: 5,
            });
            expect(service).toBeInstanceOf(DatabaseService);
        });

        it("should reject a DATABASE_URL without an explicit TLS mode", () => {
            process.env.DATABASE_URL =
                "postgresql://test_user:test_password@localhost:5432/booking_system_test";

            expect(() => new DatabaseService()).toThrow(
                "DATABASE_URL must explicitly require TLS",
            );
            expect(MockPool).not.toHaveBeenCalled();
        });

        it("should reject a DATABASE_URL with an unsupported protocol", () => {
            process.env.DATABASE_URL = "mysql://localhost/test";

            expect(() => new DatabaseService()).toThrow(
                "DATABASE_URL must be a valid PostgreSQL connection URL.",
            );
            expect(MockPool).not.toHaveBeenCalled();
        });

        it("should reject a malformed DATABASE_URL", () => {
            process.env.DATABASE_URL = "not a valid URL";

            expect(() => new DatabaseService()).toThrow(
                "DATABASE_URL must be a valid PostgreSQL connection URL.",
            );
            expect(MockPool).not.toHaveBeenCalled();
        });
    });

    describe("query", () => {
        beforeEach(() => {
            service = new DatabaseService();
        });

        it("should delegate queries and parameters to the pool", async () => {
            const result = { rows: [{ id: 1 }] } as unknown as QueryResult;

            mockPool.query.mockResolvedValue(result);

            await expect(service.query("SELECT * FROM events WHERE id = $1", [1]))
                .resolves.toBe(result);

            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM events WHERE id = $1",
                [1]
            );
        });

        it("should propagate pool query failures", async () => {
            const error = new Error("Database query failed");

            mockPool.query.mockRejectedValue(error);

            await expect(
                service.query("SELECT * FROM events"),
            ).rejects.toBe(error);
        });
    });

    describe("transaction", () => {
        beforeEach(() => {
            service = new DatabaseService();
            mockClient.query.mockResolvedValue({ rows: [] });
        });

        it("should commit a successful transaction and return its result", async () => {
            const callbackResult = { bookingId: 42 };
            const callback = jest.fn().mockResolvedValue(callbackResult);

            await expect(service.transaction(callback)).resolves.toBe(
                callbackResult,
            );

            expect(mockPool.connect).toHaveBeenCalledTimes(1);
            expect(mockClient.query.mock.calls).toEqual([ ["BEGIN"], ["COMMIT"] ]);
            expect(callback).toHaveBeenCalledWith(mockClient);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it("should roll back when the transaction callback fails", async () => {
            const error = new Error("Booking operation failed");
            const callback = jest.fn().mockRejectedValue(error);

            await expect(service.transaction(callback)).rejects.toBe(error);

            expect(mockClient.query.mock.calls).toEqual([ ["BEGIN"], ["ROLLBACK"] ]);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it("should roll back when COMMIT fails", async () => {
            const error = new Error("Commit failed");

            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce({ rows: [] });

            const callback = jest.fn().mockResolvedValue("result");

            await expect(service.transaction(callback)).rejects.toBe(error);

            expect(mockClient.query.mock.calls).toEqual([ ["BEGIN"], ["COMMIT"], ["ROLLBACK"] ]);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it("should release the client when BEGIN fails", async () => {
            const error = new Error("Transaction start failed");

            mockClient.query.mockRejectedValueOnce(error);

            const callback = jest.fn();

            await expect(service.transaction(callback)).rejects.toBe(error);

            expect(callback).not.toHaveBeenCalled();
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it("should preserve the original error when ROLLBACK also fails", async () => {
            const originalError = new Error("Booking operation failed");
            const rollbackError = new Error("Rollback failed");

            const loggerSpy = jest
                .spyOn(Logger.prototype, "error")
                .mockImplementation();

            mockClient.query
                .mockResolvedValueOnce({ rows: [] })
                .mockRejectedValueOnce(rollbackError);

            const callback = jest.fn().mockRejectedValue(originalError);

            await expect(service.transaction(callback)).rejects.toBe(originalError);

            expect(mockClient.release).toHaveBeenCalledTimes(1);

            expect(loggerSpy).toHaveBeenCalledWith(
                "Transaction rollback failed",
                rollbackError.stack,
            );

            loggerSpy.mockRestore();
        });
    });

    describe("onModuleDestroy", () => {
        beforeEach(() => {
            service = new DatabaseService();
        });

        it("should close the database pool", async () => {
            await expect(service.onModuleDestroy()).resolves.toBeUndefined();

            expect(mockPool.end).toHaveBeenCalledTimes(1);
        });

        it("should propagate pool shutdown failures", async () => {
            const error = new Error("Pool shutdown failed");

            mockPool.end.mockRejectedValue(error);

            await expect(service.onModuleDestroy()).rejects.toBe(error);
        });
    });
});
