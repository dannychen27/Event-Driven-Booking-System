import { BadRequestException } from '@nestjs/common';
import {
    MAX_EVENT_SEARCH_KEYWORD_LENGTH,
    MAX_NATURAL_LANGUAGE_QUERY_LENGTH,
} from '../constants/search.constants';

export function validateEventSearchKeyword(
    keyword?: string,
): void {
    if (keyword !== undefined && keyword.trim().length === 0) {
        throw new BadRequestException('keyword must not be empty');
    }

    if (
        keyword !== undefined &&
        keyword.trim().length > MAX_EVENT_SEARCH_KEYWORD_LENGTH
    ) {
        throw new BadRequestException('keyword must be at most 100 characters');
    }
}

export function validateEventSearchDateRange({
    startAfter,
    startBefore,
}: {
    startAfter?: string;
    startBefore?: string;
}): void {
    for (const [name, value] of [
        ['startAfter', startAfter],
        ['startBefore', startBefore],
    ] as const) {
        if (value !== undefined && Number.isNaN(Date.parse(value))) {
            throw new BadRequestException(`${name} must be a valid date`);
        }
    }

    if (
        startAfter !== undefined &&
        startBefore !== undefined &&
        Date.parse(startAfter) >= Date.parse(startBefore)
    ) {
        throw new BadRequestException(
            'startAfter must be earlier than startBefore',
        );
    }
}

export function validateNaturalLanguageSearchQuery(
    query: unknown,
): string {
    if (typeof query !== 'string' || !query.trim()) {
        throw new BadRequestException('query must be a non-empty string');
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length > MAX_NATURAL_LANGUAGE_QUERY_LENGTH) {
        throw new BadRequestException('query must be at most 500 characters');
    }

    return trimmedQuery;
}
