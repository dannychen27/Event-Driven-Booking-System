import { useState } from "react";
import { ImageOff } from "lucide-react";

interface EventImageProps {
    imageUrl: string | null;
    alt: string;
}

export function EventImage({ imageUrl, alt }: EventImageProps) {
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

    return (
        <img
            className="event-image"
            src={imageUrl}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
        />
    );
}
