import type { FormEventHandler } from "react";

export interface AiSearchFormProps {
    prompt: string;
    searching: boolean;
    onQueryChange: (value: string) => void;
    onSearch: FormEventHandler<HTMLFormElement>;
    onClearQuery: () => void;
}
