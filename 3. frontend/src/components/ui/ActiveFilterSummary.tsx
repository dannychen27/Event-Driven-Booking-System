import "../../styles/shared/active-filter-summary.css";

export interface ActiveFilterSummaryItem {
    id: string;
    label: string;
    value: string;
    onRemove: () => void;
}

interface ActiveFilterSummaryProps {
    filters: ActiveFilterSummaryItem[];
    resultCount: number;
    resultNoun: string;
    hint: string;
    onClearAll: () => void;
}

export default function ActiveFilterSummary({
    filters,
    resultCount,
    resultNoun,
    hint,
    onClearAll,
}: ActiveFilterSummaryProps) {
    if (filters.length === 0) {
        return null;
    }

    const plural = resultCount === 1 ? "" : "s";

    return (
        <section
            className="active-filter-summary"
            aria-label="Active filters"
            aria-live="polite"
        >
            <div className="active-filter-summary__chips">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        type="button"
                        className="active-filter-summary__chip"
                        aria-label={`Remove ${filter.label} filter: ${filter.value}`}
                        onClick={filter.onRemove}
                    >
                        <span>{filter.label}: {filter.value}</span>
                        <span aria-hidden="true">×</span>
                    </button>
                ))}
            </div>

            <div className="active-filter-summary__footer">
                <p className="active-filter-summary__hint">{hint}</p>

                <button
                    type="button"
                    className="active-filter-summary__clear"
                    onClick={onClearAll}
                >
                    Clear all
                </button>
            </div>

            <p className="active-filter-summary__count">
                {resultCount} {resultNoun}{plural}
            </p>
        </section>
    );
}
