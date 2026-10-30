
/**
 * AI Disclosure:
 * This script was written with the assistance of AI.
 * The author provided the requirements and used AI-generated code
 * as the basis for this implementation.
 *
 * The author reviewed the implementation and validated its behavior
 * using the built-in regression tests.
 *
 * The script is intended to repair broken relative imports to test
 * fixture files. Review and validate its behavior before use.
 */

/**
 * Usage:
 *
 * # Inspect imports (dry run)
 * node dev-tools/fixtures/fix-test-fixture-imports.js
 *
 * # Apply repairs
 * node dev-tools/fixtures/fix-test-fixture-imports.js --apply
 *
 * # Run regression tests
 * node dev-tools/fixtures/fix-test-fixture-imports.js --self-test
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// Configuration
// =============================================================================

const ROOT = process.cwd();
const TESTS_ROOT = path.join(ROOT, '0. tests');

const APPLY = process.argv.includes('--apply');
const SELF_TEST = process.argv.includes('--self-test');

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const RESOLUTION_EXTENSIONS = [
    ...SOURCE_EXTENSIONS,
    '.json',
];

const ts = require(
    path.join(ROOT, '4. backend/node_modules/typescript'),
);

// =============================================================================
// File discovery
// =============================================================================

function walk(directory) {
    if (!fs.existsSync(directory)) return [];

    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return walk(fullPath);
            }

            return [fullPath];
        });
}

function isSourceFile(file) {
    return SOURCE_EXTENSIONS.includes(path.extname(file));
}

function isFixtureFile(file, testsRoot = TESTS_ROOT) {
    const relative = path.relative(testsRoot, file);

    return relative.split(path.sep).includes('fixtures') &&
        /\.(ts|tsx)$/.test(file);
}

function getTestFiles(testsRoot = TESTS_ROOT) {
    return walk(testsRoot).filter(isSourceFile);
}

function getFixtureFiles(testsRoot = TESTS_ROOT) {
    return walk(testsRoot).filter(
        (file) => isFixtureFile(file, testsRoot),
    );
}

function getRelativePath(file) {
    return path.relative(ROOT, file);
}

// =============================================================================
// TypeScript parsing
// =============================================================================

function createSourceFile(file, source) {
    const extension = path.extname(file);

    const scriptKind = {
        '.ts': ts.ScriptKind.TS,
        '.tsx': ts.ScriptKind.TSX,
        '.js': ts.ScriptKind.JS,
        '.jsx': ts.ScriptKind.JSX,
    }[extension];

    return ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        scriptKind,
    );
}

function getParseDiagnostics(sourceFile) {
    return sourceFile.parseDiagnostics.map((diagnostic) => {
        const position =
            diagnostic.file &&
            diagnostic.start !== undefined
                ? diagnostic.file.getLineAndCharacterOfPosition(
                    diagnostic.start,
                )
                : null;

        return {
            message: ts.flattenDiagnosticMessageText(
                diagnostic.messageText,
                '\n',
            ),
            line: position ? position.line + 1 : null,
            column: position ? position.character + 1 : null,
        };
    });
}

function collectModuleSpecifiers(sourceFile) {
    const results = [];

    function visit(node) {
        if (
            (ts.isImportDeclaration(node) ||
                ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteral(node.moduleSpecifier)
        ) {
            results.push({
                node: node.moduleSpecifier,
                specifier: node.moduleSpecifier.text,
            });
        }

        if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            node.arguments.length === 1 &&
            ts.isStringLiteral(node.arguments[0])
        ) {
            results.push({
                node: node.arguments[0],
                specifier: node.arguments[0].text,
            });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return results;
}

// =============================================================================
// Import resolution and fixture matching
// =============================================================================

function resolveLocalImport(importer, specifier) {
    const base = path.resolve(
        path.dirname(importer),
        specifier,
    );

    const candidates = [
        base,
        ...RESOLUTION_EXTENSIONS.map(
            (extension) => base + extension,
        ),
        ...RESOLUTION_EXTENSIONS.map(
            (extension) => path.join(base, 'index' + extension),
        ),
    ];

    return candidates.find((candidate) =>
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isFile(),
    );
}

function findMatchingFixtures(specifier, fixtureFiles) {
    const basename = path.basename(specifier);
    const hasExtension = path.extname(basename) !== '';

    return fixtureFiles.filter((file) => {
        const name = path.basename(file);

        if (hasExtension) {
            return name === basename;
        }

        return SOURCE_EXTENSIONS.some(
            (extension) => name === basename + extension,
        );
    });
}

function relativeSpecifier(importer, target) {
    let result = path.relative(
        path.dirname(importer),
        target,
    );

    result = result.split(path.sep).join('/');

    if (!result.startsWith('.')) {
        result = './' + result;
    }

    return result.replace(/\.(tsx?|jsx?)$/, '');
}

// =============================================================================
// Import inspection
// =============================================================================

function createReplacement(item, sourceFile, importer, target) {
    return {
        start: item.node.getStart(sourceFile) + 1,
        end: item.node.getEnd() - 1,
        expected: item.specifier,
        value: relativeSpecifier(importer, target),
    };
}

function inspectImport(item, sourceFile, importer, fixtureFiles) {
    const { specifier } = item;

    if (!specifier.startsWith('.')) {
        return { status: 'skipped' };
    }

    const resolved = resolveLocalImport(importer, specifier);

    if (
        resolved &&
        path.resolve(resolved) !== path.resolve(importer)
    ) {
        return { status: 'valid' };
    }

    const targets = findMatchingFixtures(
        specifier,
        fixtureFiles,
    ).filter((target) =>
        path.resolve(target) !== path.resolve(importer),
    );

    if (targets.length > 1) {
        return {
            status: 'ambiguous',
            specifier,
            targets,
        };
    }

    if (targets.length === 0) {
        return {
            status: 'unresolved',
            specifier,
        };
    }

    const replacement = createReplacement(
        item,
        sourceFile,
        importer,
        targets[0],
    );

    if (replacement.value === specifier) {
        return { status: 'valid' };
    }

    return {
        status: 'repair',
        specifier,
        replacement,
    };
}

function createFileResult(file, source) {
    return {
        file,
        source,
        replacements: [],
        valid: 0,
        checked: 0,
        ambiguous: [],
        unresolved: [],
        parseErrors: [],
    };
}

function inspectFile(file, fixtureFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const sourceFile = createSourceFile(file, source);
    const result = createFileResult(file, source);

    result.parseErrors = getParseDiagnostics(sourceFile);

    if (result.parseErrors.length > 0) {
        return result;
    }

    const imports = collectModuleSpecifiers(sourceFile);

    for (const item of imports) {
        if (!item.specifier.startsWith('.')) continue;

        result.checked++;

        const inspection = inspectImport(
            item,
            sourceFile,
            file,
            fixtureFiles,
        );

        switch (inspection.status) {
            case 'valid':
                result.valid++;
                break;

            case 'repair':
                result.replacements.push(inspection.replacement);
                break;

            case 'ambiguous':
                result.ambiguous.push(inspection);
                break;

            case 'unresolved':
                result.unresolved.push(inspection);
                break;
        }
    }

    return result;
}

function inspectFiles(testFiles, fixtureFiles) {
    return testFiles.map((file) =>
        inspectFile(file, fixtureFiles),
    );
}

// =============================================================================
// Replacement validation and application
// =============================================================================

function validateReplacementRanges(source, replacements) {
    const sorted = [...replacements].sort(
        (a, b) => a.start - b.start,
    );

    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];

        if (
            !Number.isInteger(current.start) ||
            !Number.isInteger(current.end) ||
            current.start < 0 ||
            current.end < current.start ||
            current.end > source.length
        ) {
            throw new Error('Invalid replacement range.');
        }

        const actual = source.slice(
            current.start,
            current.end,
        );

        if (actual !== current.expected) {
            throw new Error(
                `Replacement source mismatch: expected "${current.expected}", found "${actual}".`,
            );
        }

        if (
            i > 0 &&
            sorted[i - 1].end > current.start
        ) {
            throw new Error(
                'Overlapping replacement ranges detected.',
            );
        }
    }
}

function verifyReplacements(updatedSource, replacements, file) {
    const sourceFile = createSourceFile(file, updatedSource);
    const parseErrors = getParseDiagnostics(sourceFile);

    if (parseErrors.length > 0) {
        throw new Error(
            `Updated file failed parsing: ${parseErrors[0].message}`,
        );
    }

    const actualSpecifiers = collectModuleSpecifiers(sourceFile)
        .map((item) => item.specifier);

    const requiredCounts = new Map();

    for (const replacement of replacements) {
        requiredCounts.set(
            replacement.value,
            (requiredCounts.get(replacement.value) ?? 0) + 1,
        );
    }

    const actualCounts = new Map();

    for (const specifier of actualSpecifiers) {
        actualCounts.set(
            specifier,
            (actualCounts.get(specifier) ?? 0) + 1,
        );
    }

    for (const [specifier, requiredCount] of requiredCounts) {
        if (
            (actualCounts.get(specifier) ?? 0) < requiredCount
        ) {
            throw new Error(
                `Replacement verification failed for "${specifier}".`,
            );
        }
    }
}

function applyReplacements(source, replacements, file) {
    validateReplacementRanges(source, replacements);

    const sorted = [...replacements].sort(
        (a, b) => b.start - a.start,
    );

    let updatedSource = source;

    for (const replacement of sorted) {
        updatedSource =
            updatedSource.slice(0, replacement.start) +
            replacement.value +
            updatedSource.slice(replacement.end);
    }

    verifyReplacements(updatedSource, replacements, file);

    return updatedSource;
}

function prepareRepairs(results) {
    return results
        .filter((result) => result.replacements.length > 0)
        .map((result) => ({
            file: result.file,
            originalSource: result.source,
            updatedSource: applyReplacements(
                result.source,
                result.replacements,
                result.file,
            ),
        }));
}

function writeRepairs(repairs) {
    for (const repair of repairs) {
        fs.writeFileSync(repair.file, repair.updatedSource);
    }
}

// =============================================================================
// Reporting
// =============================================================================

function printFileCounts(testFiles, fixtureFiles) {
    console.log(`Test source files found: ${testFiles.length}`);
    console.log(`Fixture files found: ${fixtureFiles.length}`);
}

function printAmbiguousImports(results) {
    for (const result of results) {
        for (const item of result.ambiguous) {
            console.log(
                `\nAMBIGUOUS: ${getRelativePath(result.file)}\n` +
                `  Import: ${item.specifier}\n` +
                `  Candidates:\n` +
                item.targets.map((target) =>
                    `    ${getRelativePath(target)}`,
                ).join('\n'),
            );
        }
    }
}

function printUnresolvedImports(results) {
    for (const result of results) {
        for (const item of result.unresolved) {
            console.log(
                `\nNO FIXTURE MATCH: ${getRelativePath(result.file)}\n` +
                `  Import: ${item.specifier}`,
            );
        }
    }
}

function printParseErrors(results) {
    for (const result of results) {
        for (const error of result.parseErrors) {
            const location = error.line
                ? `:${error.line}:${error.column}`
                : '';

            console.log(
                `\nPARSE ERROR: ${getRelativePath(result.file)}${location}\n` +
                `  ${error.message}`,
            );
        }
    }
}

function printProposedChanges(results) {
    for (const result of results) {
        for (const replacement of result.replacements) {
            console.log(`\n${getRelativePath(result.file)}`);
            console.log(`  ${replacement.expected}`);
            console.log(`  -> ${replacement.value}`);
        }
    }
}

function calculateSummary(results) {
    return results.reduce(
        (summary, result) => ({
            checked: summary.checked + result.checked,
            valid: summary.valid + result.valid,
            repairs: summary.repairs + result.replacements.length,
            ambiguous: summary.ambiguous + result.ambiguous.length,
            unresolved: summary.unresolved + result.unresolved.length,
            parseErrors: summary.parseErrors + result.parseErrors.length,
            filesWithParseErrors:
                summary.filesWithParseErrors +
                (result.parseErrors.length > 0 ? 1 : 0),
        }),
        {
            checked: 0,
            valid: 0,
            repairs: 0,
            ambiguous: 0,
            unresolved: 0,
            parseErrors: 0,
            filesWithParseErrors: 0,
        },
    );
}

function printSummary(results) {
    const totals = calculateSummary(results);

    console.log('\n===== SUMMARY =====');
    console.log(`Test source files scanned: ${results.length}`);
    console.log(`Relative imports checked: ${totals.checked}`);
    console.log(`Already valid imports: ${totals.valid}`);
    console.log(`Potential repairs: ${totals.repairs}`);
    console.log(`Ambiguous imports: ${totals.ambiguous}`);
    console.log(`Imports without fixture matches: ${totals.unresolved}`);
    console.log(`Files with parse errors: ${totals.filesWithParseErrors}`);
    console.log(`Total parse errors: ${totals.parseErrors}`);

    return totals;
}

function isApplyBlocked(totals) {
    return totals.ambiguous > 0 || totals.parseErrors > 0;
}

function printFinalStatus(totals, blocked) {
    if (blocked) {
        console.error(
            '\nApply blocked: resolve ambiguous imports and parse errors first.',
        );
    } else if (APPLY && totals.repairs > 0) {
        console.log(
            '\nChanges applied. Review the Git diff and run tests.',
        );
    } else if (!APPLY && totals.repairs > 0) {
        console.log(
            '\nDry run only. Review the proposed changes, then run with --apply.',
        );
    } else {
        console.log(
            '\nNo unambiguous fixture import repairs were found.',
        );
    }
}

// =============================================================================
// Self-test helpers
// =============================================================================

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            `${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`,
        );
    }
}

function writeTestFile(file, content = '') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

function runSelfTest(name, testFunction) {
    try {
        testFunction();
        console.log(`PASS: ${name}`);
        return true;
    } catch (error) {
        console.error(`FAIL: ${name}`);
        console.error(`  ${error.message}`);
        return false;
    }
}

function runSelfTests() {
    console.log('===== FIXTURE IMPORT REPAIR SELF-TESTS =====');

    if (!fs.existsSync(TESTS_ROOT)) {
        console.error("Error: Could not find '0. tests'.");
        process.exitCode = 1;
        return;
    }

    const temporaryRoot = fs.mkdtempSync(
        path.join(TESTS_ROOT, '.fixture-import-self-test-'),
    );

    let passed = 0;
    let failed = 0;

    function test(name, testFunction) {
        if (runSelfTest(name, testFunction)) {
            passed++;
        } else {
            failed++;
        }
    }

    try {
        // ---------------------------------------------------------------------
        // Test 1: Multiple repairs with different replacement lengths
        // ---------------------------------------------------------------------

        const fixtureRoot = path.join(temporaryRoot, 'fixtures');

        const alphaFixture = path.join(
            fixtureRoot,
            'alpha.ts',
        );

        const longerFixture = path.join(
            fixtureRoot,
            'longerFixtureName.ts',
        );

        const validFixture = path.join(
            fixtureRoot,
            'validFixture.ts',
        );

        const repairSource = path.join(
            temporaryRoot,
            'repair.test.ts',
        );

        writeTestFile(alphaFixture);
        writeTestFile(longerFixture);
        writeTestFile(validFixture);

        const originalRepairSource = [
            "import { alpha } from './missing/alpha';",
            "import { longer } from './missing/deeply/nested/longerFixtureName';",
            "import { valid } from './fixtures/validFixture';",
            '',
        ].join('\n');

        writeTestFile(repairSource, originalRepairSource);

        test(
            'Detects two broken imports and preserves an existing valid import',
            () => {
                const fixtureFiles = [
                    alphaFixture,
                    longerFixture,
                    validFixture,
                ];

                const result = inspectFile(
                    repairSource,
                    fixtureFiles,
                );

                assertEqual(
                    result.checked,
                    3,
                    'Expected three relative imports to be checked.',
                );

                assertEqual(
                    result.replacements.length,
                    2,
                    'Expected two proposed repairs.',
                );

                assertEqual(
                    result.valid,
                    1,
                    'Expected one already-valid import.',
                );

                assertEqual(
                    result.ambiguous.length,
                    0,
                    'Did not expect ambiguous imports.',
                );

                assertEqual(
                    result.unresolved.length,
                    0,
                    'Did not expect unresolved imports.',
                );
            },
        );

        test(
            'Applies multiple replacements safely when replacement lengths differ',
            () => {
                const fixtureFiles = [
                    alphaFixture,
                    longerFixture,
                    validFixture,
                ];

                const results = inspectFiles(
                    [repairSource],
                    fixtureFiles,
                );

                const repairs = prepareRepairs(results);

                assertEqual(
                    repairs.length,
                    1,
                    'Expected one file to be prepared for repair.',
                );

                writeRepairs(repairs);

                const updatedSource = fs.readFileSync(
                    repairSource,
                    'utf8',
                );

                const expectedSource = [
                    "import { alpha } from './fixtures/alpha';",
                    "import { longer } from './fixtures/longerFixtureName';",
                    "import { valid } from './fixtures/validFixture';",
                    '',
                ].join('\n');

                assertEqual(
                    updatedSource,
                    expectedSource,
                    'Updated source did not match the expected imports.',
                );
            },
        );

        // ---------------------------------------------------------------------
        // Test 2: Ambiguous and unresolved imports
        // ---------------------------------------------------------------------

        const duplicateFixtureOne = path.join(
            fixtureRoot,
            'ambiguous-one',
            'duplicateFixture.ts',
        );

        const duplicateFixtureTwo = path.join(
            fixtureRoot,
            'ambiguous-two',
            'duplicateFixture.ts',
        );

        const ambiguousSource = path.join(
            temporaryRoot,
            'ambiguous.test.ts',
        );

        const originalAmbiguousSource = [
            "import { duplicate } from './missing/duplicateFixture';",
            "import { missing } from './missing/noSuchFixture';",
            '',
        ].join('\n');

        writeTestFile(duplicateFixtureOne);
        writeTestFile(duplicateFixtureTwo);
        writeTestFile(ambiguousSource, originalAmbiguousSource);

        let ambiguousResults;

        test(
            'Detects ambiguous fixture matches and unresolved imports',
            () => {
                const fixtureFiles = [
                    alphaFixture,
                    longerFixture,
                    validFixture,
                    duplicateFixtureOne,
                    duplicateFixtureTwo,
                ];

                ambiguousResults = inspectFiles(
                    [ambiguousSource],
                    fixtureFiles,
                );

                const totals = calculateSummary(ambiguousResults);

                assertEqual(
                    totals.ambiguous,
                    1,
                    'Expected one ambiguous import.',
                );

                assertEqual(
                    totals.unresolved,
                    1,
                    'Expected one unresolved import.',
                );

                assertEqual(
                    totals.repairs,
                    0,
                    'Did not expect any proposed repairs.',
                );
            },
        );

        test(
            'Blocks apply when ambiguous imports are present',
            () => {
                assert(
                    ambiguousResults,
                    'Ambiguous inspection results were not available.',
                );

                const totals = calculateSummary(ambiguousResults);

                assert(
                    isApplyBlocked(totals),
                    'Apply should be blocked when ambiguous imports exist.',
                );

                // Use the same blocking condition as normal --apply execution.
                if (!isApplyBlocked(totals)) {
                    writeRepairs(prepareRepairs(ambiguousResults));
                }

                const actualSource = fs.readFileSync(
                    ambiguousSource,
                    'utf8',
                );

                assertEqual(
                    actualSource,
                    originalAmbiguousSource,
                    'The ambiguous source file was unexpectedly modified.',
                );
            },
        );

        test(
            'Leaves the original ambiguous and unresolved imports unchanged',
            () => {
                const actualSource = fs.readFileSync(
                    ambiguousSource,
                    'utf8',
                );

                assert(
                    actualSource.includes(
                        "from './missing/duplicateFixture'",
                    ),
                    'The ambiguous import was unexpectedly changed.',
                );

                assert(
                    actualSource.includes(
                        "from './missing/noSuchFixture'",
                    ),
                    'The unresolved import was unexpectedly changed.',
                );
            },
        );
    } finally {
        fs.rmSync(temporaryRoot, {
            recursive: true,
            force: true,
        });
    }

    console.log('\n===== SELF-TEST SUMMARY =====');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('Temporary test files cleaned up.');

    if (failed > 0) {
        console.error('\nSelf-tests failed.');
        process.exitCode = 1;
    } else {
        console.log('\nAll fixture import repair self-tests passed.');
    }
}

// =============================================================================
// Main execution
// =============================================================================

function main() {
    if (!fs.existsSync(TESTS_ROOT)) {
        console.error("Error: Could not find '0. tests'.");
        process.exitCode = 1;
        return;
    }

    const testFiles = getTestFiles();
    const fixtureFiles = getFixtureFiles();

    console.log('===== TEST FIXTURE IMPORT CHECK =====');
    console.log(`Mode: ${APPLY ? 'APPLY CHANGES' : 'DRY RUN'}`);
    printFileCounts(testFiles, fixtureFiles);

    const results = inspectFiles(testFiles, fixtureFiles);

    printAmbiguousImports(results);
    printUnresolvedImports(results);
    printParseErrors(results);

    const totals = printSummary(results);

    if (totals.repairs > 0) {
        console.log('\n===== PROPOSED CHANGES =====');
        printProposedChanges(results);
    }

    const blocked = isApplyBlocked(totals);

    if (APPLY && blocked) {
        printFinalStatus(totals, true);
        process.exitCode = 1;
        return;
    }

    // Prepare and validate every updated file before writing any of them.
    let repairs = [];

    try {
        repairs = prepareRepairs(results);
    } catch (error) {
        console.error(`\nREPAIR VALIDATION FAILED: ${error.message}`);
        process.exitCode = 1;
        return;
    }

    if (APPLY && repairs.length > 0) {
        try {
            writeRepairs(repairs);
        } catch (error) {
            console.error(`\nFILE WRITE FAILED: ${error.message}`);
            process.exitCode = 1;
            return;
        }
    }

    printFinalStatus(totals, false);
}

// =============================================================================
// Entry point
// =============================================================================

if (SELF_TEST && APPLY) {
    console.error(
        'Error: Use either --self-test or --apply, not both.',
    );
    process.exitCode = 1;
} else if (SELF_TEST) {
    runSelfTests();
} else {
    main();
}
