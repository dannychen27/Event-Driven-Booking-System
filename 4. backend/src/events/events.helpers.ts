export function buildEventDateRangeFilters({
    startAfter,
    startBefore,
}: {
    startAfter?: string;
    startBefore?: string;
}): {
    conditions: string[];
    params: string[];
} {
    const conditions: string[] = [];
    const parameters: string[] = [];

    if (startAfter) {
        parameters.push(startAfter);
        conditions.push(`e.start_time >= $${parameters.length}`);
    }

    if (startBefore) {
        parameters.push(startBefore);
        conditions.push(`e.start_time < $${parameters.length}`);
    }

    return { conditions, params: parameters };
}
