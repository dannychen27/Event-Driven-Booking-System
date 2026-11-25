import type { FormEventHandler } from "react";

export interface VenueSearchFormProps {
    keyword: string;
    onKeywordChange: (value: string) => void;
    onSearch: FormEventHandler<HTMLFormElement>;
    onClearQuery: () => void;
}
