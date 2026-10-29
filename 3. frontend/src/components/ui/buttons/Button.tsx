import "../../../styles/shared/button.css";
import type {ButtonProps, ButtonVariant} from "./Button.types.ts";


function getButtonClassName(variant: ButtonVariant, className: string) {
    return ["button", `button--${variant}`, className]
        .filter(Boolean)
        .join(" ");
}

export default function Button({
   variant = "primary",
   className = "",
   type = "button",
   ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            type={type}
            className={getButtonClassName(variant, className)}
        />
    );
}
