import type { ButtonVariant } from "../../types/Button.types.ts";

export function getButtonClassName(variant: ButtonVariant, className: string) {
    // Remove empty or otherwise falsy class names before joining.
    return ["button", `button--${variant}`, className]
        .filter(Boolean)
        .join(" ");
}
