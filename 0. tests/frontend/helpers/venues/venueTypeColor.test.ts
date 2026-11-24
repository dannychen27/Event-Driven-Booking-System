import { describe, expect, it } from "vitest";
import { getVenueTypeColorClass } from "../../../../3. frontend/src/helpers/venues/venueTypeColor";

describe("getVenueTypeColorClass", () => {
    it("assigns the same colour to equivalent types regardless of case and whitespace", () => {
        expect(getVenueTypeColorClass("Community space")).toBe(
            getVenueTypeColorClass("  COMMUNITY   SPACE  "),
        );
    });

    it("returns a stable palette class for the same venue type", () => {
        const firstResult = getVenueTypeColorClass("Community space");

        expect(getVenueTypeColorClass("Community space")).toBe(firstResult);
        expect(firstResult).toMatch(/^venue-card__type--palette-[0-7]$/);
    });

    it("assigns intentional colours to known venue categories", () => {
        expect(getVenueTypeColorClass("Arts and culture centre")).toBe(
            "venue-card__type--palette-1",
        );
        expect(getVenueTypeColorClass("Café")).toBe(
            "venue-card__type--palette-3",
        );
        expect(getVenueTypeColorClass("Event venue")).toBe(
            "venue-card__type--palette-4",
        );
        expect(getVenueTypeColorClass("Public library")).toBe(
            "venue-card__type--palette-2",
        );
        expect(getVenueTypeColorClass("University building")).toBe(
            "venue-card__type--palette-0",
        );
    });

    it("normalizes known category names before looking them up", () => {
        expect(getVenueTypeColorClass("  CAFÉ  ")).toBe(
            getVenueTypeColorClass("Café"),
        );
        expect(getVenueTypeColorClass("PUBLIC   LIBRARY")).toBe(
            getVenueTypeColorClass("Public library"),
        );
    });

    it("provides a neutral default class for blank input", () => {
        expect(getVenueTypeColorClass("   ")).toBe(
            "venue-card__type--default",
        );
    });
});
