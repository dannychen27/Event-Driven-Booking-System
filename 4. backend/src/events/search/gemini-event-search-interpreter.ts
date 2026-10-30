import { GoogleGenAI } from '@google/genai';
import { NaturalLanguageSearchPlan } from '../../types/search/natural-language-search.types';
import { GEMINI_MODEL } from "../../ai/gemini/constants/gemini.constants";
import { NATURAL_LANGUAGE_SEARCH_SCHEMA } from '../../ai/gemini/gemini-schemas';
import { GeminiClient } from "../../types/ai/gemini/gemini.types";
import { formatTorontoDate } from "../../helpers/shared/DateHelpers";
import { createGeminiClientConfig } from '../../ai/gemini/gemini-client-config';
import { parseNaturalLanguageSearchPlan } from "./ParseNaturalLanguageSearchInterpreterHelpers";


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
        "Interpret the user's event search request as a natural-language search plan.",
        'Return only fields supported by the schema.',
        'Use intent to summarize the semantic event preferences the user expresses.',
        'Do not reduce intent to literal keywords or require exact phrase matches.',
        'For example, "something relaxing outdoors" expresses an intent for calm outdoor activities.',
        'Omit intent when the user expresses no event preference beyond dates.',
        'Use startAfter and startBefore for date boundaries implied by the request.',
        'Use ISO 8601 date strings for date boundaries.',
        'Omit fields the user did not specify or imply.',
        'Interpret relative dates using the current date and timezone below.',
        `Current date: ${formatTorontoDate(this.now())}`,
        'Timezone: America/Toronto.',
        `User request: ${request}`,
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
