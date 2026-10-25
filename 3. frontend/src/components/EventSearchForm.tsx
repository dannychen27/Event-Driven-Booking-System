import type { FormEventHandler } from "react";
import "../styles/search/event-search-bar.css";
import "../styles/shared/event-search-bar-shared.css";


interface EventSearchFormProps {
    keyword: string;
    searching: boolean;
    isSearchActive: boolean;
    onKeywordChange: (value: string) => void;
    onSearch: FormEventHandler<HTMLFormElement>;
    onClearQuery: () => void;
    onClearSearch: () => void;
}

export default function EventSearchForm({
    keyword,
    searching,
    isSearchActive,
    onKeywordChange,
    onSearch,
    onClearQuery,
    onClearSearch,
}: EventSearchFormProps) {
    return (
        <form className="event-search-form" onSubmit={onSearch}>
            <label htmlFor="event-search">Search events</label>
            <div className="event-search-controls">
                <input
                    id="event-search"
                    type="text"
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    placeholder="e.g. Meet and Greet"
                />
                <button type="submit" disabled={searching}>
                    {searching ? "Searching..." : "Search"}
                </button>
                <button
                    type="button"
                    className="ai-search-clear"
                    disabled={searching || keyword.length === 0}
                    onClick={onClearQuery}
                >
                    Clear query
                </button>
                {isSearchActive && (
                    <button
                        className="clear-search-button"
                        type="button"
                        onClick={onClearSearch}
                        disabled={searching}
                    >
                        Clear search
                    </button>
                )}
            </div>
        </form>
    );
}
