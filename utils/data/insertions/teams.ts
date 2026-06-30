import fs from 'fs';
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

// Helper function to handle async DB queries sequentially
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
        CREATE TABLE IF NOT EXISTS teams (
            uid TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            character_ids TEXT NOT NULL,
            decks_ids TEXT NOT NULL,
            created_date TEXT NOT NULL,
            created_by TEXT NOT NULL
        )
    `);

    await dbRun(`
        ALTER TABLE teams ADD COLUMN created_by TEXT NOT NULL DEFAULT ''
    `).catch(() => {});

    await dbRun(`
        ALTER TABLE teams ADD COLUMN decks_ids TEXT NOT NULL DEFAULT ''
    `).catch(() => {});

    console.log("Teams table created");
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