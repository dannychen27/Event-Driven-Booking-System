import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: [
            "../0. tests/frontend/**/*.{test,spec}.?(c|m)[jt]s?(x)",
        ],
    },
});
