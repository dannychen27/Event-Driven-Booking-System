import { TimeOfDay, TimeRange, TimeInterval } from '../types/search/time-range.types';

function formatMinuteOfDay(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function buildTimeIntervalCondition(
    intervals: TimeInterval[],
    parameters: string[],
    initialParamCount: number,
): string {
  const localEventTime =
      "(e.start_time AT TIME ZONE 'America/Toronto')::time";

  const intervalConditions = intervals.map(
      ({ startMinute, endMinute }) => {
        if (
            !Number.isInteger(startMinute) ||
            !Number.isInteger(endMinute) ||
            startMinute < 0 ||
            endMinute > 1440 ||
            startMinute >= endMinute
        ) {
          throw new Error('Invalid normalized time interval');
        }

        const conditions: string[] = [];

        if (startMinute > 0) {
          parameters.push(formatMinuteOfDay(startMinute));
          conditions.push(
              `${localEventTime} >= $${initialParamCount + parameters.length}::time`,
          );
        }

        if (endMinute < 1440) {
          parameters.push(formatMinuteOfDay(endMinute));
          conditions.push(
              `${localEventTime} < $${initialParamCount + parameters.length}::time`,
          );
        }

        return conditions.length > 0
            ? `(${conditions.join(' AND ')})`
            : '(TRUE)';
      },
  );

  return intervalConditions.length === 1
    ? intervalConditions[0]
    : `(${intervalConditions.join(' OR ')})`;
}

export function buildEventDateRangeFilters({
  startAfter,
  startBefore,
  includePastEvents,
  includeFutureEvents,
  timeOfDay,
  timeRange,
  timeIntervals,
  initialParamCount = 0,
}: {
  startAfter?: string;
  startBefore?: string;
  includePastEvents?: boolean;
  includeFutureEvents?: boolean;
  timeOfDay?: TimeOfDay;
  timeRange?: TimeRange;
  timeIntervals?: TimeInterval[];
  initialParamCount?: number;
}): {
  conditions: string[];
  params: string[];
} {
  const conditions: string[] = [];
  const parameters: string[] = [];

  if (startAfter) {
    parameters.push(startAfter);
    conditions.push(`e.start_time >= $${initialParamCount + parameters.length}`);
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

  if (timeIntervals !== undefined) {
    if (timeIntervals.length === 0) {
      // An empty interval set must never become an unrestricted search.
      conditions.push('FALSE');
    } else {
      conditions.push(
        buildTimeIntervalCondition(
          timeIntervals,
          parameters,
          initialParamCount,
        ),
      );
    }
  }

  return { conditions, params: parameters };
}
