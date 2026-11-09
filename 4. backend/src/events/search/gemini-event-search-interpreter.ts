import { GoogleGenAI } from '@google/genai';
import { NaturalLanguageSearchPlan } from '../../types/search/natural-language-search.types';
import { GEMINI_MODEL } from '../../ai/gemini/constants/gemini.constants';
import { NATURAL_LANGUAGE_SEARCH_SCHEMA } from '../../ai/gemini/gemini-schemas';
import { GeminiClient } from '../../types/ai/gemini/gemini.types';
import { formatTorontoDate } from '../../helpers/shared/DateHelpers';
import { createGeminiClientConfig } from '../../ai/gemini/gemini-client-config';
import { parseNaturalLanguageSearchPlan } from './ParseNaturalLanguageSearchInterpreterHelpers';

export class GeminiEventSearchInterpreter {
  private readonly client: GeminiClient | undefined;

  constructor(
    private readonly apiKey: string,
    client?: GeminiClient,
    private readonly now: () => Date = () => new Date(),
  ) {
    if (apiKey.trim()) {
      this.client = client ?? new GoogleGenAI(createGeminiClientConfig(apiKey));
    } else {
      this.client = client;
    }
  }

  async interpret(request: string): Promise<NaturalLanguageSearchPlan> {
    if (!this.apiKey.trim()) {
      throw new Error('Gemini API key is required');
    }

    if (!request.trim()) {
      throw new Error('Search request must not be empty');
    }

    if (!this.client) {
      throw new Error('Gemini API key is required');
    }

    const response = await this.client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        'ROLE',
        "Interpret the user's event search request as a natural-language search plan.",

        '',

        'INTENT EXTRACTION',
        'Use intent to summarize the semantic event preferences the user expresses.',
        'Do not reduce intent to literal keywords or require exact phrase matches.',
        'For example, "something relaxing outdoors" expresses an intent for calm outdoor activities.',
        'Omit intent when the user expresses no event preference beyond dates.',

        '',

        'DATE INTERPRETATION',
        'For relative-date expressions, return a structured relativeDate object using the schema.',
        'Do not calculate absolute date boundaries for relative-date expressions.',
        'Omit startAfter and startBefore when using relativeDate.',
        'Use TODAY, TOMORROW, or YESTERDAY for those calendar-day expressions.',
        'Use THIS_WEEKEND or NEXT_WEEKEND for weekend expressions.',
        'Use DAYS_FROM_NOW or DAYS_AGO for calendar-day offsets.',
        'Use WEEKDAY with weekday and occurrence THIS, NEXT, or LAST for named weekdays.',
        'Use NEXT_BUSINESS_DAY or PREVIOUS_BUSINESS_DAY for the next or previous business day.',
        'Use BUSINESS_DAYS_FROM_NOW or BUSINESS_DAYS_AGO for business-day offsets.',
        'For explicit absolute dates or date ranges, use startAfter and startBefore as ISO 8601 date strings.',
        'Do not use relativeDate for explicit absolute dates.',
        'Interpret relative dates using the current date and timezone below.',

        '',

        'TIME INTERPRETATION',
        'Interpret all event times in the America/Toronto timezone.',
        'Use timeOfDay for named periods: EARLY_MORNING (05:00–08:00), MORNING (08:00–12:00), AFTERNOON (12:00–17:00), EVENING (17:00–21:00), and NIGHT (21:00–05:00 the following day).',
        'These named periods use start-inclusive and end-exclusive boundaries.',
        'Use timeRange for explicit clock-time constraints, with startTime and endTime formatted as HH:mm.',
        'For requests such as "after 8 PM", use startTime: "20:00". For requests such as "before 10 AM", use endTime: "10:00".',
        'For explicit ranges crossing midnight, such as "between 10 PM and 2 AM", use startTime: "22:00" and endTime: "02:00".',
        'Time ranges use start-inclusive and end-exclusive boundaries; a range crossing midnight wraps into the following day.',
        'Both timeOfDay and timeRange may be returned when the user specifies both; the backend will apply their intersection.',
        'Omit timeOfDay and timeRange when the user expresses no time preference.',

        '',

        'GENERAL RULES',
        'Omit fields the user did not specify or imply.',

        '',

        'OUTPUT CONSTRAINTS',
        'Return only fields supported by the schema.',

        '',

        'CURRENT DATE AND TIMEZONE',
        `Current date: ${formatTorontoDate(this.now())}`,
        'Timezone: America/Toronto.',

        '',

        `USER REQUEST: ${request}`,
      ].join('\n'),
      config: {
        responseMimeType: 'application/json',
        responseSchema: NATURAL_LANGUAGE_SEARCH_SCHEMA,
      },
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response');
    }

    return parseNaturalLanguageSearchPlan(response.text);
  }
}
