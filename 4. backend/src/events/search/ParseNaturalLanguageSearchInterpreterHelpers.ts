import { NaturalLanguageSearchPlan } from '../../types/search/natural-language-search.types';
import { parseGeminiJsonResponse } from '../../ai/gemini/gemini-response-helpers';
import { validateNaturalLanguageSearchPlan } from '../../search/natural-language-search';
import { InvalidGeminiSearchPlanError } from './InvalidGeminiSearchPlanError';

export function parseNaturalLanguageSearchPlan(
  response: string,
): NaturalLanguageSearchPlan {
  try {
    const parsed = parseGeminiJsonResponse(
        response,
        'Gemini returned invalid JSON',
    );

    return validateNaturalLanguageSearchPlan(parsed);
  } catch (error: unknown) {
    const reason = error instanceof Error
        ? error.message
        : 'Unknown validation error';

    throw new InvalidGeminiSearchPlanError(
        `Gemini returned an invalid search plan: ${reason}`,
    );
  }
}
