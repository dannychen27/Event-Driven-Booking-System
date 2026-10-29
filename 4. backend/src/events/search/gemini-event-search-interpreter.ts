import { GoogleGenAI } from '@google/genai';
import { NaturalLanguageSearchPlan } from '../../search/natural-language-search.types';
import {
  GEMINI_MODEL,
  GEMINI_TIMEOUT_MS,
  GEMINI_MAX_RETRY_ATTEMPTS,
} from "../../constants/gemini.constants";
import { validateNaturalLanguageSearchPlan } from '../../search/natural-language-search';
import { NATURAL_LANGUAGE_SEARCH_SCHEMA } from '../../ai/gemini/gemini-schemas';
import { GeminiClient } from "../../ai/gemini/gemini.types";

export function parseNaturalLanguageSearchPlan(
  response: string,
): NaturalLanguageSearchPlan {
  let parsed: unknown;

  try {
    parsed = JSON.parse(response);
  } catch {
    throw new Error('Gemini returned invalid JSON');
  }

  return validateNaturalLanguageSearchPlan(parsed);
}

export class GeminiEventSearchInterpreter {
  private readonly client: GeminiClient | undefined;

  constructor(
    private readonly apiKey: string,
    client?: GeminiClient,
    private readonly now: () => Date = () => new Date(),
  ) {
    if (apiKey.trim()) {
      this.client = client ?? new GoogleGenAI({
        apiKey,
        httpOptions: {
          timeout: GEMINI_TIMEOUT_MS,
          retryOptions: {
            attempts: GEMINI_MAX_RETRY_ATTEMPTS,
          },
        },
      });
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
        `Current date: ${new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Toronto',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(this.now())}`,
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
