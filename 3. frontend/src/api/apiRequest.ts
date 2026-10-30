/**
 * Sends an HTTP request and returns its JSON response.
 * Throws the provided fallback message when the request fails.
 */
export async function apiRequest<T>(
    url: string,
    fallbackErrorMessage: string,
    options?: RequestInit,
): Promise<T> {
    const response = options
        ? await fetch(url, options)
        : await fetch(url);

    if (!response.ok) {
        throw new Error(fallbackErrorMessage);
    }

    return response.json() as Promise<T>;
}
