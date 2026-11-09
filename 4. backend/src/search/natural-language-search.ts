import {
  SearchFilters,
  NaturalLanguageSearchPlan,
} from '../types/search/natural-language-search.types';
import {
  RelativeDateRange,
  Weekday,
} from '../types/search/relative-date-range.types';
import {
  MAX_EVENT_SEARCH_KEYWORD_LENGTH,
  ALLOWED_NATURAL_LANGUAGE_FIELDS,
  MAX_NATURAL_LANGUAGE_INTENT_LENGTH,
  ALLOWED_FIELDS,
} from '../constants/search.constants';
import {
  validateInputFields,
  validateOptionalString,
  validateDateRange,
  buildDateRangeFilters,
  validateOptionalBoolean,
  validateOptionalTimeOfDay,
  validateOptionalTimeRange,
} from '../helpers/search/natural-language-search.helpers';

export function validateSearchFilters(input: unknown): SearchFilters {
  const inputFields = validateInputFields({
    input,
    objectErrorMessage: 'Search filters must be an object',
    allowedFields: ALLOWED_FIELDS,
    unsupportedFieldErrorPrefix: 'Unsupported search filter: ',
  });

  const {
    keyword,
    startAfter,
    startBefore,
    timeOfDay,
    timeRange,
    includePastEvents,
    includeFutureEvents,
  } = inputFields;
  const validatedKeyword = validateOptionalString({
    value: keyword,
    fieldName: 'keyword',
    maxLength: MAX_EVENT_SEARCH_KEYWORD_LENGTH,
  });
  const validatedIncludePastEvents = validateOptionalBoolean({
    value: includePastEvents,
    fieldName: 'includePastEvents',
  });
  const validatedIncludeFutureEvents = validateOptionalBoolean({
    value: includeFutureEvents,
    fieldName: 'includeFutureEvents',
  });

  const validatedTimeOfDay = validateOptionalTimeOfDay({
    value: timeOfDay,
  });
  const validatedTimeRange = validateOptionalTimeRange({
    value: timeRange,
  });

  validateDateRange({ startAfter, startBefore });

  return {
    ...(validatedKeyword !== undefined ? { keyword: validatedKeyword } : {}),
    ...buildDateRangeFilters({ startAfter, startBefore }),
    ...(validatedIncludePastEvents !== undefined
      ? { includePastEvents: validatedIncludePastEvents }
      : {}),
    ...(validatedIncludeFutureEvents !== undefined
      ? { includeFutureEvents: validatedIncludeFutureEvents }
      : {}),
    ...(validatedTimeOfDay !== undefined
      ? { timeOfDay: validatedTimeOfDay }
      : {}),
    ...(validatedTimeRange !== undefined
      ? { timeRange: validatedTimeRange }
      : {}),
  };
}

const VALID_WEEKDAYS = new Set<Weekday>([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

const VALID_OCCURRENCES = new Set(['THIS', 'NEXT', 'LAST']);

function validateExactKeys(
    input: Record<string, unknown>,
    expectedKeys: string[],
): void {
  const actualKeys = Object.keys(input);

  if (
      actualKeys.length !== expectedKeys.length ||
      actualKeys.some((key) => !expectedKeys.includes(key))
  ) {
    throw new Error('Invalid fields in relative date range');
  }
}

function validateRelativeDateRange(
    input: unknown,
): RelativeDateRange {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('relativeDate must be an object');
  }

  const value = input as Record<string, unknown>;

  if (typeof value.kind !== 'string') {
    throw new Error('relativeDate.kind must be a string');
  }

  switch (value.kind) {
    case 'TODAY':
    case 'TOMORROW':
    case 'YESTERDAY':
    case 'THIS_WEEKEND':
    case 'NEXT_WEEKEND':
    case 'NEXT_BUSINESS_DAY':
    case 'PREVIOUS_BUSINESS_DAY':
      validateExactKeys(value, ['kind']);
      return { kind: value.kind };

    case 'DAYS_FROM_NOW':
    case 'DAYS_AGO':
    case 'BUSINESS_DAYS_FROM_NOW':
    case 'BUSINESS_DAYS_AGO': {
      validateExactKeys(value, ['kind', 'days']);

      if (
          typeof value.days !== 'number' ||
          !Number.isInteger(value.days) ||
          value.days < 1 ||
          value.days > 365
      ) {
        throw new Error('relativeDate.days must be an integer between 1 and 365');
      }

      return {
        kind: value.kind,
        days: value.days,
      };
    }

    case 'WEEKDAY':
      validateExactKeys(value, ['kind', 'weekday', 'occurrence']);

      if (
          typeof value.weekday !== 'string' ||
          !VALID_WEEKDAYS.has(value.weekday as Weekday)
      ) {
        throw new Error('relativeDate.weekday is invalid');
      }

      if (
          typeof value.occurrence !== 'string' ||
          !VALID_OCCURRENCES.has(value.occurrence)
      ) {
        throw new Error('relativeDate.occurrence is invalid');
      }

      return {
        kind: 'WEEKDAY',
        weekday: value.weekday as Weekday,
        occurrence: value.occurrence as 'THIS' | 'NEXT' | 'LAST',
      };

    default:
      throw new Error('Unsupported relative date kind');
  }
}

export function validateNaturalLanguageSearchPlan(
  input: unknown,
): NaturalLanguageSearchPlan {
  const inputFields = validateInputFields({
    input,
    objectErrorMessage: 'Natural-language search plan must be an object',
    allowedFields: ALLOWED_NATURAL_LANGUAGE_FIELDS,
    unsupportedFieldErrorPrefix: 'Unsupported natural-language search field: ',
  });

  const {
    intent,
    startAfter,
    startBefore,
    relativeDate,
    timeOfDay,
    timeRange,
    includePastEvents,
    includeFutureEvents,
  } = inputFields;
  const validatedIntent = validateOptionalString({
    value: intent,
    fieldName: 'intent',
    maxLength: MAX_NATURAL_LANGUAGE_INTENT_LENGTH,
  });
  const validatedIncludePastEvents = validateOptionalBoolean({
    value: includePastEvents,
    fieldName: 'includePastEvents',
  });
  const validatedIncludeFutureEvents = validateOptionalBoolean({
    value: includeFutureEvents,
    fieldName: 'includeFutureEvents',
  });

  const validatedTimeOfDay = validateOptionalTimeOfDay({
    value: timeOfDay,
  });
  const validatedTimeRange = validateOptionalTimeRange({
    value: timeRange,
  });

  validateDateRange({ startAfter, startBefore });

  if (
      relativeDate !== undefined &&
      (startAfter !== undefined || startBefore !== undefined)
  ) {
    throw new Error(
      'Cannot combine relativeDate with absolute date boundaries',
    );
  }

  const validatedRelativeDate =
    relativeDate !== undefined
      ? validateRelativeDateRange(relativeDate)
      : undefined;

  return {
    ...(validatedIntent !== undefined ? { intent: validatedIntent } : {}),
    ...buildDateRangeFilters({ startAfter, startBefore }),
    ...(validatedRelativeDate !== undefined
      ? { relativeDate: validatedRelativeDate }
      : {}),
    ...(validatedIncludePastEvents !== undefined
      ? { includePastEvents: validatedIncludePastEvents }
      : {}),
    ...(validatedIncludeFutureEvents !== undefined
      ? { includeFutureEvents: validatedIncludeFutureEvents }
      : {}),
    ...(validatedTimeOfDay !== undefined
      ? { timeOfDay: validatedTimeOfDay }
      : {}),
    ...(validatedTimeRange !== undefined
      ? { timeRange: validatedTimeRange }
      : {}),
  };
}
