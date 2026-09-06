import { VenuesService } from "../../../4. backend/src/venues/venues.service";
import { expectNthQuery } from "../../utils/testHelpers";


describe("VenuesService.getVenue", () => {
    let service: VenuesService;
    let db: any;

    beforeEach(() => {
        db = {
            query: jest.fn(),
        };

        service = new VenuesService(db);
    });

    it("should return the requested venue", async () => {
        const venue = {
            id: 1,
            name: "Bahen Centre",
            address: "40 St George St",
        };

        db.query.mockResolvedValueOnce({
            rows: [venue],
        });

        const result = await service.getVenue(1);

        expect(result).toEqual(venue);
        expect(db.query).toHaveBeenCalledTimes(1);
        expectNthQuery(db, 1, "FROM venues", [1]);
    });

    it("should reject the request when the venue does not exist", async () => {
        db.query.mockResolvedValueOnce({
            rows: [],
        });

        await expect(service.getVenue(999))
            .rejects.toThrow("Venue 999 does not exist");

        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(db, 1, "FROM venues", [999]);
    });
});

