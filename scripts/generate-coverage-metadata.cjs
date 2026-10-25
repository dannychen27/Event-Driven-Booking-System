const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SITE_DIR = path.join(ROOT_DIR, "site");

const COVERAGE_SUMMARIES = {
  backend: path.join(
      ROOT_DIR,
      "4. backend/coverage/coverage-summary.json"
  ),
  frontend: path.join(
      ROOT_DIR,
      "3. frontend/coverage/coverage-summary.json"
  ),
};

function getTestReportPath(project) {
  return path.join(
    process.env.RUNNER_TEMP || "/tmp",
    `${project}-test-results.json`
  );
}

function readJsonFile(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function readCoverageSummary(filename) {
  const report = readJsonFile(filename);
  const total = report.total;

  if (!total || typeof total !== "object") {
    throw new Error(`Missing total coverage metrics in ${filename}`);
  }

  const metrics = ["statements", "branches", "functions", "lines"];

  for (const metric of metrics) {
    const percentage = total[metric]?.pct;

    if (
        typeof percentage !== "number" ||
        !Number.isFinite(percentage) ||
        percentage < 0 ||
        percentage > 100
    ) {
      throw new Error(
          `Missing or invalid ${metric} coverage in ${filename}`
      );
    }
  }

  return {
    statements: total.statements.pct,
    branches: total.branches.pct,
    functions: total.functions.pct,
    lines: total.lines.pct,
  };
}

function readTestCounts(filename) {
  const report = readJsonFile(filename);

  const { numPassedTests, numFailedTests, numTotalTests, success } = report;

  if (
    !Number.isInteger(numPassedTests) ||
    !Number.isInteger(numFailedTests) ||
    !Number.isInteger(numTotalTests)
  ) {
    throw new Error(`Missing or invalid test counts in ${filename}`);
  }

  if (!success || numFailedTests !== 0) {
    throw new Error(`Tests failed in ${filename}`);
  }

  if (numPassedTests + numFailedTests !== numTotalTests) {
    throw new Error(`Inconsistent test counts in ${filename}`);
  }

  return {
    passed: numPassedTests,
    failed: numFailedTests,
    total: numTotalTests,
  };
}

function getTorontoTimestamp(date) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  }).format(date);
}

function createCoverageMetadata() {
  const backend = readTestCounts(getTestReportPath("backend"));
  const frontend = readTestCounts(getTestReportPath("frontend"));

  const backendCoverage = readCoverageSummary(COVERAGE_SUMMARIES.backend);
  const frontendCoverage = readCoverageSummary(COVERAGE_SUMMARIES.frontend);

  const now = new Date();

  function getRate(count, total) {
    return total === 0 ? 0 : Number(((count / total) * 100).toFixed(2));
  }

  function getTestDisplay(count, total) {
    return `${count}/${total} (${getRate(count, total)}%)`;
  }

  return {
    generatedAt: now.toISOString(),
    generatedAtDisplay: getTorontoTimestamp(now),
    commit: process.env.GITHUB_SHA || "local",
    branch: process.env.GITHUB_REF_NAME || "local",

    backendStatements: backendCoverage.statements,
    backendBranches: backendCoverage.branches,
    backendFunctions: backendCoverage.functions,
    backendLines: backendCoverage.lines,

    frontendStatements: frontendCoverage.statements,
    frontendBranches: frontendCoverage.branches,
    frontendFunctions: frontendCoverage.functions,
    frontendLines: frontendCoverage.lines,

    backendTestsPassed: backend.passed,
    frontendTestsPassed: frontend.passed,
    totalTestsPassed: backend.passed + frontend.passed,

    backendTestsTotal: backend.total,
    frontendTestsTotal: frontend.total,
    totalTests: backend.total + frontend.total,

    backendTestsFailed: backend.failed,
    frontendTestsFailed: frontend.failed,

    backendTestsPassedDisplay: getTestDisplay(backend.passed, backend.total),
    backendTestsFailedDisplay: getTestDisplay(backend.failed, backend.total),

    frontendTestsPassedDisplay: getTestDisplay(frontend.passed, frontend.total),
    frontendTestsFailedDisplay: getTestDisplay(frontend.failed, frontend.total),

    totalTestsPassedDisplay: getTestDisplay(
        backend.passed + frontend.passed,
        backend.total + frontend.total
    ),
    totalTestsFailedDisplay: getTestDisplay(
        backend.failed + frontend.failed,
        backend.total + frontend.total
    ),

    backendTestPassRate: getRate(backend.passed, backend.total),
    frontendTestPassRate: getRate(frontend.passed, frontend.total),
    totalTestsPassRate: getRate(backend.passed + frontend.passed, backend.total + frontend.total),

    backendTestFailureRate: getRate(backend.failed, backend.total),
    frontendTestFailureRate: getRate(frontend.failed, frontend.total),
    totalTestsFailureRate: getRate(backend.failed + frontend.failed, backend.total + frontend.total),
  };
}

function writeCoverageMetadata(metadata) {
  fs.mkdirSync(SITE_DIR, { recursive: true });

  const outputPath = path.join(SITE_DIR, "coverage-info.json");

  fs.writeFileSync(
    outputPath,
    JSON.stringify(metadata, null, 2) + "\n"
  );

  console.log(`Coverage metadata written to ${outputPath}`);
  console.log(JSON.stringify(metadata, null, 2));
}

function main() {
  const metadata = createCoverageMetadata();
  writeCoverageMetadata(metadata);
}

main();
