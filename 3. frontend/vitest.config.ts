import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
    root: projectRoot,

    resolve: {
        alias: {
            react: `${frontendRoot}node_modules/react`,
            "react-dom": `${frontendRoot}node_modules/react-dom`,
            "react-router-dom": `${frontendRoot}node_modules/react-router-dom`,
            "@testing-library/react": `${frontendRoot}node_modules/@testing-library/react`,
            "@testing-library/user-event": `${frontendRoot}node_modules/@testing-library/user-event`,
            "@testing-library/jest-dom": `${frontendRoot}node_modules/@testing-library/jest-dom`,
        },
        dedupe: ["react", "react-dom"],
    },

    test: {
        environment: "jsdom",
        setupFiles: ["./0. tests/frontend/setup.ts"],
        include: [
            "0. tests/frontend/**/*.{test,spec}.?(c|m)[jt]s?(x)",
        ],
    },

    server: {
        fs: {
            allow: [projectRoot],
        },
    },
});

