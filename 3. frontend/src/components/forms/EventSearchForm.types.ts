import type { FormEventHandler } from "react";

export interface EventSearchFormProps {
    keyword: string;
    searching: boolean;
    onKeywordChange: (value: string) => void;
    onSearch: FormEventHandler<HTMLFormElement>;
    onClearQuery: () => void;
}
