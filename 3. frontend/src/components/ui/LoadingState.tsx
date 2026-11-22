import type { ReactNode } from "react";
import "../../styles/errors/loading-state.css";

export type LoadingStateProps = {
    message: string;
    description?: ReactNode;
    className?: string;
};

export default function LoadingState({
    message,
    description,
    className = "",
}: LoadingStateProps) {
    const classes = ["loading-state", className]
        .filter(Boolean)
        .join(" ");

    return (
        <section
            className={classes}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div
                className="loading-state__spinner"
                aria-hidden="true"
            />

            <div className="loading-state__content">
                <p className="loading-state__message">
                    {message}
                </p>

                {description && (
                    <div className="loading-state__description">
                        {description}
                    </div>
                )}
            </div>
        </section>
    );
}
