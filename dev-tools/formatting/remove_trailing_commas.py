#!/usr/bin/env python3

"""
AI Disclosure:
This script was written with the assistance of AI.
The author provided the requirements and used AI-generated code
as the basis for this implementation.

Syntax-aware trailing-comma removal for JavaScript and TypeScript files.

Default behavior is a dry run. Use --apply to write changes.
Use --self-test to run the built-in regression tests.
"""

import argparse
import difflib
import json
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = Path(__file__).resolve()

SUPPORTED_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx",
    ".mjs", ".cjs", ".mts", ".cts",
}

TYPESCRIPT_MODULES = [
    ROOT / "4. backend" / "node_modules" / "typescript",
    ROOT / "3. frontend" / "node_modules" / "typescript",
]

NODE_HELPER = r"""
const fs = require("fs");
const ts = require(process.argv[1]);

const fileName = process.argv[2];
const source = fs.readFileSync(0, "utf8");

const extension = fileName.split(".").pop().toLowerCase();

const scriptKind = {
    js: ts.ScriptKind.JS,
    jsx: ts.ScriptKind.JSX,
    ts: ts.ScriptKind.TS,
    tsx: ts.ScriptKind.TSX,
    mjs: ts.ScriptKind.JS,
    cjs: ts.ScriptKind.JS,
    mts: ts.ScriptKind.TS,
    cts: ts.ScriptKind.TS,
}[extension];

if (scriptKind === undefined) {
    throw new Error(`Unsupported file extension: .${extension}`);
}

const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
);

if (sourceFile.parseDiagnostics.length > 0) {
    const messages = sourceFile.parseDiagnostics.map(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
        );

        const position = diagnostic.start === undefined
            ? ""
            : ` at position ${diagnostic.start}`;

        return `${message}${position}`;
    });

    throw new Error(`Unable to parse source:\n${messages.join("\n")}`);
}

const commaPositions = new Set();

const languageVariant =
    scriptKind === ts.ScriptKind.JSX || scriptKind === ts.ScriptKind.TSX
        ? ts.LanguageVariant.JSX
        : ts.LanguageVariant.Standard;

function visitNode(node) {
    ts.forEachChild(node, visitNode, visitNodes);
}

function visitNodes(nodes) {
    if (nodes.hasTrailingComma && nodes.length > 0) {
        const lastElement = nodes[nodes.length - 1];

        const scanner = ts.createScanner(
            ts.ScriptTarget.Latest,
            true,
            languageVariant,
            source,
            undefined,
            lastElement.end,
            nodes.end - lastElement.end
        );

        if (scanner.scan() !== ts.SyntaxKind.CommaToken) {
            throw new Error(
                `Could not locate trailing comma at position ${lastElement.end}`
            );
        }

        commaPositions.add(scanner.getTokenPos());
    }

    for (const node of nodes) {
        visitNode(node);
    }
}

visitNode(sourceFile);

const positions = [...commaPositions].sort((a, b) => b - a);

let updatedSource = source;

for (const position of positions) {
    updatedSource =
        updatedSource.slice(0, position) +
        updatedSource.slice(position + 1);
}

process.stdout.write(JSON.stringify({
    source: updatedSource,
    removed: positions.length,
}));
"""


def find_typescript_module() -> Path:
    for module_path in TYPESCRIPT_MODULES:
        if module_path.exists():
            return module_path

    raise FileNotFoundError(
        "Could not find the project's TypeScript installation."
    )


def transform_source(
    source: str,
    file_name: str,
    typescript_module: Path,
) -> tuple[str, int]:
    result = subprocess.run(
        [
            "node",
            "-e",
            NODE_HELPER,
            str(typescript_module),
            file_name,
        ],
        input=source,
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        raise ValueError(
            result.stderr.strip() or "TypeScript parsing failed."
        )

    output = json.loads(result.stdout)
    return output["source"], output["removed"]


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Remove JavaScript and TypeScript trailing commas. "
            "Defaults to a dry run."
        )
    )

    mode = parser.add_mutually_exclusive_group()

    mode.add_argument(
        "--apply",
        action="store_true",
        help="Write the proposed changes to the input files.",
    )

    mode.add_argument(
        "--self-test",
        action="store_true",
        help="Run built-in regression tests.",
    )

    parser.add_argument(
        "files",
        nargs="*",
        help="JavaScript or TypeScript files to inspect.",
    )

    return parser.parse_args()


def validate_paths(file_names: list[str]) -> list[Path]:
    paths = []
    seen = set()
    errors = []

    for file_name in file_names:
        path = Path(file_name).expanduser()

        if not path.exists():
            errors.append(f"{path}: file does not exist.")
            continue

        if not path.is_file():
            errors.append(f"{path}: not a regular file.")
            continue

        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            errors.append(
                f"{path}: unsupported extension '{path.suffix}'."
            )
            continue

        resolved = path.resolve()

        if resolved in seen:
            errors.append(f"{path}: duplicate input file.")
            continue

        seen.add(resolved)
        paths.append(resolved)

    if errors:
        raise ValueError("\n".join(errors))

    return paths


def prepare_changes(
    paths: list[Path],
    typescript_module: Path,
) -> list[dict]:
    prepared = []
    errors = []

    for path in paths:
        try:
            original = path.read_bytes().decode("utf-8")

            updated, removed = transform_source(
                original,
                path.name,
                typescript_module,
            )

            prepared.append({
                "path": path,
                "original": original,
                "updated": updated,
                "removed": removed,
            })

        except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as error:
            errors.append(f"{path}: {error}")

    if errors:
        raise ValueError(
            "Preflight failed. No files were modified:\n"
            + "\n".join(errors)
        )

    return prepared


def show_dry_run(prepared: list[dict]) -> None:
    total_removed = 0

    for item in prepared:
        path = item["path"]
        removed = item["removed"]
        total_removed += removed

        if removed == 0:
            print(f"UNCHANGED: {path} (0 trailing commas)")
            continue

        print(f"\nWOULD CHANGE: {path} ({removed} trailing commas)")

        diff = difflib.unified_diff(
            item["original"].splitlines(keepends=True),
            item["updated"].splitlines(keepends=True),
            fromfile=str(path),
            tofile=f"{path} (updated)",
        )

        sys.stdout.writelines(diff)

    print("\nDry run complete.")
    print(f"Files inspected: {len(prepared)}")
    print(f"Trailing commas to remove: {total_removed}")
    print("No files were modified. Use --apply to write changes.")


def apply_changes(prepared: list[dict]) -> None:
    changed = 0
    total_removed = 0

    for item in prepared:
        path = item["path"]
        removed = item["removed"]

        if removed == 0:
            print(f"UNCHANGED: {path}")
            continue

        path.write_bytes(item["updated"].encode("utf-8"))

        changed += 1
        total_removed += removed

        print(f"UPDATED: {path} ({removed} trailing commas removed)")

    print("\nApply complete.")
    print(f"Files updated: {changed}/{len(prepared)}")
    print(f"Trailing commas removed: {total_removed}")


def run_cli(*arguments: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT_PATH), *arguments],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def write_test_file(path: Path, content: str | bytes) -> None:
    if isinstance(content, bytes):
        path.write_bytes(content)
    else:
        path.write_text(content, encoding="utf-8", newline="")


def run_self_tests() -> int:
    passed = 0
    failed = 0

    def check(name: str, test) -> None:
        nonlocal passed, failed

        try:
            test()
            print(f"PASS: {name}")
            passed += 1
        except Exception as error:
            print(f"FAIL: {name}")
            print(f"  {error}")
            failed += 1

    try:
        typescript_module = find_typescript_module()
    except Exception as error:
        print(f"SELF-TEST ERROR: {error}", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory(
        prefix="remove-trailing-commas-"
    ) as temporary_directory:
        temp = Path(temporary_directory)

        def test_transformations():
            cases = [
                (
                    "object",
                    "const x = { a: 1, };",
                    "const x = { a: 1 };",
                    1,
                    "test.ts",
                ),
                (
                    "JavaScript file",
                    "const config = { enabled: true, };",
                    "const config = { enabled: true };",
                    1,
                    "test.js",
                ),
                (
                    "TypeScript type annotation",
                    "const user: { name: string; age: number } = { name: 'Danny', age: 27, };",
                    "const user: { name: string; age: number } = { name: 'Danny', age: 27 };",
                    1,
                    "test.ts",
                ),
                (
                    "array",
                    "const x = [1, 2, ];",
                    "const x = [1, 2 ];",
                    1,
                    "test.ts",
                ),
                (
                    "function parameters",
                    "function f(a, b,) {}",
                    "function f(a, b) {}",
                    1,
                    "test.ts",
                ),
                (
                    "function arguments",
                    "f(a, b,);",
                    "f(a, b);",
                    1,
                    "test.ts",
                ),
                (
                    "imports and exports",
                    "import { a, b, } from 'module'; export { a, b, };",
                    "import { a, b } from 'module'; export { a, b };",
                    2,
                    "test.ts",
                ),
                (
                    "nested structures",
                    "const x = { a: [1, 2,], b: { c: 3, }, };",
                    "const x = { a: [1, 2], b: { c: 3 } };",
                    3,
                    "test.ts",
                ),
                (
                    "strings and comments",
                    'const x = ",}"; // ,]\nconst y = [1,];',
                    'const x = ",}"; // ,]\nconst y = [1];',
                    1,
                    "test.ts",
                ),
                (
                    "template literal",
                    'const x = `text,]`; const y = [1,];',
                    'const x = `text,]`; const y = [1];',
                    1,
                    "test.ts",
                ),
                (
                    "regular expression",
                    'const x = /,\\]/; const y = [1,];',
                    'const x = /,\\]/; const y = [1];',
                    1,
                    "test.ts",
                ),
                (
                    "JSX",
                    "const element = <div data-items={[1, 2,]}>Hello</div>;",
                    "const element = <div data-items={[1, 2]}>Hello</div>;",
                    1,
                    "test.jsx",
                ),
                (
                    "TSX",
                    "const items = [1, 2,];\nconst element = <div data-items={items}>Hello</div>;\n",
                    "const items = [1, 2];\nconst element = <div data-items={items}>Hello</div>;\n",
                    1,
                    "test.tsx",
                ),
                (
                    "trailing comma before comment",
                    "const x = { a: 1, /* keep this comment */ };",
                    "const x = { a: 1 /* keep this comment */ };",
                    1,
                    "test.ts",
                ),
                (
                    "no trailing commas",
                    "const x = [1, 2];",
                    "const x = [1, 2];",
                    0,
                    "test.ts",
                ),
            ]

            for name, source, expected, expected_count, file_name in cases:
                actual, count = transform_source(
                    source,
                    file_name,
                    typescript_module,
                )

                assert actual == expected, (
                    f"{name}: expected {expected!r}, got {actual!r}"
                )
                assert count == expected_count, (
                    f"{name}: expected {expected_count} removals, got {count}"
                )

        def test_invalid_syntax():
            try:
                transform_source(
                    "const x = { a: ;",
                    "invalid.ts",
                    typescript_module,
                )
            except ValueError:
                return

            raise AssertionError("Invalid syntax was accepted.")

        def test_dry_run_does_not_modify():
            file_path = temp / "dry-run.ts"
            original = "const x = { value: 1, };\n"
            write_test_file(file_path, original)

            result = run_cli(str(file_path))

            assert result.returncode == 0, result.stderr
            assert "WOULD CHANGE:" in result.stdout
            assert file_path.read_text(encoding="utf-8") == original

        def test_apply_changes_file():
            file_path = temp / "apply.ts"
            write_test_file(file_path, "const x = { value: 1, };\n")

            result = run_cli("--apply", str(file_path))

            assert result.returncode == 0, result.stderr
            assert "UPDATED:" in result.stdout
            assert file_path.read_text(encoding="utf-8") == (
                "const x = { value: 1 };\n"
            )

        def test_batch_preflight():
            valid_path = temp / "batch-valid.ts"
            invalid_path = temp / "batch-invalid.ts"

            original = "const x = { value: 1, };\n"
            write_test_file(valid_path, original)
            write_test_file(invalid_path, "const x = { value: ;\n")

            result = run_cli(
                "--apply",
                str(valid_path),
                str(invalid_path),
            )

            assert result.returncode != 0, (
                "Invalid batch unexpectedly succeeded."
            )
            assert "Preflight failed" in result.stderr
            assert valid_path.read_text(encoding="utf-8") == original

        def test_utf8_and_crlf():
            file_path = temp / "utf8-crlf.ts"
            original = "const café = { message: 'こんにちは', };\r\n"
            expected = "const café = { message: 'こんにちは' };\r\n"

            write_test_file(file_path, original.encode("utf-8"))

            result = run_cli("--apply", str(file_path))

            assert result.returncode == 0, result.stderr
            assert file_path.read_bytes() == expected.encode("utf-8")

        def test_idempotency():
            file_path = temp / "idempotent.ts"
            write_test_file(file_path, "const x = [1, 2,];\n")

            first = run_cli("--apply", str(file_path))
            assert first.returncode == 0, first.stderr

            after_first = file_path.read_bytes()

            second = run_cli("--apply", str(file_path))
            assert second.returncode == 0, second.stderr
            assert "UNCHANGED:" in second.stdout
            assert file_path.read_bytes() == after_first

        def test_cli_validation():
            missing = run_cli(str(temp / "missing.ts"))
            assert missing.returncode != 0
            assert "does not exist" in missing.stderr

            unsupported_path = temp / "unsupported.txt"
            write_test_file(unsupported_path, "unchanged")

            unsupported = run_cli(str(unsupported_path))
            assert unsupported.returncode != 0
            assert "unsupported extension" in unsupported.stderr

            duplicate_path = temp / "duplicate.ts"
            write_test_file(duplicate_path, "const x = 1;")

            duplicate = run_cli(
                str(duplicate_path),
                str(duplicate_path),
            )
            assert duplicate.returncode != 0
            assert "duplicate input file" in duplicate.stderr

        print("===== TRANSFORMATION TESTS =====")
        check("JavaScript and TypeScript transformations", test_transformations)
        check("Invalid syntax is rejected", test_invalid_syntax)

        print("\n===== CLI AND SAFETY TESTS =====")
        check("Dry run does not modify files", test_dry_run_does_not_modify)
        check("Apply writes the transformed source", test_apply_changes_file)
        check("Batch preflight prevents partial writes", test_batch_preflight)
        check("UTF-8 and CRLF are preserved", test_utf8_and_crlf)
        check("Repeated apply is idempotent", test_idempotency)
        check("Missing, unsupported, and duplicate inputs are rejected", test_cli_validation)

    print("\n===== SELF-TEST RESULTS =====")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print("Temporary test files cleaned up.")

    if failed:
        print("Some self-tests failed.")
        return 1

    print("All trailing-comma removal self-tests passed.")
    return 0


def main() -> int:
    args = parse_arguments()

    if args.self_test:
        return run_self_tests()

    if not args.files:
        print(
            "ERROR: provide at least one input file, or use --self-test.",
            file=sys.stderr,
        )
        return 1

    try:
        paths = validate_paths(args.files)
        typescript_module = find_typescript_module()
        prepared = prepare_changes(paths, typescript_module)

        if args.apply:
            apply_changes(prepared)
        else:
            show_dry_run(prepared)

        return 0

    except (OSError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
