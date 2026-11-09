import { TimeOfDay, TimeRange } from './time-range.types';
import { RelativeDateRange } from './relative-date-range.types';

export type SearchFilters = {
  keyword?: string;
  startAfter?: string;
  startBefore?: string;
  timeOfDay?: TimeOfDay;
  timeRange?: TimeRange;
  includePastEvents?: boolean;
  includeFutureEvents?: boolean;
};

export type NaturalLanguageSearchPlan = {
  intent?: string;
  startAfter?: string;
  startBefore?: string;
  relativeDate?: RelativeDateRange;
  timeOfDay?: TimeOfDay;
  timeRange?: TimeRange;
  includePastEvents?: boolean;
  includeFutureEvents?: boolean;
};
