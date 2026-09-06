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

