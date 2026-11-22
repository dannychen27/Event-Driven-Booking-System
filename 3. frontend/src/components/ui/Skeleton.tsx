import "../../styles/shared/skeleton.css";

export type SkeletonProps = {
    width?: string;
    height?: string;
    variant?: "text" | "rectangular" | "circular";
    className?: string;
};

export default function Skeleton({
    width,
    height,
    variant = "rectangular",
    className = "",
}: SkeletonProps) {
    const classes = ["skeleton", `skeleton--${variant}`, className]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            className={classes}
            style={{
                ...(width ? { width } : {}),
                ...(height ? { height } : {}),
            }}
            aria-hidden="true"
        />
    );
}
