import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../4. backend/src/app.module";


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

    it("should return all venues", async () => {
        const response = await request(app.getHttpServer())
            .get("/venues")
            .expect(200);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 1,
                    name: "E2E Test Venue",
                    address: "1 Test Street",
                }),
            ]),
        );
    });

    it("should return the requested venue", async () => {
        const response = await request(app.getHttpServer())
            .get("/venues/1")
            .expect(200);

        expect(response.body).toMatchObject({
            id: 1,
            name: "E2E Test Venue",
            address: "1 Test Street",
        });
    });

    it("should return 404 for a nonexistent venue", async () => {
        await request(app.getHttpServer())
            .get("/venues/999")
            .expect(404);
    });
});

