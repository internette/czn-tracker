import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3Verbose = sqlite3.verbose();

const dbPath = path.resolve(__dirname, '../../../data/czn-tracker.db');
const db = new sqlite3Verbose.Database(dbPath);

const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

async function setupDatabase() {
    console.log("Setting up database tables...");

    await dbRun(`
        CREATE TABLE IF NOT EXISTS decks (
            uid TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL DEFAULT '',
            character_uid TEXT NOT NULL DEFAULT '',
            card_ids TEXT NOT NULL DEFAULT '[]',
            created_by TEXT NOT NULL DEFAULT '',
            created_date TEXT NOT NULL DEFAULT ''
        )
    `);

    console.log("Decks table created");
}

async function main() {
    try {
        await setupDatabase();
        console.log("Database process complete!");
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        db.close();
    }
}

main();
