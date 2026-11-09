import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EventsService } from '../events/events.service';

import { SearchFilters, NaturalLanguageSearchPlan } from '../types/search/natural-language-search.types';
import {
  NaturalLanguageSearchRequest,
  NaturalLanguageSearchResponse,
} from '../types/search/natural-language-search-request.types';

import { validateSearchFilters } from './natural-language-search';
import { validateNaturalLanguageSearchRequest } from './natural-language-search-request.validation';
import { reconcileDateFilter } from './natural-language-search-filter-reconciler';
import { reconcileTimeFilter } from './natural-language-search-time-reconciler';
import { resolveRelativeDateRange } from './relative-date-range.resolver';
import { GeminiEventSearchInterpreter } from '../events/search/gemini-event-search-interpreter';
import { GeminiEventRanker } from '../events/search/gemini-event-ranker';

@Injectable()
export class NaturalLanguageSearchService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly interpreter: GeminiEventSearchInterpreter,
    private readonly ranker: GeminiEventRanker,
  ) {}

  async search(input: unknown) {
    const filters: SearchFilters = validateSearchFilters(input);
    return this.eventsService.searchEvents(filters);
  }

  async searchNaturalLanguage(
      input: unknown,
  ): Promise<NaturalLanguageSearchResponse> {
    const request: NaturalLanguageSearchRequest =
        validateNaturalLanguageSearchRequest(input);

    try {
      // Calendar-only searches do not need an AI interpretation.
      const plan: NaturalLanguageSearchPlan = request.query
        ? await this.interpreter.interpret(request.query)
        : {};

      const aiDateRange = plan.relativeDate
        ? resolveRelativeDateRange(plan.relativeDate, new Date())
        : {
          startAfter: plan.startAfter,
          startBefore: plan.startBefore,
        };

      const dateResult = reconcileDateFilter({
        aiRange: aiDateRange,
        selection: request.filters?.date,
        resolution: request.resolutions?.date,
      });

      const timeResult = reconcileTimeFilter({
        aiTimeOfDay: plan.timeOfDay,
        aiTimeRange: plan.timeRange,
        selection: request.filters?.time,
        resolution: request.resolutions?.time,
      });

      const conflicts = [
        ...(dateResult.conflict ? [dateResult.conflict] : []),
        ...(timeResult.conflict ? [timeResult.conflict] : []),
      ];

      // Never retrieve or rank candidates while a conflict is unresolved.
      if (dateResult.conflict || timeResult.conflict) {
        return {
          status: 'clarification_required',
          conflicts: [
            ...(dateResult.conflict ? [dateResult.conflict] : []),
            ...(timeResult.conflict ? [timeResult.conflict] : []),
          ],
        };
      }

      const appliedFilters: SearchFilters = {
        ...dateResult.filters,
        includePastEvents: plan.includePastEvents,
        includeFutureEvents: plan.includeFutureEvents,
        timeIntervals: timeResult.intervals,
      };

      const candidates =
          await this.eventsService.searchEventCandidates(appliedFilters);

      if (
          !request.query ||
          !plan.intent?.trim() ||
          candidates.length === 0
      ) {
        return {
          status: 'success',
          events: candidates,
          appliedFilters,
        };
      }

      const rankedIds = await this.ranker.rank(
        request.query,
        plan.intent,
        candidates,
      );

      const candidatesById = new Map(
        candidates.map((event) => [event.id, event]),
      );

      const rankedEvents = rankedIds
        .map((id) => candidatesById.get(id))
        .filter((event) => event !== undefined);

      return {
        status: 'success',
        events: rankedEvents,
        appliedFilters,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException(
          'AI search is temporarily unavailable. Please try again later.',
        );
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        (error.status === 503 || error.status === 504)
      ) {
        throw new ServiceUnavailableException(
          'AI search is temporarily unavailable. Please try again later.',
        );
      }

      throw error;
    }
  }
}
