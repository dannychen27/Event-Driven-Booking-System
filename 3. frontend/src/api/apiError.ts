export async function getApiErrorMessage(
    response: Response,
    fallbackMessage: string,
): Promise<string> {
    const body = await response.json().catch(() => null);

    return body?.message ?? fallbackMessage;
}
