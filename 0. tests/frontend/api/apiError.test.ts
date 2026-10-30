import { describe, expect, it, vi } from "vitest";

import { getApiErrorMessage } from "../../../3. frontend/src/api/apiError";

describe("getApiErrorMessage", () => {
    it("returns a valid backend error message", async () => {
        const response = {
            json: vi.fn().mockResolvedValue({
                message: "AI search is temporarily unavailable.",
            }),
        } as unknown as Response;

        await expect(
            getApiErrorMessage(response, "Fallback message"),
        ).resolves.toBe("AI search is temporarily unavailable.");
    });

    it("returns the fallback when JSON parsing fails", async () => {
        const response = {
            json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        } as unknown as Response;

        await expect(
            getApiErrorMessage(response, "Fallback message"),
        ).resolves.toBe("Fallback message");
    });

    it.each([
        ["a missing message", {}],
        ["a null body", null],
        ["an empty message", { message: "" }],
        ["a whitespace-only message", { message: "   " }],
        ["a numeric message", { message: 123 }],
        ["an object message", { message: { detail: "Failure" } }],
    ])("returns the fallback for %s", async (_description, body) => {
        const response = {
            json: vi.fn().mockResolvedValue(body),
        } as unknown as Response;

        await expect(
            getApiErrorMessage(response, "Fallback message"),
        ).resolves.toBe("Fallback message");
    });
});
