import type { ReactNode } from "react";
import "../styles/modal.css";


interface ModalAction {
    label: string;
    onClick: () => void | Promise<void>;
}

interface ModalProps {
    children: ReactNode;
    actions: ModalAction[];
}


export function Modal({ children, actions }: ModalProps) {
    return (
        <div className="modal-content">
            {children}

            <div className="modal-actions">
                {actions.map((action) => (
                    <button key={action.label} onClick={action.onClick}>
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
