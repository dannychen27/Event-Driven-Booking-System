import "../../styles/shared/modal.css";
import Button from "../ui/buttons/Button";
import type { ModalProps } from "../../types/Modal.types.ts";


export function Modal({ body, actions = [] }: ModalProps) {
    return (
        <div className="modal-content">
            <div className="modal-body">
                {body}
            </div>

            {actions.length > 0 && (
                <div className="modal-actions">
                    {actions.map((action) => (
                        <Button
                            key={action.label}
                            variant={action.variant ?? "secondary"}
                            className={action.className}
                            onClick={action.onClick}
                            disabled={action.disabled}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
