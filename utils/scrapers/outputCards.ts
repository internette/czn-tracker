import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { scrapeAllCards } from "./allCards";

export async function runCardsScraper() {
    const [cards] = await Promise.all([
        scrapeAllCards()
    ]);
    const output = {
        cards,
        scrapedAt: new Date().toISOString(),
    };

    await mkdir("data", { recursive: true });

    await writeFile(
        path.join("data", "cards.json"),
        JSON.stringify(cards, null, 2)
    );

    return output;
}
runCardsScraper();