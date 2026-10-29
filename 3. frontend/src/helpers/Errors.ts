// Converts an unknown error into a user-facing message.
export function getErrorMessage(
    error: unknown,
    fallback: string
): string {
    return error instanceof Error ? error.message : fallback;
}
