import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EventsService } from './events.service';
import {
  SearchFilters,
  validateSearchFilters,
} from './natural-language-search';
import { GeminiSearchInterpreter } from './gemini-search-interpreter';

@Injectable()
export class NaturalLanguageSearchService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly interpreter: GeminiSearchInterpreter,
  ) {}

  async search(input: unknown) {
    const filters = validateSearchFilters(input);
    return this.eventsService.searchEvents(filters);
  }

  async searchNaturalLanguage(request: string) {
    let filters: SearchFilters;

    try {
      filters = await this.interpreter.interpret(request);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 503
      ) {
        throw new ServiceUnavailableException(
          'AI search is temporarily unavailable. Please try again later.',
        );
      }

      throw error;
    }

    return this.eventsService.searchEvents(filters);
  }
}
