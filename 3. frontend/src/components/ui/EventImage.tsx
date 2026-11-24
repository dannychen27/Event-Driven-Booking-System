import { useState } from "react";
import { ImageOff } from "lucide-react";

interface EventImageProps {
    imageUrl: string | null;
    alt: string;
    onImageClick?: () => void;
}

export function EventImage({
    imageUrl,
    alt,
    onImageClick,
}: EventImageProps) {
    const [imageFailed, setImageFailed] = useState(false);

    if (!imageUrl || imageFailed) {
        return (
            <div
                className="event-image-fallback"
                role="img"
                aria-label={`${alt} image unavailable`}
            >
                <ImageOff size={32} aria-hidden="true" />
                <span>No image available</span>
            </div>
        );
    }

    const image = (
        <img
            className="event-image"
            src={imageUrl}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
        />
    );

    if (!onImageClick) {
        return image;
    }

    return (
        <button
            className="event-image-trigger"
            type="button"
            aria-label={`Enlarge ${alt} image`}
            onClick={onImageClick}
        >
            {image}
        </button>
    );
}
