import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaSyncService implements OnModuleInit {
  private readonly logger = new Logger(SchemaSyncService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS username VARCHAR(100)
      `);

      await this.dataSource.query(`
        UPDATE users
        SET username = LOWER(SPLIT_PART(email, '@', 1))
        WHERE username IS NULL OR username = ''
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
      `);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Schema sync skipped: ${message}`);
    }
  }
}
