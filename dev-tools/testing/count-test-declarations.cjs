#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const BACKEND_ROOT = path.join(PROJECT_ROOT, "4. backend");

let ts;

try {
    const typescriptPath = require.resolve("typescript", {
        paths: [BACKEND_ROOT],
    });

    ts = require(typescriptPath);
} catch {
    throw new Error(
        'Unable to load TypeScript. Ensure dependencies are installed in "4. backend" by running npm install.'
    );
}

const TEST_IDENTIFIERS = new Set(["it", "test"]);

const TEST_MODIFIERS = new Set([
    "only",
    "skip",
    "todo",
    "concurrent",
    "failing",
]);

// -----------------------------------------------------------------------------
// AST recognition helpers
// -----------------------------------------------------------------------------

function isTestIdentifier(node) {
    return (
        ts.isIdentifier(node) &&
        TEST_IDENTIFIERS.has(node.text)
    );
}

function isTestReference(node) {
    if (isTestIdentifier(node)) {
        return true;
    }

    if (!ts.isPropertyAccessExpression(node)) {
        return false;
    }

    return (
        TEST_MODIFIERS.has(node.name.text) &&
        isTestReference(node.expression)
    );
}

function isEachFactoryCall(node) {
    if (!ts.isCallExpression(node)) {
        return false;
    }

    const expression = node.expression;

    if (!ts.isPropertyAccessExpression(expression)) {
        return false;
    }

    return (
        expression.name.text === "each" &&
        isTestReference(expression.expression)
    );
}

function isParameterizedTestReference(node) {
    if (isEachFactoryCall(node)) {
        return true;
    }

    if (!ts.isPropertyAccessExpression(node)) {
        return false;
    }

    return (
        TEST_MODIFIERS.has(node.name.text) &&
        isParameterizedTestReference(node.expression)
    );
}

function isTestDeclarationCall(node) {
    if (!ts.isCallExpression(node)) {
        return false;
    }

    return (
        isTestReference(node.expression) ||
        isParameterizedTestReference(node.expression) ||
        isEachFactoryCall(node.expression)
    );
}

// -----------------------------------------------------------------------------
// File parsing helpers
// -----------------------------------------------------------------------------

function isSupportedFile(filePath) {
    return /\.(tsx?|jsx?)$/i.test(filePath);
}

function getScriptKind(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
        case ".ts":
            return ts.ScriptKind.TS;

        case ".tsx":
            return ts.ScriptKind.TSX;

        case ".js":
            return ts.ScriptKind.JS;

        case ".jsx":
            return ts.ScriptKind.JSX;

        default:
            return ts.ScriptKind.Unknown;
    }
}

function formatParseError(filePath, diagnostics) {
    const formattedDiagnostics = diagnostics.map((diagnostic) => {
        const message = ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
        );

        if (!diagnostic.file || diagnostic.start === undefined) {
            return message;
        }

        const position = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start
        );

        return (
            `${position.line + 1}:${position.character + 1} - ${message}`
        );
    });

    return (
        `Unable to parse test file "${filePath}":\n` +
        formattedDiagnostics.map((message) => `  ${message}`).join("\n")
    );
}

function parseSourceFile(filePath) {
    const sourceText = fs.readFileSync(filePath, "utf8");

    const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        getScriptKind(filePath)
    );

    const diagnostics = sourceFile.parseDiagnostics;

    if (diagnostics.length > 0) {
        throw new Error(formatParseError(filePath, diagnostics));
    }

    return sourceFile;
}

// -----------------------------------------------------------------------------
// Declaration counting
// -----------------------------------------------------------------------------

function countTestDeclarations(sourceFile) {
    let count = 0;

    function visit(node) {
        if (isTestDeclarationCall(node)) {
            count += 1;
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return count;
}

function countDeclarations(filePath) {
    if (!isSupportedFile(filePath)) {
        return 0;
    }

    const sourceFile = parseSourceFile(filePath);

    return countTestDeclarations(sourceFile);
}

// -----------------------------------------------------------------------------
// Test-file detection and CLI
// -----------------------------------------------------------------------------

function isTestFile(filePath) {
    return /\.(test|spec|cy)\.[^.]+$/i.test(filePath);
}

function main() {
    const args = process.argv.slice(2);

    // Single-file mode.
    if (args.length === 1) {
        console.log(countDeclarations(args[0]));
        return;
    }

    if (args.length > 0) {
        throw new Error(
            "Usage: count-test-declarations.cjs [file] " +
            "(bulk mode reads NUL-delimited paths from stdin)"
        );
    }

    // Bulk mode: read NUL-delimited file paths from stdin.
    const input = fs.readFileSync(0, "utf8");

    const filePaths = input
        .split("\0")
        .filter(Boolean);

    for (const filePath of filePaths) {
        if (!isTestFile(filePath)) {
            continue;
        }

        const count = countDeclarations(filePath);

        process.stdout.write(`${count}\0${filePath}\0`);
    }
}

try {
    main();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
