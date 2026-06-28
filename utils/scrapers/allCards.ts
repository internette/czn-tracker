import axios from "axios";
import * as cheerio from "cheerio";
import { getTableByChildText, runWorkerPool } from "./tools";
import { scrapeCard } from "./card";

const CARDS_LIST_URL =
    "https://game8.co/games/Chaos-Zero-Nightmare/archives/558399";

interface CardUrlAndName {
    url: string,
    name: string
}

async function getCardsUrlsAndNames(): Promise<CardUrlAndName[]> {
    const { data } = await axios.get(CARDS_LIST_URL, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "Accept-Language": "en-US,en;q=0.9",
        },
    });

    const $ = cheerio.load(data);
    const cardsUrlAndName = new Set<CardUrlAndName>();

    const cardsTable = getTableByChildText(['Card', 'Effect', 'Card Type', 'Cost'], $, 'all')[0];
    if(!cardsTable){
        throw new Error("No card table found");
    }
    $(cardsTable).find("a.a-link").each((_, el) => {
        const href = $(el).attr("href");
        const name = $(el).text();

        if (!href) return;

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
            const cardObj = {
                url: absolute,
                name
            }
            cardsUrlAndName.add(cardObj);
        }
    });

    return [...cardsUrlAndName];
}

export async function scrapeAllCards(): Promise<CardUrlAndName[]> {
    const urlsAndNames = await getCardsUrlsAndNames();

    return runWorkerPool(
        urlsAndNames,
        3, // Only 3 concurrent requests
        ({ url, name }) => scrapeCard(url, name)
    );
}

export default scrapeAllCards;