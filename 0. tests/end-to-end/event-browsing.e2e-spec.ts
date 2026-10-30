import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../4. backend/src/app.module";
import {
    E2E_FULL_EVENT_FIXTURE,
    E2E_TEST_EVENT_FIXTURE,
} from "./fixtures/events/eventFixtures";

describe("Event browsing (E2E)", () => {
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

    it("should return all seeded events", async () => {
        const response = await request(app.getHttpServer())
            .get("/events")
            .expect(200);

        expect(response.body).toHaveLength(3);
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: E2E_TEST_EVENT_FIXTURE.id,
                    name: E2E_TEST_EVENT_FIXTURE.name,
                    venue_id: E2E_TEST_EVENT_FIXTURE.venue_id,
                }),
            ]),
        );
    });

    it("should return the requested event", async () => {
        const response = await request(app.getHttpServer())
            .get(`/events/${E2E_TEST_EVENT_FIXTURE.id}`)
            .expect(200);

        expect(response.body).toMatchObject({
            id: E2E_TEST_EVENT_FIXTURE.id,
            name: E2E_TEST_EVENT_FIXTURE.name,
            venue_id: E2E_TEST_EVENT_FIXTURE.venue_id,
            capacity: E2E_TEST_EVENT_FIXTURE.capacity,
        });

        expect(response.body.start_time).toEqual(expect.any(String));
        expect(response.body.end_time).toEqual(expect.any(String));
    });

    it("should return event availability", async () => {
        const response = await request(app.getHttpServer())
            .get(`/events/${E2E_FULL_EVENT_FIXTURE.id}/availability`)
            .expect(200);

        expect(response.body).toMatchObject({
            capacity: E2E_FULL_EVENT_FIXTURE.capacity,
            booked: 1,
            available: 0,
        });
    });

    it("should return 404 for a nonexistent event", async () => {
        await request(app.getHttpServer())
            .get("/events/999")
            .expect(404);
    });
});

