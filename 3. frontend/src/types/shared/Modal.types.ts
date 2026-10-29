import type { ReactNode } from "react";

export type ModalActionVariant = "primary" | "secondary" | "success" | "danger";

export interface ModalAction {
    label: string;
    onClick: () => void | Promise<void>;
    variant?: ModalActionVariant;
    className?: string;
    disabled?: boolean;
}

export interface ModalProps {
    body: ReactNode;
    actions?: ModalAction[];
}
