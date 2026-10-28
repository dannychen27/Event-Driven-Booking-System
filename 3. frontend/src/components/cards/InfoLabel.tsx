import type { ReactNode } from "react";


export interface InfoLabelProps {
    label: string;
    value: ReactNode;
}

export function InfoLabel({ label, value }: InfoLabelProps) {
    return <p>{label}: {value}</p>;
}
