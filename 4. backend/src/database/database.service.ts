import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
    private readonly pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: 'localhost',
            port: 5432,
            database: 'booking_system',
            user: 'dannychen',
        });
    }

    query(text: string, params?: any[]) {
        return this.pool.query(text, params);
    }

    async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const result = await callback(client);

            await client.query('COMMIT');

            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async onModuleDestroy() {
        await this.pool.end();
    }
}
