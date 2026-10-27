import { render } from "@testing-library/react";

import { Modal } from "../../../3. frontend/src/components/Modal";

function ModalBody() {
    return (
        <>
            <h2>Test Modal</h2>
            <p>Test message.</p>
        </>
    );
}

const confirmActions = (onClick: () => void) => [
    {
        label: "Confirm",
        onClick,
    },
];

export function renderModal({
    withActions = true,
    onClick = () => {},
}: {
    withActions?: boolean;
    onClick?: () => void;
} = {}) {
    const actions = withActions ? confirmActions(onClick) : undefined;

    return render(<Modal body={<ModalBody />} actions={actions} />);
}
