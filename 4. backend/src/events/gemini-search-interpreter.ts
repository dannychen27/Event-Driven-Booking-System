
import { GoogleGenAI } from "@google/genai";
import { SearchFilters, validateSearchFilters, } from "./natural-language-search";

type GeminiClient = {
    models: {
        generateContent: (args: {
            model: string;
            contents: string;
            config: {
                responseMimeType: string;
                responseSchema: object;
            };
        }) => Promise<{ text?: string }>;
    };
};

const SEARCH_FILTER_SCHEMA = {
    type: "OBJECT",
    properties: {
        keyword: { type: "STRING" },
        startAfter: { type: "STRING" },
        startBefore: { type: "STRING" },
    },
    propertyOrdering: ["keyword", "startAfter", "startBefore"],
};

export function parseSearchFilters(response: string): SearchFilters {
    let parsed: unknown;

    try {
        parsed = JSON.parse(response);
    } catch {
        throw new Error("Gemini returned invalid JSON");
    }

    return validateSearchFilters(parsed);
}

export class GeminiSearchInterpreter {
    private readonly client: GeminiClient | undefined;

    constructor(
        private readonly apiKey: string,
        client?: GeminiClient,
    ) {
        if (apiKey.trim()) {
            this.client = client ?? (new GoogleGenAI({ apiKey }) as unknown as GeminiClient);
        } else {
            this.client = client;
        }
    }

    async interpret(request: string): Promise<SearchFilters> {
        if (!this.apiKey.trim()) {
            throw new Error("Gemini API key is required");
        }

        if (!request.trim()) {
            throw new Error("Search request must not be empty");
        }

        if (!this.client) {
            throw new Error("Gemini API key is required");
        }

        const response = await this.client.models.generateContent({
            model: "gemini-flash-latest",
            contents: [
                "Translate the user's event search request into filters.",
                "Return only filters supported by the schema.",
                "Allowed fields: keyword, startAfter, startBefore.",
                "Use ISO 8601 date strings for date boundaries.",
                "Omit fields the user did not specify or imply.",
                `User request: ${request}`,
            ].join("\n"),
            config: {
                responseMimeType: "application/json",
                responseSchema: SEARCH_FILTER_SCHEMA,
            },
        });

        if (!response.text) {
            throw new Error("Gemini returned an empty response");
        }

        return parseSearchFilters(response.text);
    }
}
