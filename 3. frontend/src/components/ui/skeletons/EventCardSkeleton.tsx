import "../../../styles/shared/card.css";
import "../../../styles/events/event-card.css";
import "../../../styles/shared/card-buttons.css";
import "../../../styles/shared/skeleton-cards.css";
import Skeleton from "../Skeleton";

export default function EventCardSkeleton() {
    return (
        <div className="card event-card event-card-skeleton">
            <Skeleton
                width="100%"
                height="auto"
                className="event-image event-card-skeleton__image"
            />

            <div className="event-card-skeleton__header">
                <Skeleton
                    width="65%"
                    height="1.5rem"
                    variant="text"
                />
                <Skeleton
                    width="6rem"
                    height="1.5rem"
                    variant="rectangular"
                />
            </div>

            <div className="event-card-skeleton__metadata">
                {Array.from({ length: 3 }, (_, index) => (
                    <div className="event-card-skeleton__row" key={index}>
                        <Skeleton width="5rem" variant="text" />
                        <Skeleton width="55%" variant="text" />
                    </div>
                ))}

                <div className="event-card-skeleton__row">
                    <Skeleton width="5rem" variant="text" />
                    <div className="event-card-skeleton__date">
                        <Skeleton width="6rem" variant="text" />
                        <Skeleton width="75%" variant="text" />
                    </div>
                </div>

                <div className="event-card-skeleton__row">
                    <Skeleton width="5rem" variant="text" />
                    <Skeleton width="35%" variant="text" />
                </div>
            </div>

            <Skeleton
                width="9rem"
                height="2.5rem"
                className="event-card-skeleton__action"
            />
        </div>
    );
}
