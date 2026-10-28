export async function getApiErrorMessage(
    response: Response,
    fallbackMessage: string,
): Promise<string> {
    const body: unknown = await response.json().catch(() => null);

    if (
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string" &&
        body.message.trim().length > 0
    ) {
        return body.message;
    }

    return fallbackMessage;
}
