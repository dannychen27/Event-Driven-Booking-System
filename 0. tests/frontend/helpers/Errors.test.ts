import { describe, expect, it } from "vitest";
import { getErrorMessage } from "../../../3. frontend/src/utils/Errors.ts";

describe("getErrorMessage", () => {
    it("returns the message from an Error", () => {
        expect(
            getErrorMessage(
                new Error("Something went wrong"),
                "Fallback message",
            ),
        ).toBe("Something went wrong");
    });

    it("returns the fallback for a string", () => {
        expect(
            getErrorMessage("Something went wrong", "Fallback message"),
        ).toBe("Fallback message");
    });

    it("returns the fallback for null", () => {
        expect(
            getErrorMessage(null, "Fallback message"),
        ).toBe("Fallback message");
    });

    it("returns the fallback for undefined", () => {
        expect(
            getErrorMessage(undefined, "Fallback message"),
        ).toBe("Fallback message");
    });
});
