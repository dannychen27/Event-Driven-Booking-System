import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "pill"
    | "success"
    | "danger"
    | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}
