import {
    GEMINI_TIMEOUT_MS,
    GEMINI_MAX_RETRY_ATTEMPTS,
} from '../../../../4. backend/src/ai/gemini/constants/gemini.constants';

export const geminiClientConfigFixture = (apiKey: string) => ({
    apiKey,
    httpOptions: {
        timeout: GEMINI_TIMEOUT_MS,
        retryOptions: {
            attempts: GEMINI_MAX_RETRY_ATTEMPTS,
        },
    },
});
