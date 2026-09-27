import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Config, JsonDB } from 'node-json-db';
import { join } from 'node:path';
import { DatabaseCollection } from './database-collection.enum';
import { DATABASE_SEED } from './database-seed.data';

const DATABASE_FILE_PATH = join(process.cwd(), 'db');
const SAVE_ON_PUSH = true;
const HUMAN_READABLE = true;

/**
 * Thin, typed wrapper around node-json-db.
 *
 * Callers only ever read/write whole collections identified by the
 * `DatabaseCollection` enum, never by a hand-built path string. That is what
 * keeps user-supplied values (group names, ids, etc.) from ever reaching
 * JsonDB's path resolver, which is the equivalent of parameterizing a query
 * instead of concatenating raw input into it.
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly db = new JsonDB(new Config(DATABASE_FILE_PATH, SAVE_ON_PUSH, HUMAN_READABLE, '/'));

  async onModuleInit(): Promise<void> {
    for (const collection of Object.values(DatabaseCollection)) {
      await this.ensureCollectionSeeded(collection);
    }
  }

  async getCollection<T>(collection: DatabaseCollection): Promise<T[]> {
    const exists = await this.db.exists(collection);
    if (!exists) {
      return [];
    }

    const data: unknown = await this.db.getData(collection);
    return Array.isArray(data) ? (data as T[]) : [];
  }

  async saveCollection<T>(collection: DatabaseCollection, data: readonly T[]): Promise<void> {
    await this.db.push(collection, data, true);
  }

  private async ensureCollectionSeeded(collection: DatabaseCollection): Promise<void> {
    const exists = await this.db.exists(collection);
    if (exists) {
      return;
    }

    this.logger.log(`Seeding empty collection "${collection}"`);
    await this.db.push(collection, DATABASE_SEED[collection], true);
  }
}
