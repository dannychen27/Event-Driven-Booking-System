import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../4. backend/src/app.module";

import {
    E2E_CONFLICTING_EVENT_FIXTURE,
    E2E_FULL_EVENT_FIXTURE, E2E_NONEXISTENT_EVENT_ID,
    E2E_TEST_EVENT_FIXTURE,
} from "./fixtures/events/eventFixtures";
import {
    E2E_NONEXISTENT_USER_ID,
    E2E_OTHER_USER_FIXTURE,
    E2E_TEST_USER_FIXTURE,
} from "./fixtures/users/userFixtures";

describe("Booking flow (E2E)", () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it("should allow a user to book and cancel an event", async () => {
        const event = E2E_TEST_EVENT_FIXTURE;
        const user = E2E_TEST_USER_FIXTURE;

        const bookingResponse = await request(app.getHttpServer())
            .post(`/events/${event.id}/book`)
            .send({
                user_id: user.id,
            })
            .expect(201);

        const booking = bookingResponse.body;

        expect(booking).toMatchObject({
            user_id: user.id,
            event_id: event.id,
        });

        const historyResponse = await request(app.getHttpServer())
            .get(`/users/${user.id}/bookings`)
            .expect(200);

        expect(historyResponse.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: booking.id,
                    user_id: user.id,
                    event_id: event.id,
                }),
            ]),
        );

        await request(app.getHttpServer())
            .delete(`/bookings/${booking.id}`)
            .send({
                user_id: user.id,
            })
            .expect(200);

        const finalHistoryResponse = await request(app.getHttpServer())
            .get(`/users/${user.id}/bookings`)
            .expect(200);

        expect(finalHistoryResponse.body).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: booking.id,
                }),
            ]),
        );
    });

    it("should reject a booking when the user does not exist", async () => {
        await request(app.getHttpServer())
            .post(`/events/${E2E_TEST_EVENT_FIXTURE.id}/book`)
            .send({
                user_id: E2E_NONEXISTENT_USER_ID,
            })
            .expect(404);
    });

    it("should reject a booking when the event does not exist", async () => {
        await request(app.getHttpServer())
            .post(`/events/${E2E_NONEXISTENT_EVENT_ID}/book`)
            .send({
                user_id: E2E_TEST_USER_FIXTURE.id,
            })
            .expect(404);
    });

    it("should reject cancellation by a non-booking owner", async () => {
        const owner = E2E_TEST_USER_FIXTURE;
        const otherUser = E2E_OTHER_USER_FIXTURE;

        const bookingResponse = await request(app.getHttpServer())
            .post(`/events/${E2E_TEST_EVENT_FIXTURE.id}/book`)
            .send({
                user_id: owner.id,
            })
            .expect(201);

        const booking = bookingResponse.body;

        await request(app.getHttpServer())
            .delete(`/bookings/${booking.id}`)
            .send({
                user_id: otherUser.id,
            })
            .expect(403);

        await request(app.getHttpServer())
            .delete(`/bookings/${booking.id}`)
            .send({
                user_id: owner.id,
            })
            .expect(200);
    });

    it("should reject a duplicate booking", async () => {
        const event = E2E_TEST_EVENT_FIXTURE;
        const user = E2E_TEST_USER_FIXTURE;

        const firstBookingResponse = await request(app.getHttpServer())
            .post(`/events/${event.id}/book`)
            .send({
                user_id: user.id,
            })
            .expect(201);

        const booking = firstBookingResponse.body;

        await request(app.getHttpServer())
            .post(`/events/${event.id}/book`)
            .send({
                user_id: user.id,
            })
            .expect(409);

        await request(app.getHttpServer())
            .delete(`/bookings/${booking.id}`)
            .send({
                user_id: user.id,
            })
            .expect(200);
    });

    it("should reject a booking that conflicts with another booking", async () => {
        const user = E2E_TEST_USER_FIXTURE;
        const firstEvent = E2E_TEST_EVENT_FIXTURE;
        const conflictingEvent = E2E_CONFLICTING_EVENT_FIXTURE;

        const firstBookingResponse = await request(app.getHttpServer())
            .post(`/events/${firstEvent.id}/book`)
            .send({
                user_id: user.id,
            })
            .expect(201);

        const booking = firstBookingResponse.body;

        await request(app.getHttpServer())
            .post(`/events/${conflictingEvent.id}/book`)
            .send({
                user_id: user.id,
            })
            .expect(409);

        await request(app.getHttpServer())
            .delete(`/bookings/${booking.id}`)
            .send({
                user_id: user.id,
            })
            .expect(200);
    });

    it("should reject a booking when the event is fully booked", async () => {
        await request(app.getHttpServer())
            .post(`/events/${E2E_FULL_EVENT_FIXTURE.id}/book`)
            .send({
                user_id: E2E_OTHER_USER_FIXTURE.id,
            })
            .expect(409);
    });
});

