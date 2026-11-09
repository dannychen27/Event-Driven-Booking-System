import { RelativeDateRange } from './relative-date-range.types';

export type SearchFilters = {
  keyword?: string;
  startAfter?: string;
  startBefore?: string;
};

export type NaturalLanguageSearchPlan = {
  intent?: string;
  startAfter?: string;
  startBefore?: string;
  relativeDate?: RelativeDateRange;
};
