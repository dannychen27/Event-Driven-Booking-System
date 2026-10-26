import { VenuesService } from "../../../4. backend/src/venues/venues.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";

describe("VenuesService.getAllVenues", () => {
    it("should return all venues", async () => {
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
            query: jest.fn().mockResolvedValueOnce({
                rows: venues,
            }),
        } as unknown as DatabaseService;

        const service = new VenuesService(db);

        const result = await service.getAllVenues();

        expect(result).toEqual(venues);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array when there are no venues", async () => {
        const db = {
            query: jest.fn().mockResolvedValueOnce({
                rows: [],
            }),
        } as unknown as DatabaseService;

        const service = new VenuesService(db);

        const result = await service.getAllVenues();

        expect(result).toEqual([]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});

