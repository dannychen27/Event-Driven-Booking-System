import "../../styles/search/ai-search-form.css";
import "../../styles/shared/search-bar-shared.css";
import type { AiSearchFormProps } from "../../types/AiSearchForm.types.ts";
import { SEARCH_EXAMPLES } from "./AiSearchForm.constants.ts";
import AiSearchExamples from "./AiSearchExamples.tsx";
import SearchControls from "./SearchControls.tsx";

export default function AiSearchForm({
    prompt,
    searching,
    onQueryChange,
    onSearch,
    onClearQuery,
}: AiSearchFormProps) {
    return (
        <form
            className="search-form ai-search-form"
            onSubmit={onSearch}
        >
            <label htmlFor="natural-language-search">
                Search with AI
            </label>

            <p className="ai-search-help">
                Describe the events you’re looking for in plain English.
            </p>

            <AiSearchExamples
                examples={SEARCH_EXAMPLES}
                disabled={searching}
                onSelectExample={onQueryChange}
            />

            <SearchControls
                inputId="natural-language-search"
                query={prompt}
                searching={searching}
                placeholder="e.g. Find events happening this weekend"
                submitLabel="Ask AI"
                onQueryChange={onQueryChange}
                onClearQuery={onClearQuery}
                clearButtonClassName="ai-search-clear"
            />
        </form>
    );
}
