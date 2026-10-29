import type { ChangeEventHandler } from "react";
import Button from "../ui/buttons/Button";
import type { SearchControlsProps } from "../../types/search/SearchControls.types.ts";


export default function SearchControls({
    inputId,
    query,
    searching,
    placeholder,
    submitLabel,
    searchingLabel = "Searching...",
    onQueryChange,
    onClearQuery,
    clearButtonClassName = "",
}: SearchControlsProps) {
    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        onQueryChange(event.target.value);
    };

    return (
        <div className="search-controls">
            <input
                id={inputId}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={placeholder}
            />

            <Button type="submit" disabled={searching}>
                {searching ? searchingLabel : submitLabel}
            </Button>

            <Button
                variant="secondary"
                className={clearButtonClassName}
                disabled={searching || query.length === 0}
                onClick={onClearQuery}
            >
                Clear query
            </Button>
        </div>
    );
}
