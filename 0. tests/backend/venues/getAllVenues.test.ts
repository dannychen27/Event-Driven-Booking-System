import { VenuesService } from "../../../4. backend/src/venues/venues.service";
import { expectNthQuery } from "../../utils/testHelpers";
import { mockGetAllVenues } from "../helpers/venuesTestHelpers";


describe("VenuesService.getAllVenues", () => {
    let service: VenuesService;
    let db: any;

    beforeEach(() => {
        db = {
            query: jest.fn(),
        };

        service = new VenuesService(db);
    });

    it("should return all venues", async () => {
        const venues = [
            {
                id: 1,
                name: "Bahen Centre",
                address: "40 St George St",
            },
            {
                id: 2,
                name: "Convocation Hall",
                address: "31 King's College Cir",
            },
        ];
        mockGetAllVenues(db, venues);

        const result = await service.getAllVenues();

        expect(result).toEqual(venues);
        expect(db.query).toHaveBeenCalledTimes(1);

        expectNthQuery(db, 1, "FROM venues");
    });
});

