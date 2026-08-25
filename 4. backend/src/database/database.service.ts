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

    async onModuleDestroy() {
        await this.pool.end();
    }
}
