import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { scrapeAllCharacters } from "./allCharacters";

export async function runCharacterScraper() {
    const [characters] = await Promise.all([
        scrapeAllCharacters()
    ]);

    const output = {
        characters,
        scrapedAt: new Date().toISOString(),
    };

    await mkdir("data", { recursive: true });

    await writeFile(
        path.join("data", "characters.json"),
        JSON.stringify(characters, null, 2)
    );

    return output;
}
runCharacterScraper();