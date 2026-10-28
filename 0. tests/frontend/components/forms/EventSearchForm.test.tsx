import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventSearchForm from "../../../../3. frontend/src/components/forms/EventSearchForm";


describe("EventSearchForm", () => {
    let onKeywordChange: ReturnType<typeof vi.fn>;
    let onSearch: ReturnType<typeof vi.fn>;
    let onClearQuery: ReturnType<typeof vi.fn>;
    let onClearSearch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onKeywordChange = vi.fn();
        onSearch = vi.fn();
        onClearQuery = vi.fn();
        onClearSearch = vi.fn();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    const renderForm = ({
        keyword = "",
        searching = false,
        isSearchActive = false,
    }: {
        keyword?: string;
        searching?: boolean;
        isSearchActive?: boolean;
    } = {}) =>
        render(
            <EventSearchForm
                keyword={keyword}
                searching={searching}
                isSearchActive={isSearchActive}
                onKeywordChange={onKeywordChange}
                onSearch={onSearch}
                onClearQuery={onClearQuery}
                onClearSearch={onClearSearch}
            />,
        );

    it("keeps Clear query visible and disables it when the query is empty", () => {
        const { rerender } = renderForm();

        const clearButton = screen.getByRole("button", {
            name: "Clear query",
        });

        expect(clearButton).toBeVisible();
        expect(clearButton).toBeDisabled();

        rerender(
            <EventSearchForm
                keyword="Meet and Greet"
                searching={false}
                isSearchActive={false}
                onKeywordChange={onKeywordChange}
                onSearch={onSearch}
                onClearQuery={onClearQuery}
                onClearSearch={onClearSearch}
            />,
        );

        expect(clearButton).toBeEnabled();
    });

    it("calls onClearQuery when Clear query is clicked without submitting", () => {
        renderForm({ keyword: "Coffee" });

        fireEvent.click(
            screen.getByRole("button", { name: "Clear query" }),
        );

        expect(onClearQuery).toHaveBeenCalledTimes(1);
        expect(onSearch).not.toHaveBeenCalled();
    });

    it("disables the search controls while searching", () => {
        renderForm({ keyword: "Coffee", searching: true });

        expect(
            screen.getByRole("button", { name: "Searching..." }),
        ).toBeDisabled();

        expect(
            screen.getByRole("button", { name: "Clear query" }),
        ).toBeDisabled();
    });
});
