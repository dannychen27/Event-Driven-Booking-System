import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
    | "primary"
    | "secondary"
    | "pill"
    | "success"
    | "danger"
    | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

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