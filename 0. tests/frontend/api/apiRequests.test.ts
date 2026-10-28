import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "../../../3. frontend/src/api/apiRequest";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("apiRequest", () => {
    it("returns JSON from a successful response", async () => {
        const data = { id: 1, name: "Test" };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(data),
        });

        vi.stubGlobal("fetch", fetchMock);

        await expect(
            apiRequest("/test", "Request failed"),
        ).resolves.toEqual(data);

        expect(fetchMock).toHaveBeenCalledWith("/test");
    });

    it("throws the provided message when the response fails", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: vi.fn(),
        });

        vi.stubGlobal("fetch", fetchMock);

        await expect(
            apiRequest("/test", "Custom failure message"),
        ).rejects.toThrow("Custom failure message");
    });

    it("passes request options to fetch", async () => {
        const options: RequestInit = {
            method: "DELETE",
            body: JSON.stringify({ user_id: 1 }),
        };

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ success: true }),
        });

        vi.stubGlobal("fetch", fetchMock);

        await apiRequest("/test", "Request failed", options);

        expect(fetchMock).toHaveBeenCalledWith("/test", options);
    });
});
