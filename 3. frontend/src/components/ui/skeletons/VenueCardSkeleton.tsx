import "../../../styles/shared/card.css";
import "../../../styles/venues/venue-card.css";
import "../../../styles/shared/skeleton-cards.css";
import Skeleton from "../Skeleton";

export default function VenueCardSkeleton() {
    return (
        <div className="card venue-card venue-card-skeleton">
            <Skeleton
                width="70%"
                height="1.5rem"
                variant="text"
            />

            <div className="venue-card-skeleton__address">
                <Skeleton width="5rem" variant="text" />
                <Skeleton width="85%" variant="text" />
            </div>
        </div>
    );
}
