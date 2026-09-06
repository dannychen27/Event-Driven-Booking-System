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
});

