import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../4. backend/src/app.module";


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

    it("should return the requested event", async () => {
        const response = await request(app.getHttpServer())
            .get("/events/1")
            .expect(200);

        expect(response.body).toMatchObject({
            id: 1,
            capacity: 10,
        });

        expect(response.body.start_time).toEqual(expect.any(String));
        expect(response.body.end_time).toEqual(expect.any(String));
    });

    it("should return event availability", async () => {
        const response = await request(app.getHttpServer())
            .get("/events/1/availability")
            .expect(200);

        expect(response.body).toBeDefined();
    });

    it("should return 404 for a nonexistent event", async () => {
        await request(app.getHttpServer())
            .get("/events/999")
            .expect(404);
    });
});

