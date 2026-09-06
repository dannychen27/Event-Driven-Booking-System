export const mockVenueDoesNotExist = (db: any) => {
    db.query.mockResolvedValueOnce({
        rows: [],
    });
};


export const mockGetAllVenues = (
    db: any,
    venues: any[],
) => {
    db.query.mockResolvedValueOnce({
        rows: venues,
    });
};


export const mockGetVenue = (
    db: any,
    venue: any,
) => {
    db.query.mockResolvedValueOnce({
        rows: [venue],
    });
};

