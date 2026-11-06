import { CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { AppModule } from "../../../4. backend/src/app.module";
import { BookingHoldExpirationService } from "../../../4. backend/src/bookings/booking-hold-expiration.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";

describe("BookingHoldExpirationService scheduler registration", () => {
    let testingModule: TestingModule;

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(DatabaseService)
            .useValue({
                query: jest.fn().mockResolvedValue({ rows: [] }),
            })
            .compile();

        // Triggers NestJS application lifecycle hooks,
        // including scheduled job registration.
        await testingModule.init();
    });

    afterAll(async () => {
        await testingModule.close();
    });

    it("should register an active expiration job every minute", () => {
        const service = testingModule.get(BookingHoldExpirationService);
        const schedulerRegistry = testingModule.get(SchedulerRegistry);

        expect(service).toBeInstanceOf(BookingHoldExpirationService);

        const job = schedulerRegistry.getCronJob("booking-hold-expiration");

        expect(job).toBeDefined();
        expect(job.isActive).toBe(true);
        expect(job.cronTime.source).toBe(CronExpression.EVERY_MINUTE);
        expect(job.waitForCompletion).toBe(true);
    });
});
