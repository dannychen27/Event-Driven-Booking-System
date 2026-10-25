
"use strict";

const freshnessElement = document.getElementById("coverage-freshness");

function formatTorontoTimestamp(isoTimestamp) {
    const timestamp = new Date(isoTimestamp);

    if (Number.isNaN(timestamp.getTime())) {
        throw new Error("Invalid coverage timestamp");
    }

    return timestamp.toLocaleString("en-CA", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "America/Toronto",
    });
}

function renderCoverageFreshness(info) {
    if (
        typeof info.generatedAt !== "string" ||
        typeof info.commit !== "string" ||
        typeof info.branch !== "string" ||
        !info.commit.trim() ||
        !info.branch.trim()
    ) {
        throw new Error("Invalid coverage metadata");
    }

    const dateText = formatTorontoTimestamp(info.generatedAt);

    const commitLink = document.createElement("a");
    commitLink.href =
        "https://github.com/dannychen27/Event-Driven-Booking-System/commit/" +
        encodeURIComponent(info.commit);
    commitLink.textContent = info.commit.slice(0, 7);

    freshnessElement.replaceChildren(
        document.createTextNode(`Last published: ${dateText} · Commit: `),
        commitLink,
        document.createTextNode(` · Branch: ${info.branch}`)
    );
}

async function loadCoverageMetadata() {
    try {
        const response = await fetch("./coverage-info.json");

        if (!response.ok) {
            throw new Error("Could not load coverage metadata");
        }

        const info = await response.json();
        renderCoverageFreshness(info);
    } catch {
        freshnessElement.textContent =
            "Coverage deployment information is unavailable.";
    }
}

loadCoverageMetadata();
