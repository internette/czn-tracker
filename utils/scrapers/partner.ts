import axios from "axios";
import * as cheerio from "cheerio";
import { generateUid } from "../generateUid";

export interface PartnerScrapeResult {
    uid: string;
    id: string;

    name: string;
    rarity?: number;
    class?: string;

    epCost?: number;

    stats: {
        attack: number;
        defense: number;
        health: number;
    };

    passive?: {
        name: string;
        description: string;
    };

    egoSkill?: {
        name: string;
        description: string;
    };

    recommendedCharacters: string[];

    imageUrl?: string;

    sourceUrl: string;
    updatedAt: string;
}

function getTableByChildText(texts: string[], $: cheerio.CheerioAPI, mode: "any" | "all" = "any") {
  const normalize = (str: string) => str.trim().toLowerCase();

  const needles = texts.map(normalize);

  const tables = [...$("table")];

  return tables.filter((table) => {
    const cellTexts = [...$(table).find("td, th")].map((cell) =>
      normalize($(cell).text())
    );

    const matches = (needle: string) =>
      cellTexts.some((cellText) => cellText.includes(needle)
      );

    return mode === "all" ? needles.every(matches) : needles.some(matches);
  });
}

function getPartnerData($: cheerio.CheerioAPI){
    const partnerTable = getTableByChildText(["Class", "Rarity", "EP Cost", "Attack", "Defense", "Health"], $, "all");
    const partnerTableRows = $(partnerTable).find("tr");
    const partnerImg = partnerTableRows.eq(0).find("td").find("img").attr("src");
    const partnerClass = partnerTableRows.eq(1).find("a").text();
    const partnerRarity = partnerTableRows.eq(3).find("td").first().text();
    const partnerEPCost = partnerTableRows.eq(3).find("td").last().text();
    const partnerAtk =  partnerTableRows.eq(5).find("td").eq(0).text();
    const partnerDef =  partnerTableRows.eq(5).find("td").eq(1).text();
    const partnerHealth =  partnerTableRows.eq(5).find("td").eq(2).text();
    const passive = {
        name: partnerTableRows.eq(6).find("th").text().replace("Passive: ", ""),
        description: partnerTableRows.eq(7).find("td").text()
    };
    const egoSkillRow = partnerTableRows.eq(9);
    const egoSkillInfo = egoSkillRow.find("th").first();
    const egoSkill = {
        name: egoSkillInfo.find("a").text().trim(),
        img: egoSkillInfo.find("img").attr("src"),
        details: egoSkillRow.find("td").first().text()
    }

    return {
        img: partnerImg,
        class: partnerClass,
        rarity: partnerRarity,
        epCost: partnerEPCost,
        attack: partnerAtk,
        defense: partnerDef,
        health: partnerHealth,
        passive,
        egoSkill
    }

}

export async function scrapePartner(url: string) {
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                "Accept-Language": "en-US,en;q=0.9",
        },
    });

    const $ = cheerio.load(data);

    const name =
        $("h1.p-archiveHeader__title")
            .first()
            .text()
            .replace("Partner Effect and Best Combatant", "")
            .trim();
    const uid = generateUid(name);
    const partnerDetails = getPartnerData($);

    

    return {
        name,
        uid,
        ...partnerDetails,
        sourceUrl: url,
        updatedAt: new Date().toISOString(),
    };
}