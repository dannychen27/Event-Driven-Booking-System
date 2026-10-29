import type { InfoLabelProps } from "../../types/InfoLabelProps.ts";


export function InfoLabel({ label, value }: InfoLabelProps) {
    return <p>{label}: {value}</p>;
}
