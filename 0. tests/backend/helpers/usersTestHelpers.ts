export const mockUserExists = (
    client: any,
    userId: number,
) => {
    client.query.mockResolvedValueOnce({
        rows: [{ id: userId }],
    });
};


export const mockUserDoesNotExist = (db: any) => {
    db.query.mockResolvedValueOnce({
        rows: [],
    });
};

