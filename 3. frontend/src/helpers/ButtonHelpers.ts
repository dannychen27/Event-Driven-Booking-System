import type { ButtonVariant } from "../types/Button.types.ts";

export function getButtonClassName(variant: ButtonVariant, className: string) {
    return ["button", `button--${variant}`, className]
        .filter(Boolean)
        .join(" ");
}
