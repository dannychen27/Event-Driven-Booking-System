import { render } from "@testing-library/react";
import { vi } from "vitest";

import AiSearchForm from "../../../3. frontend/src/components/forms/AiSearchForm";


export function renderAiSearchForm({
    query = "",
    searching = false,
}: {
    query?: string;
    searching?: boolean;
} = {}) {
    const onQueryChange = vi.fn();
    const onSearch = vi.fn();
    const onClearQuery = vi.fn();

    const renderResult = render(
        <AiSearchForm
            query={query}
            searching={searching}
            onQueryChange={onQueryChange}
            onSearch={onSearch}
            onClearQuery={onClearQuery}
        />,
    );

    return {
        ...renderResult,
        onQueryChange,
        onSearch,
        onClearQuery,
    };
}
