export const geminiClientConfigFixture = (apiKey: string) => ({
    apiKey,
    httpOptions: {
        timeout: 20_000,
        retryOptions: {
            attempts: 2,
        },
    },
});
