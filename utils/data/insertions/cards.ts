import fs from "fs";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

// Recreate __dirname since it's not available by default in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3Verbose = sqlite3.verbose();

// DB path
const dbPath = path.resolve(__dirname, "../../../data/czn-tracker.db");
const db = new sqlite3Verbose.Database(dbPath);

// Helper for async DB queries
const dbRun = (query: string, params: any[] = []) => {
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
        CREATE TABLE IF NOT EXISTS cards (
            uid TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            effect TEXT NOT NULL DEFAULT '',
            type TEXT NOT NULL DEFAULT '',
            ap_cost TEXT NOT NULL DEFAULT '',
            user TEXT NOT NULL DEFAULT '',
            sub_type TEXT NOT NULL DEFAULT '',
            affinity TEXT NOT NULL DEFAULT '',
            image_url TEXT NOT NULL DEFAULT '',
            tags TEXT NOT NULL DEFAULT ''
        )
    `);

    console.log("Cards table created");
}

async function insertCards() {
    console.log("Reading and inserting cards data...");

    const cardsJsonPath = path.resolve(__dirname, "../cards.json");
    const rawData = fs.readFileSync(cardsJsonPath, "utf8");
    const cards = JSON.parse(rawData);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO cards (
                    uid,
                    name,
                    effect,
                    type,
                    ap_cost,
                    user,
                    sub_type,
                    affinity,
                    image_url,
                    tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const card of cards) {
                stmt.run([
                    randomUUID(),
                    card.name ?? "",
                    JSON.stringify(card.effect ?? []),
                    card.type ?? "",
                    card.apCost ?? "",
                    card.user ?? "",
                    card.subType ?? "",
                    card.affinity ?? "",
                    card.imageUrl ?? "",
                    JSON.stringify(card.tags ?? []),
                ]);
            }

            stmt.finalize((err) => {
                if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                } else {
                    db.run("COMMIT");
                    console.log(`Successfully inserted/updated ${cards.length} cards.`);
                    resolve();
                }
            });
        });
    });
}

async function main() {
    try {
        await setupDatabase();
        await insertCards();
        console.log("Database process complete!");
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        db.close();
    }
}

main();