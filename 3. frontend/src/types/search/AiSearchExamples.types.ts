export interface AiSearchExamplesProps {
    examples: string[];
    disabled: boolean;
    onSelectExample: (example: string) => void;
}
