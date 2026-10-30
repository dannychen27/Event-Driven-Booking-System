import { vi } from "vitest";

export function mockJsonResponse(
    data: unknown,
    {
        ok = true,
        rejectJson = false,
    }: { ok?: boolean; rejectJson?: boolean } = {},
) {
    return {
        ok,
        json: rejectJson
            ? vi.fn().mockRejectedValue(new Error("Invalid JSON"))
            : vi.fn().mockResolvedValue(data),
    };
}

export function mockFetchResponse(
    data: unknown,
    {
        ok = true,
        rejectJson = false,
    }: { ok?: boolean; rejectJson?: boolean } = {},
) {
    const fetchMock = vi.fn().mockResolvedValue(
        mockJsonResponse(data, { ok, rejectJson }),
    );

    vi.stubGlobal("fetch", fetchMock);

    return fetchMock;
}
