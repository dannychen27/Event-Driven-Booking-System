import { TimeOfDay, TimeRange } from '../types/search/time-range.types';


export function buildEventDateRangeFilters({
  startAfter,
  startBefore,
  includePastEvents,
  includeFutureEvents,
  timeOfDay,
  timeRange,
  initialParamCount = 0,
}: {
  startAfter?: string;
  startBefore?: string;
  includePastEvents?: boolean;
  includeFutureEvents?: boolean;
  timeOfDay?: TimeOfDay;
  timeRange?: TimeRange;
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
    conditions.push(`e.start_time < $${initialParamCount + parameters.length}`);
  }

  // exclude past events
  if (includePastEvents === false) {
    conditions.push('e.start_time >= statement_timestamp()');
  }

  // exclude future events
  if (includeFutureEvents === false) {
    conditions.push('e.start_time < statement_timestamp()');
  }

  const localEventTime = "(e.start_time AT TIME ZONE 'America/Toronto')::time";
  const timeOfDayConditions: Record<TimeOfDay, string> = {
    EARLY_MORNING: `${localEventTime} >= TIME '05:00' AND ${localEventTime} < TIME '08:00'`,
    MORNING: `${localEventTime} >= TIME '08:00' AND ${localEventTime} < TIME '12:00'`,
    AFTERNOON: `${localEventTime} >= TIME '12:00' AND ${localEventTime} < TIME '17:00'`,
    EVENING: `${localEventTime} >= TIME '17:00' AND ${localEventTime} < TIME '21:00'`,
    NIGHT: `(${localEventTime} >= TIME '21:00' OR ${localEventTime} < TIME '05:00')`,
  };

  if (timeOfDay) {
    conditions.push(`(${timeOfDayConditions[timeOfDay]})`);
  }

  if (timeRange) {
    const { startTime, endTime } = timeRange;

    const startParam = startTime
        ? `$${initialParamCount + parameters.length + 1}::time`
        : undefined;

    if (startTime) {
      parameters.push(startTime);
    }

    const endParam = endTime
        ? `$${initialParamCount + parameters.length + 1}::time`
        : undefined;

    if (endTime) {
      parameters.push(endTime);
    }

    if (startParam && endParam) {
      conditions.push(
        startTime! < endTime!
          ? `(${localEventTime} >= ${startParam} AND ${localEventTime} < ${endParam})`
          : `(${localEventTime} >= ${startParam} OR ${localEventTime} < ${endParam})`,
      );
    } else if (startParam) {
      conditions.push(`${localEventTime} >= ${startParam}`);
    } else if (endParam) {
      conditions.push(`${localEventTime} < ${endParam}`);
    }
  }

  return { conditions, params: parameters };
}
