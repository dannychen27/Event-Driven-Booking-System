import { EventCandidate } from "../../../events/events.types";
import { parseGeminiJsonResponse } from "./gemini-response-helpers";

export function parseRankedEventIds(
    response: string,
    candidates: EventCandidate[],
): number[] {
    const parsed = parseGeminiJsonResponse(
        response,
        'Gemini returned invalid ranking JSON',
    );

    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed) ||
        !('eventIds' in parsed) ||
        !Array.isArray(parsed.eventIds) ||
        !parsed.eventIds.every(
            (id: unknown) => Number.isSafeInteger(id) && Number(id) > 0,
        )
    ) {
        throw new Error('Gemini returned an invalid event ranking');
    }

    const candidateIds = new Set(candidates.map((event) => event.id));
    const rankedIds = parsed.eventIds as number[];

    if (
        rankedIds.some((id) => !candidateIds.has(id)) ||
        new Set(rankedIds).size !== rankedIds.length
    ) {
        throw new Error('Gemini returned unknown or duplicate event IDs');
    }

    return rankedIds;
}
