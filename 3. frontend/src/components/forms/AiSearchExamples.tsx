import "../../styles/search/ai-search-examples.css";
import type { AiSearchExamplesProps } from "../../types/AiSearchExamples.types.ts";
import Button from "../ui/buttons/Button.tsx";

export default function AiSearchExamples({
    examples,
    disabled,
    onSelectExample,
}: AiSearchExamplesProps) {
    return (
        <div className="ai-search-examples">
            <span className="ai-search-examples-label">
                Try an example:
            </span>

            {examples.map((example) => (
                <Button
                    key={example}
                    variant="pill"
                    className="ai-search-example"
                    disabled={disabled}
                    onClick={() => onSelectExample(example)}
                >
                    {example}
                </Button>
            ))}
        </div>
    );
}
