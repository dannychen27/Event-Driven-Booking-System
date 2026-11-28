import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';

import { rollbackTransactionSafely } from './database-transaction.helper';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    const poolMax = Number(process.env.DB_POOL_MAX ?? 5);

    if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 20) {
      throw new Error('DB_POOL_MAX must be an integer between 1 and 20.');
    }

    if (databaseUrl) {
      let sslMode: string | null;

      try {
        const connectionUrl = new URL(databaseUrl);

        if (
          connectionUrl.protocol !== 'postgres:' &&
          connectionUrl.protocol !== 'postgresql:'
        ) {
          throw new Error('Unsupported database URL protocol.');
        }

        sslMode = connectionUrl.searchParams.get('sslmode');
      } catch {
        throw new Error(
          'DATABASE_URL must be a valid PostgreSQL connection URL.',
        );
      }

      if (!['require', 'verify-ca', 'verify-full'].includes(sslMode ?? '')) {
        throw new Error(
          'DATABASE_URL must explicitly require TLS using sslmode=require, verify-ca, or verify-full.',
        );
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        max: poolMax,
      });

      return;
    }

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
      max: poolMax,
      ssl:
        process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: true }
          : undefined,
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
