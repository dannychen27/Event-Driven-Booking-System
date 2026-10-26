import type { ReactNode } from "react";
import "../styles/shared/modal.css";


interface ModalAction {
    label: string;
    onClick: () => void | Promise<void>;
    className?: string;
    disabled?: boolean;
}

interface ModalProps {
    body: ReactNode;
    actions?: ModalAction[];
}


export function Modal({ body, actions = [] }: ModalProps) {
    return (
        <div className="modal-content">
            <div className="modal-body">
                {body}
            </div>

            {actions.length > 0 && (
                <div className="modal-actions">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            className={action.className}
                            onClick={action.onClick}
                            disabled={action.disabled}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
