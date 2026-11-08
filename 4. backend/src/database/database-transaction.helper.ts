import { Logger } from '@nestjs/common';
import { PoolClient } from 'pg';

const logger = new Logger('DatabaseTransaction');

export async function rollbackTransactionSafely(
    client: PoolClient,
): Promise<void> {
    try {
        await client.query('ROLLBACK');
    } catch (rollbackError) {
        logger.error(
            'Transaction rollback failed',
            rollbackError instanceof Error
                ? rollbackError.stack
                : String(rollbackError),
        );
    }
}
