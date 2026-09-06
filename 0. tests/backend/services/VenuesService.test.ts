import { VenuesService } from "../../../4. backend/src/venues/venues.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";


describe("VenuesService", () => {

    describe("getAllVenues", () => {

        it("returns all venues", async () => {
            const venues = [
                {
                    id: 1,
                    name: "Venue 1",
                    address: "1 Test Street",
                },
                {
                    id: 2,
                    name: "Venue 2",
                    address: "2 Test Street",
                },
            ];

            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: venues,
                    }),
            } as unknown as DatabaseService;

            const service = new VenuesService(db);

            const result = await service.getAllVenues();

            expect(result).toEqual(venues);
            expect(db.query).toHaveBeenCalledTimes(1);
        });


        it("returns an empty array when there are no venues", async () => {
            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            } as unknown as DatabaseService;

            const service = new VenuesService(db);

            const result = await service.getAllVenues();

            expect(result).toEqual([]);
            expect(db.query).toHaveBeenCalledTimes(1);
        });
    });


    describe("getVenue", () => {

        it("returns a venue successfully", async () => {
            const venue = {
                id: 1,
                name: "Venue 1",
                address: "1 Test Street",
            };

            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [venue],
                    }),
            } as unknown as DatabaseService;

            const service = new VenuesService(db);

            const result = await service.getVenue(1);

            expect(result).toEqual(venue);
            expect(db.query).toHaveBeenCalledTimes(1);
        });


        it("throws an error when the venue does not exist", async () => {
            const db = {
                query: jest
                    .fn()
                    .mockResolvedValueOnce({
                        rows: [],
                    }),
            } as unknown as DatabaseService;

            const service = new VenuesService(db);

            await expect(
                service.getVenue(1),
            ).rejects.toThrow("Venue 1 does not exist");
        });
    });
});

