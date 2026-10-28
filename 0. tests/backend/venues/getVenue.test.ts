import { VenuesService } from "../../../4. backend/src/venues/venues.service";
import { expectNthQuery } from "../../utils/testHelpers";
import { mockGetVenue, mockVenueDoesNotExist } from "../helpers/venuesTestHelpers";
import { VENUE_NOT_FOUND_MESSAGE } from "../fixtures/errorMessageFixtures";
import { BAHEN_CENTRE_VENUE_FIXTURE } from "../fixtures/sharedTestFixtures";


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
        const venue = BAHEN_CENTRE_VENUE_FIXTURE;
        mockGetVenue(db, venue);

        const result = await service.getVenue(1);

        expect(result).toEqual(venue);
        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(db, 1, "FROM venues", [1]);
    });

    it("should reject the request when the venue does not exist", async () => {
        mockVenueDoesNotExist(db);

        await expect(service.getVenue(999))
            .rejects.toThrow(VENUE_NOT_FOUND_MESSAGE);

        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(db, 1, "FROM venues", [999]);
    });
});

