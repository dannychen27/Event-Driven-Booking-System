import "../../styles/search/venue-search-bar.css";
import "../../styles/shared/search-bar-shared.css";
import type { VenueSearchFormProps } from "../../types/venues/VenueSearchForm.types.ts";
import SearchControls from "./SearchControls.tsx";

export default function VenueSearchForm({
    keyword,
    onKeywordChange,
    onSearch,
    onClearQuery,
}: VenueSearchFormProps) {
    return (
        <form className="search-form" onSubmit={onSearch}>
            <label htmlFor="venue-search">Search venues</label>

            <SearchControls
                inputId="venue-search"
                query={keyword}
                searching={false}
                placeholder="e.g. Community centre"
                submitLabel="Search"
                onQueryChange={onKeywordChange}
                onClearQuery={onClearQuery}
            />
        </form>
    );
}
