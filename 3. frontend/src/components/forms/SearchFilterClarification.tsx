import type {
    SearchFilterConflict,
    SearchFilterResolution,
} from "../../types/search/NaturalLanguageSearch.types.ts";
import "../../styles/search/search-filter-clarification.css";

interface SearchFilterClarificationProps {
    conflicts: SearchFilterConflict[];
    resolutions: Partial<Record<SearchFilterConflict["category"], SearchFilterResolution>>;
    disabled: boolean;
    onResolutionChange: (
        category: SearchFilterConflict["category"],
        resolution: SearchFilterResolution,
    ) => void;
    onApply: () => void;
}

export default function SearchFilterClarification({
    conflicts,
    resolutions,
    disabled,
    onResolutionChange,
    onApply,
}: SearchFilterClarificationProps) {
    const allResolved = conflicts.every(
        (conflict) => resolutions[conflict.category] !== undefined,
    );

    return (
        <section
            className="search-filter-clarification"
            aria-labelledby="search-filter-clarification-title"
        >
            <h2 id="search-filter-clarification-title">
                Please clarify your search
            </h2>

            <p>
                Your description and calendar filters disagree. Choose which
                interpretation to use for each conflict.
            </p>

            {conflicts.map((conflict) => (
                <fieldset
                    className="search-filter-conflict"
                    key={conflict.category}
                    disabled={disabled}
                >
                    <legend>
                        {conflict.category === "date" ? "Date conflict" : "Time conflict"}
                    </legend>

                    <p>
                        <strong>AI interpretation:</strong>{" "}
                        {conflict.aiInterpretation}
                    </p>

                    <p>
                        <strong>Calendar selection:</strong>{" "}
                        {conflict.userSelection}
                    </p>

                    <label>
                        <input
                            type="radio"
                            name={`resolution-${conflict.category}`}
                            value="ai"
                            checked={resolutions[conflict.category] === "ai"}
                            onChange={() => onResolutionChange(conflict.category, "ai")}
                        />
                        Use AI interpretation ({conflict.category})
                    </label>

                    <label>
                        <input
                            type="radio"
                            name={`resolution-${conflict.category}`}
                            value="selection"
                            checked={resolutions[conflict.category] === "selection"}
                            onChange={() => onResolutionChange(conflict.category, "selection")}
                        />
                        Use calendar selection ({conflict.category})
                    </label>
                </fieldset>
            ))}

            <button
                type="button"
                className="search-filter-apply"
                disabled={disabled || !allResolved}
                onClick={onApply}
            >
                Apply choices
            </button>
        </section>
    );
}
