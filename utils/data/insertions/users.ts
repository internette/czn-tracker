import { randomUUID } from 'crypto';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname since it's not available by default in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3Verbose = sqlite3.verbose();

// This ensures the DB file is always created exactly next to this script file
const dbPath = path.resolve(__dirname, '../../../data/czn-tracker.db');
const db = new sqlite3Verbose.Database(dbPath);

export interface User {
  id: string;
  name: string;
  email: string;
  characters_owned: string[];
}

export const createUsersTable = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        characters_owned TEXT NOT NULL DEFAULT '[]'
      )
      `,
      (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      }
    );
  });
};

export const insertUser = (
  name: string,
  email: string,
  charactersOwned: string[] = []
): Promise<User> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();

    db.run(
      `INSERT INTO users (id, name, email, characters_owned) VALUES (?, ?, ?, ?)`,
      [id, name, email, JSON.stringify(charactersOwned)],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          id,
          name,
          email,
          characters_owned: charactersOwned,
        });
      }
    );
  });
};

async function main() {
    try {
        await createUsersTable();
        console.log("Database process complete!");
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        db.close();
    }
}

main();
