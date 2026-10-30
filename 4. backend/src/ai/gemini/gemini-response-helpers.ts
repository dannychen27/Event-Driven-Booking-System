export function parseGeminiJsonResponse(
    response: string,
    errorMessage: string,
): unknown {
    try {
        return JSON.parse(response);
    } catch {
        throw new Error(errorMessage);
    }
}
