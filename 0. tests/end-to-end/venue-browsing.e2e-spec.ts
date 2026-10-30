import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../4. backend/src/app.module";
import { E2E_TEST_VENUE_FIXTURE } from "./fixtures/venues/venueFixtures";

describe("Venue browsing (E2E)", () => {
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

    it("should return all seeded venues", async () => {
        const response = await request(app.getHttpServer())
            .get("/venues")
            .expect(200);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining(E2E_TEST_VENUE_FIXTURE),
            ]),
        );
    });

    it("should return the requested venue", async () => {
        const response = await request(app.getHttpServer())
            .get(`/venues/${E2E_TEST_VENUE_FIXTURE.id}`)
            .expect(200);

        expect(response.body).toMatchObject(
            E2E_TEST_VENUE_FIXTURE,
        );
    });

    it("should return 404 for a nonexistent venue", async () => {
        await request(app.getHttpServer())
            .get("/venues/999")
            .expect(404);
    });
});

