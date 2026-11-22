import "../../../styles/shared/card.css";
import "../../../styles/bookings/booking-card.css";
import "../../../styles/shared/card-buttons.css";
import "../../../styles/shared/skeleton-cards.css";
import Skeleton from "../Skeleton";

export default function BookingCardSkeleton() {
    return (
        <div className="card booking-card booking-card-skeleton">
            <div className="booking-card__layout">
                <div className="booking-card__content">
                    <Skeleton
                        width="75%"
                        height="1.5rem"
                        variant="text"
                    />

                    <div className="booking-card-skeleton__metadata">
                        {Array.from({ length: 7 }, (_, index) => (
                            <div
                                className="booking-card-skeleton__row"
                                key={index}
                            >
                                <Skeleton width="5rem" variant="text" />
                                <Skeleton width="65%" variant="text" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="booking-card__image">
                    <Skeleton
                        width="100%"
                        height="auto"
                        className="booking-card-skeleton__image"
                    />
                </div>
            </div>

            <div className="booking-card__actions">
                <Skeleton width="9rem" height="2.5rem" />
            </div>
        </div>
    );
}
