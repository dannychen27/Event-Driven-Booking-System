import "../../../styles/shared/card.css";
import "../../../styles/venues/venue-card.css";
import "../../../styles/shared/skeleton-cards.css";
import Skeleton from "../Skeleton";

export default function VenueCardSkeleton() {
    return (
        <div className="card venue-card venue-card-skeleton">
            <div className="venue-card__image venue-card-skeleton__image">
                <Skeleton width="100%" height="100%" />
            </div>

            <div className="venue-card-skeleton__content">
                <Skeleton width="70%" height="1.5rem" variant="text" />
                <Skeleton width="35%" variant="text" />
                <Skeleton width="95%" variant="text" />
                <Skeleton width="80%" variant="text" />

                <div className="venue-card-skeleton__address">
                    <Skeleton width="5rem" variant="text" />
                    <Skeleton width="85%" variant="text" />
                </div>
            </div>
        </div>
    );
}
