import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderAiSearchForm, } from "../../helpers/aiSearchFormTestHelpers";

describe("AiSearchForm", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders the AI search form and example queries", () => {
        renderAiSearchForm();

        expect(screen.getByLabelText("Search with AI")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Describe the events you’re looking for in plain English.",
            ),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Find coffee meetups this weekend",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Show me tech networking events",
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Find relaxed events next week",
            }),
        ).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Ask AI" }))
            .toBeEnabled();

        expect(screen.getByRole("button", { name: "Clear query" }))
            .toBeDisabled();
    });

    it("notifies the parent when typing or selecting an example without submitting", () => {
        const { onQueryChange, onSearch } = renderAiSearchForm();

        fireEvent.change(screen.getByLabelText("Search with AI"), {
            target: { value: "Find concerts" },
        });

        expect(onQueryChange).toHaveBeenCalledWith("Find concerts");

        fireEvent.click(
            screen.getByRole("button", {
                name: "Find coffee meetups this weekend",
            }),
        );

        expect(onQueryChange).toHaveBeenCalledWith(
            "Find coffee meetups this weekend",
        );
        expect(onSearch).not.toHaveBeenCalled();
    });

    it("calls the clear callback without submitting the form", () => {
        const { onClearQuery, onSearch } = renderAiSearchForm({ query: "Find concerts", });

        fireEvent.click(screen.getByRole("button", { name: "Clear query" }));

        expect(onClearQuery).toHaveBeenCalledTimes(1);
        expect(onSearch).not.toHaveBeenCalled();
    });

    it("disables the appropriate controls while searching", () => {
        renderAiSearchForm({ query: "Find concerts", searching: true });

        expect(screen.getByRole("button", { name: "Searching..." }))
            .toBeDisabled();

        expect(
            screen.getByRole("button", {
                name: "Find coffee meetups this weekend",
            }),
        ).toBeDisabled();

        expect(
            screen.getByRole("button", {
                name: "Show me tech networking events",
            }),
        ).toBeDisabled();

        expect(
            screen.getByRole("button", {
                name: "Find relaxed events next week",
            }),
        ).toBeDisabled();

        expect(screen.getByRole("button", { name: "Clear query" }))
            .toBeDisabled();
    });

    it("enables Clear query when the query is non-empty and not searching", () => {
        renderAiSearchForm({ query: "Find concerts" });

        expect(screen.getByRole("button", { name: "Clear query" }))
            .toBeEnabled();
    });
});
