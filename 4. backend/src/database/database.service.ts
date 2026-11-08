import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';

import { rollbackTransactionSafely } from './database-transaction.helper';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const database = process.env.DB_NAME?.trim();
    const user = process.env.DB_USER?.trim();

    if (!database) {
      throw new Error(
        'DB_NAME must be explicitly configured. Refusing to connect without a database name.',
      );
    }

    if (!user) {
      throw new Error(
        'DB_USER must be explicitly configured. Refusing to connect without a database user.',
      );
    }

    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database,
      user,
      password: process.env.DB_PASSWORD,
    });
  }

  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await callback(client);

      await client.query('COMMIT');

      return result;
    } catch (error) {
      await rollbackTransactionSafely(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
