import type { FormEventHandler } from "react";
import "../../styles/search/ai-search-bar.css";
import "../../styles/shared/event-search-bar-shared.css";


const SEARCH_EXAMPLES = [
    "Find coffee meetups this weekend",
    "Show me tech networking events",
    "Find relaxed events next week",
];

interface AiSearchFormProps {
    query: string;
    searching: boolean;
    onQueryChange: (value: string) => void;
    onSearch: FormEventHandler<HTMLFormElement>;
    onClearQuery: () => void;
}

export default function AiSearchForm({
    query,
    searching,
    onQueryChange,
    onSearch,
    onClearQuery,
}: AiSearchFormProps) {
    return (
        <form
            className="event-search-form ai-search-form"
            onSubmit={onSearch}
        >
            <label htmlFor="natural-language-search">
                Search with AI
            </label>

            <p className="ai-search-help">
                Describe the events you’re looking for in plain English.
            </p>

            <div className="ai-search-examples">
                <span className="ai-search-examples-label">
                    Try an example:
                </span>

                {SEARCH_EXAMPLES.map((example) => (
                    <button
                        key={example}
                        type="button"
                        className="ai-search-example"
                        disabled={searching}
                        onClick={() => onQueryChange(example)}
                    >
                        {example}
                    </button>
                ))}
            </div>

            <div className="event-search-controls">
                <input
                    id="natural-language-search"
                    type="text"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="e.g. Find events happening this weekend"
                />

                <button type="submit" disabled={searching}>
                    {searching ? "Searching..." : "Ask AI"}
                </button>

                <button
                    type="button"
                    className="ai-search-clear"
                    disabled={searching || query.length === 0}
                    onClick={onClearQuery}
                >
                    Clear query
                </button>
            </div>
        </form>
    );
}
