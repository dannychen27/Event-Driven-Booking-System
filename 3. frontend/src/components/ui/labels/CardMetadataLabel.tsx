interface CardMetadataLabelProps {
    label: string;
    value: string;
}

export function CardMetadataLabel({
    label,
    value,
}: CardMetadataLabelProps) {
    return (
        <p className="card-metadata-label">
            <span className="card-metadata-label__label">
                {label}
            </span>
            <span className="card-metadata-label__value">
                {value}
            </span>
        </p>
    );
}
