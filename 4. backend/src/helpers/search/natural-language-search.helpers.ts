import {SearchFilters} from "../../search/natural-language-search.types";

export function validateInputFields({
    input,
    objectErrorMessage,
    allowedFields,
    unsupportedFieldErrorPrefix,
}: {
    input: unknown;
    objectErrorMessage: string;
    allowedFields: Set<string>;
    unsupportedFieldErrorPrefix: string;
}): Record<string, unknown> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        throw new Error(objectErrorMessage);
    }

    const fields = input as Record<string, unknown>;
    for (const key of Object.keys(fields)) {
        if (!allowedFields.has(key)) {
            throw new Error(`${unsupportedFieldErrorPrefix}${key}`);
        }
    }

    return fields;
}

export function validateOptionalString({
    value,
    fieldName,
    maxLength,
}: {
    value: unknown;
    fieldName: string;
    maxLength: number;
}): string | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (
        typeof value !== 'string' ||
        value.trim().length === 0 ||
        value.trim().length > maxLength
    ) {
        throw new Error(
            `${fieldName} must be a non-empty string of at most ${maxLength} characters`,
        );
    }

    return value.trim();
}

export function validateDateRange({
    startAfter,
    startBefore,
}: {
    startAfter: unknown;
    startBefore: unknown;
}): void {
    for (const [name, value] of [
        ['startAfter', startAfter],
        ['startBefore', startBefore],
    ] as const) {
        if (value === undefined) {
            continue;
        }

        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
            throw new Error(`${name} must be a valid date`);
        }
    }

    if (
        startAfter !== undefined &&
        startBefore !== undefined &&
        Date.parse(startAfter as string) >= Date.parse(startBefore as string)
    ) {
        throw new Error('startAfter must be earlier than startBefore');
    }
}

export function buildDateRangeFilters({
    startAfter,
    startBefore,
}: {
    startAfter: unknown;
    startBefore: unknown;
}): Pick<SearchFilters, 'startAfter' | 'startBefore'> {
    return {
        ...(startAfter !== undefined ? { startAfter: startAfter as string } : {}),
        ...(startBefore !== undefined
            ? { startBefore: startBefore as string }
            : {}),
    };
}
