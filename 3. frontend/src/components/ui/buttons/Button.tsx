import "../../../styles/shared/button.css";
import type { ButtonProps } from "./Button.types.ts";

export default function Button({
   variant = "primary",
   className = "",
   type = "button",
   ...props
}: ButtonProps) {
    const classes = [
        "button",
        `button--${variant}`,
        className,
    ].filter(Boolean).join(" ");

    return (
        <button
            {...props}
            type={type}
            className={classes}
        />
    );
}
