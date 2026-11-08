const path = require("path");

const tsJestPath = require.resolve(
    "ts-jest",
    {
        paths: [
            path.resolve("4. backend"),
        ],
    },
);

module.exports = {
    rootDir: "..",

    testEnvironment: "node",

    maxWorkers: 1,

    testRegex: "0\\. tests/integration/.*\\.integration\\.test\\.ts$",

    moduleFileExtensions: ["js", "json", "ts"],

    moduleDirectories: [
        "node_modules",
        "4. backend/node_modules",
    ],

    setupFiles: [
        require.resolve(
            "dotenv/config",
            {
                paths: [
                    path.resolve("4. backend"),
                ],
            },
        ),
    ],

    transform: {
        "^.+\\.(t|j)s$": [
            tsJestPath,
            {
                tsconfig: "tsconfig.test.json",
            },
        ],
    },
};

