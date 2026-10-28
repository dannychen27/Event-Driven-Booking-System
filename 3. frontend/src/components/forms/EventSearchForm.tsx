import type { FormEventHandler } from "react";
import Button from "../ui/buttons/Button";
import "../../styles/search/event-search-bar.css";
import "../../styles/shared/event-search-bar-shared.css";
import "../../styles/shared/button.css";

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

                <Button type="submit" disabled={searching}>
                    {searching ? "Searching..." : "Search"}
                </Button>

                <Button
                    variant="secondary"
                    className="ai-search-clear"
                    disabled={searching || keyword.length === 0}
                    onClick={onClearQuery}
                >
                    Clear query
                </Button>

                {isSearchActive && (
                    <Button
                        variant="secondary"
                        className="clear-search-button"
                        onClick={onClearSearch}
                        disabled={searching}
                    >
                        Clear search
                    </Button>
                )}
            </div>
        </form>
    );
}
