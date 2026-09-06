export const expectNthQuery = (
    queryExecutor: any,
    queryNumber: number,
    sqlFragment: string,
    params?: any[],
) => {
    expect(queryExecutor.query).toHaveBeenNthCalledWith(
        queryNumber,
        expect.stringContaining(sqlFragment),
        ...(params === undefined ? [] : [params]),
    );
};


export const mockTransaction = (
    db: any,
    client: any,
) => {
    db.transaction = jest.fn(async (
        callback: (client: any) => Promise<any>,
    ) => {
        return callback(client);
    });
};

