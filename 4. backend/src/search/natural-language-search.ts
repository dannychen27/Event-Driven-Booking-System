import { SearchFilters, NaturalLanguageSearchPlan } from './natural-language-search.types';
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
} from '../helpers/search/natural-language-search.helpers';

export function validateSearchFilters(input: unknown): SearchFilters {
  const inputFields = validateInputFields({
    input,
    objectErrorMessage: 'Search filters must be an object',
    allowedFields: ALLOWED_FIELDS,
    unsupportedFieldErrorPrefix: 'Unsupported search filter: ',
  });

  const { keyword, startAfter, startBefore } = inputFields;
  const validatedKeyword = validateOptionalString({
    value: keyword,
    fieldName: 'keyword',
    maxLength: MAX_EVENT_SEARCH_KEYWORD_LENGTH,
  });

  validateDateRange({ startAfter, startBefore });

  return {
    ...(validatedKeyword !== undefined
      ? { keyword: validatedKeyword }
      : {}),
    ...buildDateRangeFilters({ startAfter, startBefore }),
  };
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

  const { intent, startAfter, startBefore } = inputFields;
  const validatedIntent = validateOptionalString({
    value: intent,
    fieldName: 'intent',
    maxLength: MAX_NATURAL_LANGUAGE_INTENT_LENGTH,
  });

  validateDateRange({ startAfter, startBefore });

  return {
    ...(validatedIntent !== undefined
      ? { intent: validatedIntent }
      : {}),
    ...buildDateRangeFilters({ startAfter, startBefore }),
  };
}
