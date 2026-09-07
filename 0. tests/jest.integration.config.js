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

    testRegex: "0\\. tests/integration/.*\\.integration\\.test\\.ts$",

    moduleFileExtensions: ["js", "json", "ts"],

    moduleDirectories: [
        "node_modules",
        "4. backend/node_modules",
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

