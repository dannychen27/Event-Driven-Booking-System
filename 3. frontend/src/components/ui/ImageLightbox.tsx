import { useEffect, useRef } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import "../../styles/shared/image-lightbox.css";

interface ImageLightboxProps {
    imageUrl: string | null;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageLightbox({
    imageUrl,
    alt,
    isOpen,
    onClose,
}: ImageLightboxProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return;
        }

        if (isOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    if (!imageUrl) {
        return null;
    }

    function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
        event.preventDefault();
        onClose();
    }

    function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="image-lightbox"
            aria-label={`${alt} — enlarged image`}
            onCancel={handleCancel}
            onClick={handleDialogClick}
        >
            <button
                className="image-lightbox__close"
                type="button"
                aria-label="Close image viewer"
                onClick={onClose}
            >
                <span aria-hidden="true">×</span>
            </button>

            <img
                className="image-lightbox__image"
                src={imageUrl}
                alt={alt}
            />
        </dialog>
    );
}
