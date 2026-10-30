export function buildEventDateRangeFilters({
    startAfter,
    startBefore,
    initialParamCount = 0,
}: {
    startAfter?: string;
    startBefore?: string;
    initialParamCount?: number;
}): {
    conditions: string[];
    params: string[];
} {
    const conditions: string[] = [];
    const parameters: string[] = [];

    if (startAfter) {
        parameters.push(startAfter);
        conditions.push(
            `e.start_time >= $${initialParamCount + parameters.length}`,
        );
    }

    if (startBefore) {
        parameters.push(startBefore);
        conditions.push(
            `e.start_time < $${initialParamCount + parameters.length}`,
        );
    }

    return { conditions, params: parameters };
}
