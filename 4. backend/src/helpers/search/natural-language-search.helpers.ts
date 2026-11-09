import { SearchFilters } from '../../types/search/natural-language-search.types';
import { TimeOfDay, TimeRange } from '../../types/search/time-range.types';
import { VALID_TIME_OF_DAYS } from "./natural-language-search.helpers.constants";

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

export function validateOptionalBoolean({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean`);
  }

  return value;
}

export function validateOptionalTimeOfDay({
  value
}: {
  value: unknown;
}): TimeOfDay | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !VALID_TIME_OF_DAYS.has(value as TimeOfDay)) {
    throw new Error('timeOfDay is invalid');
  }

  return value as TimeOfDay;
}

function validateTimeString({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): string {
  if (
      typeof value !== 'string' ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  ) {
    throw new Error(`${fieldName} must be a valid HH:mm time`);
  }

  return value;
}

export function validateOptionalTimeRange({
  value,
}: {
  value: unknown;
}): TimeRange | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('timeRange must be an object');
  }

  const range = value as Record<string, unknown>;
  const keys = Object.keys(range);

  if (
      keys.length === 0 ||
      keys.some((key) => !['startTime', 'endTime'].includes(key))
  ) {
    throw new Error('timeRange must contain startTime or endTime only');
  }

  if (range.startTime === undefined && range.endTime === undefined) {
    throw new Error('timeRange must contain at least one time boundary');
  }

  const startTime =
    range.startTime !== undefined
      ? validateTimeString({
        value: range.startTime,
        fieldName: 'timeRange.startTime',
      })
      : undefined;

  const endTime =
    range.endTime !== undefined
      ? validateTimeString({
        value: range.endTime,
        fieldName: 'timeRange.endTime',
      })
      : undefined;

  if (startTime !== undefined && startTime === endTime) {
    throw new Error('timeRange startTime and endTime must differ');
  }

  return {
    ...(startTime !== undefined ? { startTime } : {}),
    ...(endTime !== undefined ? { endTime } : {}),
  };
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
