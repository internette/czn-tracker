import axios from "axios";
import * as cheerio from "cheerio";

import {
    scrapeCharacter,
    CharacterScrapeResult,
} from "./character";

const CHARACTER_LIST_URL =
    "https://game8.co/games/Chaos-Zero-Nightmare/archives/558441";

function getCharactersTierTable($: cheerio.CheerioAPI) {
    const h3 = $("h3")
        .filter((_, el) =>
            $(el).text().trim().includes("All Characters Tier List")
        )
        .first();

    if (!h3.length) {
        throw new Error("Could not find 'All Characters Tier List' h3");
    }

    // Find the next table after the h3 (skipping non-table nodes)
    const table = h3.nextAll("table").first();

    if (!table.length) {
        throw new Error("No table found after 'All Characters Tier List'");
    }

    return table;
}

export async function getCharacterUrls(): Promise<string[]> {
    const { data } = await axios.get(CHARACTER_LIST_URL, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
    });

    const $ = cheerio.load(data);

    const urls = new Set<string>();

    const tierTable = getCharactersTierTable($);
    
    tierTable.find("a.a-link").each((_, el) => {
        const href = $(el).attr("href");

        if (!href) {
            return;
        }

        const absolute = href.startsWith("http")
            ? href
            : `https://game8.co${href}`;

        // must be correct archive namespace
        const isValidArchive =
            absolute.startsWith(
                "https://game8.co/games/Chaos-Zero-Nightmare/archives/"
            );
        // must contain image child with required classes
        const hasValidImg =
            $(el)
                .find("img.a-img")
                .length > 0;
        if (isValidArchive && hasValidImg) {
            urls.add(absolute);
        }
    });

    return [...urls];
}

export async function scrapeAllCharacters(): Promise<
    CharacterScrapeResult[]
> {
    const urls = await getCharacterUrls();
    // console.log(urls);
    const results = await Promise.all(
        urls.map((url) => {
            return scrapeCharacter(url);
        })
    );

    return results;
}

export default scrapeAllCharacters;