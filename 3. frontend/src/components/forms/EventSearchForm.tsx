import "../../styles/search/event-search-bar.css";
import "../../styles/shared/search-bar-shared.css";
import type { EventSearchFormProps } from "../../types/events/search/EventSearchForm.types.ts";
import SearchControls from "./SearchControls.tsx";

export default function EventSearchForm({
    keyword,
    searching,
    onKeywordChange,
    onSearch,
    onClearQuery,
}: EventSearchFormProps) {
    return (
        <form className="search-form" onSubmit={onSearch}>
            <label htmlFor="event-search">Search events</label>

            <SearchControls
                inputId="event-search"
                query={keyword}
                searching={searching}
                placeholder="e.g. Meet and Greet"
                submitLabel="Search"
                onQueryChange={onKeywordChange}
                onClearQuery={onClearQuery}
            />
        </form>
    );
}
