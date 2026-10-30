const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TESTS_ROOT = path.join(ROOT, '0. tests');
const APPLY = process.argv.includes('--apply');

const ts = require(
    path.join(ROOT, '4. backend/node_modules/typescript'),
);

if (!fs.existsSync(TESTS_ROOT)) {
    console.error("Error: Could not find '0. tests'.");
    process.exit(1);
}

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

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

const allTestFiles = walk(TESTS_ROOT);
const fixtureFiles = allTestFiles.filter((file) => {
    const relative = path.relative(TESTS_ROOT, file);
    return relative.split(path.sep).includes('fixtures') &&
        /\.(ts|tsx)$/.test(file);
});

function resolveLocalImport(importer, specifier) {
    const base = path.resolve(path.dirname(importer), specifier);
    const candidates = [
        base,
        ...extensions.map((extension) => base + extension),
        ...extensions.map((extension) =>
            path.join(base, 'index' + extension),
        ),
    ];

    return candidates.find((candidate) =>
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isFile(),
    );
}

function findMatchingTargets(specifier) {
    const basename = path.basename(specifier);

    return allTestFiles.filter((file) => {
        const name = path.basename(file);
        return name === basename ||
            extensions.some((extension) =>
                name === basename + extension,
            );
    });
}

function relativeSpecifier(importer, target) {
    let result = path.relative(path.dirname(importer), target);
    result = result.split(path.sep).join('/');

    if (!result.startsWith('.')) {
        result = './' + result;
    }

    return result.replace(/\.(tsx?|jsx?)$/, '');
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

        visitChildren(node);
    }

    function visitChildren(node) {
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return results;
}

let checked = 0;
let repaired = 0;
let unresolved = 0;
let ambiguous = 0;
const changes = [];

console.log('===== TEST FIXTURE IMPORT CHECK =====');
console.log(`Mode: ${APPLY ? 'APPLY CHANGES' : 'DRY RUN'}`);
console.log(`Fixture files found: ${fixtureFiles.length}`);

for (const file of fixtureFiles) {
    let source = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
    );

    const imports = collectModuleSpecifiers(sourceFile);
    let updatedSource = source;

    for (const item of imports) {
        if (!item.specifier.startsWith('.')) continue;

        checked++;

        const resolved = resolveLocalImport(file, item.specifier);

        if (resolved && path.resolve(resolved) !== path.resolve(file)) {
            continue;
        }

        const targets = findMatchingTargets(item.specifier)
            .filter((target) =>
                path.resolve(target) !== path.resolve(file),
            );

        if (targets.length === 1) {
            const target = targets[0];
            const corrected = relativeSpecifier(file, target);

            const start = item.node.getStart(sourceFile) + 1;
            const end = item.node.getEnd() - 1;

            updatedSource =
                updatedSource.slice(0, start) +
                corrected +
                updatedSource.slice(end);

            changes.push({
                file: path.relative(ROOT, file),
                oldPath: item.specifier,
                newPath: corrected,
            });

            repaired++;
        } else if (targets.length > 1) {
            ambiguous++;
            console.log(
                `AMBIGUOUS: ${path.relative(ROOT, file)}\n` +
                `  Import: ${item.specifier}\n` +
                `  Candidates:\n` +
                targets.map((target) =>
                    `    ${path.relative(ROOT, target)}`,
                ).join('\n'),
            );
        } else {
            unresolved++;
            console.log(
                `UNRESOLVED: ${path.relative(ROOT, file)}\n` +
                `  Import: ${item.specifier}`,
            );
        }
    }

    if (updatedSource !== source && APPLY) {
        fs.writeFileSync(file, updatedSource);
    }
}

console.log('\n===== SUMMARY =====');
console.log(`Relative imports checked: ${checked}`);
console.log(`Potential repairs: ${repaired}`);
console.log(`Ambiguous imports: ${ambiguous}`);
console.log(`Unresolved imports: ${unresolved}`);

if (changes.length) {
    console.log('\n===== PROPOSED CHANGES =====');

    for (const change of changes) {
        console.log(`\n${change.file}`);
        console.log(`  ${change.oldPath}`);
        console.log(`  -> ${change.newPath}`);
    }
}

if (!APPLY && repaired > 0) {
    console.log(
        '\nDry run only. Review the proposed changes, then run with --apply.',
    );
} else if (APPLY) {
    console.log('\nChanges applied. Review the Git diff and run tests.');
} else {
    console.log('\nNo unambiguous import repairs were needed.');
}
