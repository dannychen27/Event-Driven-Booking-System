import {
    GEMINI_TIMEOUT_MS,
    GEMINI_MAX_RETRY_ATTEMPTS,
} from './constants/gemini.constants';

export function createGeminiClientConfig(apiKey: string) {
    return {
        apiKey,
        httpOptions: {
            timeout: GEMINI_TIMEOUT_MS,
            retryOptions: {
                attempts: GEMINI_MAX_RETRY_ATTEMPTS,
            },
        },
    };
}
