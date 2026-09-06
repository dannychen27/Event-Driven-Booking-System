import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../4. backend/src/app.module";


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
        const eventsResponse = await request(app.getHttpServer())
            .get("/events")
            .expect(200);

        expect(eventsResponse.body.length).toBeGreaterThan(0);

        const event = eventsResponse.body[0];

        const bookingResponse = await request(app.getHttpServer())
            .post(`/events/${event.id}/book`)
            .send({
                user_id: 1,
            });

        // console.log("BOOKING RESPONSE:", bookingResponse.status, bookingResponse.body);

        expect(bookingResponse.status).toBe(201);

        const booking = bookingResponse.body;

        expect(booking).toMatchObject({
            user_id: 1,
            event_id: event.id,
        });

        const historyResponse = await request(app.getHttpServer())
            .get("/users/1/bookings")
            .expect(200);

        expect(historyResponse.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: booking.id,
                    user_id: 1,
                    event_id: event.id,
                }),
            ]),
        );

        await request(app.getHttpServer())
            .delete(`/bookings/${booking.id}`)
            .send({
                user_id: 1,
            })
            .expect(200);

        const finalHistoryResponse = await request(app.getHttpServer())
            .get("/users/1/bookings")
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
            .post("/events/1/book")
            .send({
                user_id: 999,
            })
            .expect(404);
    });

    it("should reject a booking when the event does not exist", async () => {
        await request(app.getHttpServer())
            .post("/events/999/book")
            .send({
                user_id: 1,
            })
            .expect(404);
    });

    it("should reject cancellation by a non-booking owner", async () => {
        const bookingResponse = await request(app.getHttpServer())
            .post("/events/1/book")
            .send({
                user_id: 1,
            })
            .expect(201);

        const booking = bookingResponse.body;

        try {
            await request(app.getHttpServer())
                .delete(`/bookings/${booking.id}`)
                .send({
                    user_id: 2,
                })
                .expect(403);
        } finally {
            await request(app.getHttpServer())
                .delete(`/bookings/${booking.id}`)
                .send({
                    user_id: 1,
                })
                .expect(200);
        }
    });

    it("should reject a duplicate booking", async () => {
        const eventsResponse = await request(app.getHttpServer())
            .get("/events")
            .expect(200);

        const event = eventsResponse.body[0];

        // First booking
        const firstBookingResponse = await request(app.getHttpServer())
            .post(`/events/${event.id}/book`)
            .send({
                user_id: 1,
            })
            .expect(201);

        const booking = firstBookingResponse.body;

        // Duplicate booking
        await request(app.getHttpServer())
            .post(`/events/${event.id}/book`)
            .send({
                user_id: 1,
            })
            .expect(409);

        // Clean up
        await request(app.getHttpServer())
            .delete(`/bookings/${booking.id}`)
            .send({
                user_id: 1,
            })
            .expect(200);
    });

    async function findConflictingEvents(app: INestApplication) {
        const eventsResponse = await request(app.getHttpServer())
            .get("/events")
            .expect(200);

        const events = eventsResponse.body;

        for (let i = 0; i < events.length; i++) {
            for (let j = i + 1; j < events.length; j++) {
                const eventA = events[i];
                const eventB = events[j];

                if (
                    new Date(eventA.start_time) < new Date(eventB.end_time) &&
                    new Date(eventA.end_time) > new Date(eventB.start_time)
                ) {
                    return { eventA, eventB };
                }
            }
        }

        throw new Error("No conflicting events found");
    }

    it("should reject a booking that conflicts with another booking", async () => {
        const { eventA, eventB } = await findConflictingEvents(app);

        const firstBookingResponse = await request(app.getHttpServer())
            .post(`/events/${eventA.id}/book`)
            .send({
                user_id: 1,
            })
            .expect(201);

        const booking = firstBookingResponse.body;

        await request(app.getHttpServer())
            .post(`/events/${eventB.id}/book`)
            .send({
                user_id: 1,
            })
            .expect(409);

        await request(app.getHttpServer())
            .delete(`/bookings/${booking.id}`)
            .send({
                user_id: 1,
            })
            .expect(200);
    });

    it("should reject a booking when the event is fully booked", async () => {
        await request(app.getHttpServer())
            .post("/events/3/book")
            .send({
                user_id: 1,
            })
            .expect(409);
    });
});

