export interface SearchControlsProps {
    inputId: string;
    query: string;
    searching: boolean;
    placeholder: string;
    submitLabel: string;
    searchingLabel?: string;
    onQueryChange: (value: string) => void;
    onClearQuery: () => void;
    clearButtonClassName?: string;
}
