import { VenuesService } from "../../../4. backend/src/venues/venues.service";
import { DatabaseService } from "../../../4. backend/src/database/database.service";

import { ALL_VENUES_FIXTURE } from "../fixtures/shared/sharedTestFixtures";

describe("VenuesService.getAllVenues", () => {
    it("should return all venues", async () => {
        const db = {
            query: jest.fn().mockResolvedValueOnce({
                rows: ALL_VENUES_FIXTURE,
            }),
        } as unknown as DatabaseService;

        const service = new VenuesService(db);

        const result = await service.getAllVenues();

        expect(result).toEqual(ALL_VENUES_FIXTURE);
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

