import type { FormEventHandler } from "react";
import type {
    CalendarDateRange,
    CalendarTimeSelection,
    ExplicitSelection,
} from "./NaturalLanguageSearch.types.ts";

export interface AiSearchFormProps {
    prompt: string;
    searching: boolean;
    onQueryChange: (value: string) => void;
    onSearch: FormEventHandler<HTMLFormElement>;
    onClearQuery: () => void;
    dateSelection?: ExplicitSelection<CalendarDateRange>;
    timeSelection?: ExplicitSelection<CalendarTimeSelection>;
    onDateSelectionChange?: (
        selection: ExplicitSelection<CalendarDateRange> | undefined,
    ) => void;
    onTimeSelectionChange?: (
        selection: ExplicitSelection<CalendarTimeSelection> | undefined,
    ) => void;
}
