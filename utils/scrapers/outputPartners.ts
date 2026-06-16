import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { scrapeAllPartners } from "./allPartners";

export async function runPartnerScraper() {
    const [partners] = await Promise.all([
        scrapeAllPartners(),
    ]);

    const output = {
        partners,
        scrapedAt: new Date().toISOString(),
    };

    await mkdir("data", { recursive: true });

    await writeFile(
        path.join("data", "partners.json"),
        JSON.stringify(partners, null, 2)
    );

    return output;
}
runPartnerScraper();