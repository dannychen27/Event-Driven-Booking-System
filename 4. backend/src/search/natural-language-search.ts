import { SearchFilters, NaturalLanguageSearchPlan } from './natural-language-search.types';
import { MAX_EVENT_SEARCH_KEYWORD_LENGTH } from './search.constants';

const ALLOWED_FIELDS = new Set(['keyword', 'startAfter', 'startBefore']);

const ALLOWED_NATURAL_LANGUAGE_FIELDS = new Set([
  'intent',
  'startAfter',
  'startBefore',
]);

export function validateSearchFilters(input: unknown): SearchFilters {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Search filters must be an object');
  }

  const fields = input as Record<string, unknown>;

  for (const key of Object.keys(fields)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new Error(`Unsupported search filter: ${key}`);
    }
  }

  const { keyword, startAfter, startBefore } = fields;

  if (keyword !== undefined) {
    if (
      typeof keyword !== 'string' ||
      keyword.trim().length === 0 ||
      keyword.trim().length > MAX_EVENT_SEARCH_KEYWORD_LENGTH
    ) {
      throw new Error(
        'keyword must be a non-empty string of at most 100 characters',
      );
    }
  }

  for (const [name, value] of [
    ['startAfter', startAfter],
    ['startBefore', startBefore],
  ] as const) {
    if (value !== undefined) {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        throw new Error(`${name} must be a valid date`);
      }
    }
  }

  if (
    startAfter !== undefined &&
    startBefore !== undefined &&
    Date.parse(startAfter as string) >= Date.parse(startBefore as string)
  ) {
    throw new Error('startAfter must be earlier than startBefore');
  }

  return {
    ...(keyword !== undefined ? { keyword: keyword.trim() } : {}),
    ...(startAfter !== undefined ? { startAfter: startAfter as string } : {}),
    ...(startBefore !== undefined
      ? { startBefore: startBefore as string }
      : {}),
  };
}

export function validateNaturalLanguageSearchPlan(
  input: unknown,
): NaturalLanguageSearchPlan {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Natural-language search plan must be an object');
  }

  const fields = input as Record<string, unknown>;

  for (const key of Object.keys(fields)) {
    if (!ALLOWED_NATURAL_LANGUAGE_FIELDS.has(key)) {
      throw new Error(`Unsupported natural-language search field: ${key}`);
    }
  }

  const { intent, startAfter, startBefore } = fields;

  if (
    intent !== undefined &&
    (typeof intent !== 'string' ||
      intent.trim().length === 0 ||
      intent.trim().length > 300)
  ) {
    throw new Error(
      'intent must be a non-empty string of at most 300 characters',
    );
  }

  for (const [name, value] of [
    ['startAfter', startAfter],
    ['startBefore', startBefore],
  ] as const) {
    if (value !== undefined) {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        throw new Error(`${name} must be a valid date`);
      }
    }
  }

  if (
    startAfter !== undefined &&
    startBefore !== undefined &&
    Date.parse(startAfter as string) >= Date.parse(startBefore as string)
  ) {
    throw new Error('startAfter must be earlier than startBefore');
  }

  return {
    ...(intent !== undefined ? { intent: intent.trim() } : {}),
    ...(startAfter !== undefined ? { startAfter: startAfter as string } : {}),
    ...(startBefore !== undefined
      ? { startBefore: startBefore as string }
      : {}),
  };
}
