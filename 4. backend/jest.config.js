module.exports = {
    rootDir: "..",

    testEnvironment: "node",

    testRegex: "0\\. tests/backend/.*\\.test\\.ts$",

    moduleFileExtensions: ["js", "json", "ts"],

    moduleDirectories: [
        "node_modules",
        "4. backend/node_modules",
    ],

    transform: {
        "^.+\\.(t|j)s$": [
            "<rootDir>/4. backend/node_modules/ts-jest/dist/index.js",
            {
                tsconfig: "<rootDir>/tsconfig.test.json",
            },
        ],
    },
};