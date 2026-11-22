import { useId } from "react";
import type { ReactNode } from "react";
import Button from "./buttons/Button";
import "../../styles/errors/error-state.css";

export type ErrorStateProps = {
    title: string;
    description: string;
    illustration?: ReactNode;
    onRetry?: () => void;
    retryLabel?: string;
    variant?: "playful" | "professional";
    className?: string;
};

function DefaultIllustration() {
    return (
        <svg
            className="error-state__svg"
            viewBox="0 0 160 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="29"
                y="17"
                width="102"
                height="82"
                rx="12"
                fill="currentColor"
                opacity="0.12"
            />
            <rect
                x="38"
                y="27"
                width="84"
                height="63"
                rx="7"
                fill="currentColor"
                opacity="0.2"
            />
            <path
                d="M55 49H105M55 60H91"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.65"
            />
            <circle cx="80" cy="76" r="3" fill="currentColor" />
            <circle cx="70" cy="76" r="3" fill="currentColor" />
            <path
                d="M73 85C77 81 83 81 87 85"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <circle
                cx="121"
                cy="30"
                r="15"
                fill="currentColor"
                opacity="0.3"
            />
            <path
                d="M115 30H127M121 24V36"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <circle
                cx="35"
                cy="91"
                r="8"
                fill="currentColor"
                opacity="0.35"
            />
        </svg>
    );
}

export default function ErrorState({
    title,
    description,
    illustration,
    onRetry,
    retryLabel = "Try again",
    variant = "playful",
    className = "",
}: ErrorStateProps) {
    const titleId = useId();
    const descriptionId = useId();

    const classes = [
        "error-state",
        `error-state--${variant}`,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <section
            className={classes}
            role="alert"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
        >
            <div className="error-state__illustration" aria-hidden="true">
                {illustration ?? <DefaultIllustration />}
            </div>

            <div className="error-state__content">
                <h2 id={titleId} className="error-state__title">
                    {title}
                </h2>

                <p id={descriptionId} className="error-state__description">
                    {description}
                </p>

                {onRetry && (
                    <div className="error-state__actions">
                        <Button
                            variant="primary"
                            onClick={onRetry}
                        >
                            {retryLabel}
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
