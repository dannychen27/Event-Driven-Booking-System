
import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

import {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
    NaturalLanguageSearchRequest,
    NaturalLanguageSearchResolutions,
    SearchFilterResolution,
} from '../types/search/natural-language-search-request.types';

import {
    validateInputFields,
    validateOptionalTimeOfDay,
    validateOptionalTimeRange,
} from '../helpers/search/natural-language-search.helpers';

import { validateNaturalLanguageSearchQuery } from '../helpers/search/event-search-validation.helpers';

const TORONTO_TIMEZONE = 'America/Toronto';

function asBadRequest<T>(validate: () => T): T {
    try {
        return validate();
    } catch (error) {
        if (error instanceof BadRequestException) {
            throw error;
        }

        if (error instanceof Error) {
            throw new BadRequestException(error.message);
        }

        throw error;
    }
}

function validateCalendarDate(value: unknown, fieldName: string): string {
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        throw new BadRequestException(
            `${fieldName} must be a valid YYYY-MM-DD date`,
        );
    }

    const parsed = DateTime.fromFormat(value, 'yyyy-MM-dd', {
        zone: TORONTO_TIMEZONE,
        locale: 'en',
    });

    if (!parsed.isValid || parsed.toFormat('yyyy-MM-dd') !== value) {
        throw new BadRequestException(
            `${fieldName} must be a real calendar date`,
        );
    }

    return value;
}

function validateDateSelection(
    value: unknown,
): CalendarDateRange {
    const fields = asBadRequest(() => validateInputFields({
        input: value,
        objectErrorMessage: 'Date selection must be an object',
        allowedFields: new Set(['startDate', 'endDate']),
        unsupportedFieldErrorPrefix: 'Unsupported date selection field: ',
    }));

    if (fields.startDate === undefined || fields.endDate === undefined) {
        throw new BadRequestException(
            'Date selection requires startDate and endDate',
        );
    }

    const startDate = validateCalendarDate(
        fields.startDate,
        'startDate',
    );
    const endDate = validateCalendarDate(
        fields.endDate,
        'endDate',
    );

    if (endDate < startDate) {
        throw new BadRequestException(
            'endDate must be on or after startDate',
        );
    }

    return { startDate, endDate };
}

function validateTimeSelection(
    value: unknown,
): CalendarTimeSelection {
    const fields = asBadRequest(() => validateInputFields({
        input: value,
        objectErrorMessage: 'Time selection must be an object',
        allowedFields: new Set(['timeOfDay', 'timeRange']),
        unsupportedFieldErrorPrefix: 'Unsupported time selection field: ',
    }));

    const timeOfDay = asBadRequest(() =>
        validateOptionalTimeOfDay({
            value: fields.timeOfDay,
        }),
    );

    const timeRange = asBadRequest(() =>
        validateOptionalTimeRange({
            value: fields.timeRange,
        }),
    );

    if (timeOfDay === undefined && timeRange === undefined) {
        throw new BadRequestException(
            'Time selection requires timeOfDay or timeRange',
        );
    }

    return {
        ...(timeOfDay !== undefined ? { timeOfDay } : {}),
        ...(timeRange !== undefined ? { timeRange } : {}),
    };
}

function validateExplicitSelection<T>(
    value: unknown,
    fieldName: string,
    validateValue: (value: unknown) => T,
): ExplicitSelection<T> {
    const fields = asBadRequest(() => validateInputFields({
        input: value,
        objectErrorMessage: `${fieldName} selection must be an object`,
        allowedFields: new Set(['state', 'value']),
        unsupportedFieldErrorPrefix: `Unsupported ${fieldName} selection field: `,
    }));

    if (fields.state === 'cleared') {
        if (fields.value !== undefined) {
            throw new BadRequestException(
                `${fieldName} cleared selection must not contain a value`,
            );
        }

        return { state: 'cleared' };
    }

    if (fields.state === 'selected') {
        if (fields.value === undefined) {
            throw new BadRequestException(
                `${fieldName} selected selection requires a value`,
            );
        }

        return {
            state: 'selected',
            value: validateValue(fields.value),
        };
    }

    throw new BadRequestException(
        `${fieldName} selection state must be selected or cleared`,
    );
}

function validateResolution(
    value: unknown,
    fieldName: string,
): SearchFilterResolution {
    if (value !== 'ai' && value !== 'selection') {
        throw new BadRequestException(
            `${fieldName} resolution must be ai or selection`,
        );
    }

    return value;
}

function validateResolutions(
    value: unknown,
    filters: NaturalLanguageSearchRequest['filters'],
): NaturalLanguageSearchResolutions | undefined {
    if (value === undefined) {
        return undefined;
    }

    const fields = asBadRequest(() => validateInputFields({
        input: value,
        objectErrorMessage: 'Resolutions must be an object',
        allowedFields: new Set(['date', 'time']),
        unsupportedFieldErrorPrefix: 'Unsupported resolution category: ',
    }));

    const date =
        fields.date !== undefined
            ? validateResolution(fields.date, 'date')
            : undefined;

    const time =
        fields.time !== undefined
            ? validateResolution(fields.time, 'time')
            : undefined;

    if (date !== undefined && filters?.date === undefined) {
        throw new BadRequestException(
            'Date resolution requires an explicit date selection',
        );
    }

    if (time !== undefined && filters?.time === undefined) {
        throw new BadRequestException(
            'Time resolution requires an explicit time selection',
        );
    }

    return {
        ...(date !== undefined ? { date } : {}),
        ...(time !== undefined ? { time } : {}),
    };
}

export function validateNaturalLanguageSearchRequest(
    input: unknown,
): NaturalLanguageSearchRequest {
    const fields = asBadRequest(() => validateInputFields({
        input,
        objectErrorMessage: 'Natural-language search request must be an object',
        allowedFields: new Set(['query', 'filters', 'resolutions']),
        unsupportedFieldErrorPrefix: 'Unsupported natural-language search request field: ',
    }));

    const query =
        fields.query !== undefined
            ? validateNaturalLanguageSearchQuery(fields.query)
            : undefined;

    let filters: NaturalLanguageSearchRequest['filters'];

    if (fields.filters !== undefined) {
        const filterFields = asBadRequest(() => validateInputFields({
            input: fields.filters,
            objectErrorMessage: 'Search filters must be an object',
            allowedFields: new Set(['date', 'time']),
            unsupportedFieldErrorPrefix: 'Unsupported search filter: ',
        }));

        filters = {
            ...(filterFields.date !== undefined
                ? {
                    date: validateExplicitSelection(
                        filterFields.date,
                        'date',
                        validateDateSelection,
                    ),
                }
                : {}),
            ...(filterFields.time !== undefined
                ? {
                    time: validateExplicitSelection(
                        filterFields.time,
                        'time',
                        validateTimeSelection,
                    ),
                }
                : {}),
        };
    }

    const resolutions = validateResolutions(fields.resolutions, filters);

    const hasSelectedFilter = Object.values(filters ?? {}).some(
        (selection) => selection?.state === 'selected',
    );

    if (query === undefined && !hasSelectedFilter) {
        throw new BadRequestException(
            'A query or at least one selected date/time filter is required',
        );
    }

    if (resolutions !== undefined && query === undefined) {
        throw new BadRequestException(
            'Resolutions require a natural-language query',
        );
    }

    return {
        ...(query !== undefined ? { query } : {}),
        ...(filters !== undefined ? { filters } : {}),
        ...(resolutions !== undefined ? { resolutions } : {}),
    };
}
