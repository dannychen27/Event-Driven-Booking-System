export type GeminiClient = {
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
