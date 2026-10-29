import type { InfoLabelProps } from "../../types/shared/InfoLabel.types.ts";


export function InfoLabel({ label, value }: InfoLabelProps) {
    return <p>{label}: {value}</p>;
}
