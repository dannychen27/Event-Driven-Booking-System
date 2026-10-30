import "../../../styles/shared/button.css";
import type { ButtonProps } from "../../../types/shared/Button.types.ts";
import { getButtonClassName } from "../../../helpers/shared/ButtonHelpers.ts";


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
