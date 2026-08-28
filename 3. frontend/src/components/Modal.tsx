import type { ReactNode } from "react";


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
        <div className="modal">
            <div className="modal-content">
                {children}

                {actions.map((action) => (
                    <button key={action.label} onClick={action.onClick}>
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
