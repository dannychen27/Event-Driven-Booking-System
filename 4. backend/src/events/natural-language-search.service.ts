import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EventsService } from './events.service';
import {
  SearchFilters,
  validateSearchFilters,
} from './natural-language-search';
import { GeminiSearchInterpreter } from './gemini-search-interpreter';
import { GeminiEventRanker } from './gemini-event-ranker';

@Injectable()
export class NaturalLanguageSearchService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly interpreter: GeminiSearchInterpreter,
    private readonly ranker: GeminiEventRanker,
  ) {}

  async search(input: unknown) {
    const filters: SearchFilters = validateSearchFilters(input);
    return this.eventsService.searchEvents(filters);
  }

  async searchNaturalLanguage(request: string) {
    try {
      const plan = await this.interpreter.interpret(request);

      const candidates = await this.eventsService.searchEventCandidates({
        startAfter: plan.startAfter,
        startBefore: plan.startBefore,
      });

      if (!plan.intent?.trim() || candidates.length === 0) {
        return candidates;
      }

      const rankedIds = await this.ranker.rank(
        request,
        plan.intent,
        candidates,
      );

      const candidatesById = new Map(
        candidates.map((event) => [event.id, event]),
      );

      return rankedIds
        .map((id) => candidatesById.get(id))
        .filter((event) => event !== undefined);
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
