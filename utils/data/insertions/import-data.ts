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

    // 1. Partners Table
    await dbRun(`
        CREATE TABLE IF NOT EXISTS partners (
            uid TEXT PRIMARY KEY,
            name TEXT,
            img TEXT,
            class TEXT,
            rarity TEXT,
            ep_cost TEXT,
            attack TEXT,
            defense TEXT,
            health TEXT,
            passive_name TEXT,
            passive_description TEXT,
            ego_skill_name TEXT,
            ego_skill_img TEXT,
            ego_skill_details TEXT,
            source_url TEXT,
            updated_at TEXT
        )
    `);

    // 2. Characters Table
    await dbRun(`
        CREATE TABLE IF NOT EXISTS characters (
            uid TEXT PRIMARY KEY,
            id TEXT,
            name TEXT,
            best_partner_uid TEXT,
            best_partner_name TEXT,
            memory_fragment_4pc_name TEXT,
            memory_fragment_4pc_id TEXT,
            memory_fragment_2pc_name TEXT,
            memory_fragment_2pc_id TEXT,
            source_url TEXT,
            updated_at TEXT
        )
    `);

    // 3. Character Best Equipment Table (Many-to-One with Characters)
    await dbRun(`
        CREATE TABLE IF NOT EXISTS character_equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character_uid TEXT,
            type TEXT,
            name TEXT,
            url TEXT,
            img TEXT,
            FOREIGN KEY(character_uid) REFERENCES characters(uid) ON DELETE CASCADE
        )
    `);

    // 4. Character Best Teammates Table (Many-to-One with Characters)
    await dbRun(`
        CREATE TABLE IF NOT EXISTS character_teammates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character_uid TEXT,
            role TEXT,
            name TEXT,
            url TEXT,
            FOREIGN KEY(character_uid) REFERENCES characters(uid) ON DELETE CASCADE
        )
    `);

    // 5. Character Best Chaos Zones Table (Many-to-One with Characters)
    await dbRun(`
        CREATE TABLE IF NOT EXISTS character_chaos_zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character_uid TEXT,
            zone_name TEXT,
            FOREIGN KEY(character_uid) REFERENCES characters(uid) ON DELETE CASCADE
        )
    `);
}

async function insertPartners() {
    console.log("Reading and inserting partners data...");
    const partnersJsonPath = path.resolve(__dirname, '../partners.json');
    const rawData = fs.readFileSync(partnersJsonPath, 'utf8');
    const partners = JSON.parse(rawData);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO partners (
                    uid, name, img, class, rarity, ep_cost, attack, defense, health,
                    passive_name, passive_description, ego_skill_name, ego_skill_img, ego_skill_details,
                    source_url, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const partner of partners) {
                stmt.run([
                    partner.uid,
                    partner.name,
                    partner.img || null,
                    partner.class ? partner.class.trim() : null,
                    partner.rarity,
                    partner.epCost,
                    partner.attack,
                    partner.defense,
                    partner.health,
                    partner.passive ? partner.passive.name : null,
                    partner.passive ? partner.passive.description : null,
                    partner.egoSkill ? partner.egoSkill.name : null,
                    partner.egoSkill ? partner.egoSkill.img : null,
                    partner.egoSkill ? partner.egoSkill.details : null,
                    partner.sourceUrl,
                    partner.updatedAt
                ]);
            }

            stmt.finalize((err) => {
                if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                } else {
                    db.run("COMMIT");
                    console.log(`Successfully inserted/updated ${partners.length} partners.`);
                    resolve();
                }
            });
        });
    });
}

async function insertCharacters() {
    console.log("Reading and inserting characters data...");
    const charactersJsonPath = path.resolve(__dirname, '../characters.json');
    const rawData = fs.readFileSync(charactersJsonPath, 'utf8');
    const characters = JSON.parse(rawData);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const stmtChar = db.prepare(`
                INSERT OR REPLACE INTO characters (
                    uid, id, name, best_partner_uid, best_partner_name,
                    memory_fragment_4pc_name, memory_fragment_4pc_id,
                    memory_fragment_2pc_name, memory_fragment_2pc_id,
                    source_url, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const stmtEquip = db.prepare(`
                INSERT INTO character_equipment (character_uid, type, name, url, img)
                VALUES (?, ?, ?, ?, ?)
            `);

            const stmtTeam = db.prepare(`
                INSERT INTO character_teammates (character_uid, role, name, url)
                VALUES (?, ?, ?, ?)
            `);

            const stmtZone = db.prepare(`
                INSERT INTO character_chaos_zones (character_uid, zone_name)
                VALUES (?, ?)
            `);

            for (const char of characters) {
                const bp = char.bestPartner || {};
                const mf = char.bestMemoryFragments || {};
                const mf4 = mf.fourPieceSet || {};
                const mf2 = mf.twoPieceSet || {};

                stmtChar.run([
                    char.uid,
                    char.id,
                    char.name,
                    bp.uid || null,
                    bp.name || null,
                    mf4.name || null,
                    mf4.id || null,
                    mf2.name || null,
                    mf2.id || null,
                    char.sourceUrl,
                    char.updatedAt
                ]);

                // Clear previous relational details to handle idempotency updates cleanly
                db.run(`DELETE FROM character_equipment WHERE character_uid = ?`, [char.uid]);
                db.run(`DELETE FROM character_teammates WHERE character_uid = ?`, [char.uid]);
                db.run(`DELETE FROM character_chaos_zones WHERE character_uid = ?`, [char.uid]);

                if (Array.isArray(char.bestEquipment)) {
                    for (const item of char.bestEquipment) {
                        stmtEquip.run([char.uid, item.type, item.name, item.url, item.img]);
                    }
                }

                if (Array.isArray(char.bestTeammates)) {
                    for (const tm of char.bestTeammates) {
                        stmtTeam.run([char.uid, tm.role, tm.name, tm.url]);
                    }
                }

                if (Array.isArray(char.bestChaosZones)) {
                    for (const zone of char.bestChaosZones) {
                        stmtZone.run([char.uid, zone]);
                    }
                }
            }

            stmtChar.finalize();
            stmtEquip.finalize();
            stmtTeam.finalize();
            stmtZone.finalize((err) => {
                if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                } else {
                    db.run("COMMIT");
                    console.log(`Successfully inserted/updated ${characters.length} characters and sub-tables.`);
                    resolve();
                }
            });
        });
    });
}

async function main() {
    try {
        await setupDatabase();
        await insertPartners();
        await insertCharacters();
        console.log("Database process complete!");
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        db.close();
    }
}

main();