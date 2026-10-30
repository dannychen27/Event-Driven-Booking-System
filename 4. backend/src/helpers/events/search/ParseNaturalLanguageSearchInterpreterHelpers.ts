import {NaturalLanguageSearchPlan} from "../../../types/search/natural-language-search.types";
import {parseGeminiJsonResponse} from "./gemini-response-helpers";
import {validateNaturalLanguageSearchPlan} from "../../../search/natural-language-search";

export function parseNaturalLanguageSearchPlan(
    response: string,
): NaturalLanguageSearchPlan {
    const parsed = parseGeminiJsonResponse(
        response,
        'Gemini returned invalid JSON',
    );

    return validateNaturalLanguageSearchPlan(parsed);
}
