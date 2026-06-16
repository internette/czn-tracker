import axios from "axios";
import * as cheerio from "cheerio";
import { generateUid } from "../generateUid";

export interface CharacterScrapeResult {
    uid: string;
    id: string;
    name: string;
    rarity?: number;
    class?: string;
    attribute?: string;
    faction?: string;

    imageUrl?: string;

    bestEquipment: void | Gear[];
    bestMemoryFragments?: void | BestSets;
    bestPartner: void | Partner;
    bestTeammates: void | Teammate[];
    bestChaosZones: string[];

    sourceUrl: string;
    updatedAt: string;
}

interface Gear {
    type: string;
    name: string;
    url: string;
    img: string;
}

interface Teammate {
    role: string;
    name: string;
    url: string;
}

interface Partner {
    name: string;
    uid: string;
}

interface MemoryFragmentSet {
    name: string;
    id: string;
}

interface BestSets {
    fourPieceSet: MemoryFragmentSet;
    twoPieceSet: MemoryFragmentSet;
}


async function getTeamAndBuildUrl(url:string): Promise<string> {
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }
    });
    const $ = cheerio.load(data);
    const teamAndBuildUrl = $("a.a-link").filter((_, el) =>
            $(el).text().trim().includes("Team and Build")
        ).first().attr("href");

    if (!teamAndBuildUrl) {
        throw new Error("Team and Build URL not found");
    }

    return teamAndBuildUrl.startsWith("http")
        ? teamAndBuildUrl
        : `https://game8.co${teamAndBuildUrl}`;

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

function getTableAfterHeading($: cheerio.CheerioAPI, headingText: string, excludeHeader: string): cheerio.Cheerio<Element> | null {

  const normalize = (str: string) => str.trim().toLowerCase();

  const needleHeading = normalize(headingText);
  const needleHeader = normalize(excludeHeader);

  let foundHeading = false;
  let result = null;

  $("body").find("h3, table").each((_, el) => {
    if (result) return false;

    const tag = $(el).prop("tagName")?.toLowerCase();

    if (tag === "h3") {
      foundHeading = normalize($(el).text().trim().toLowerCase()).includes(needleHeading);
      return;
    }

    if (foundHeading && tag === "table") {
      const hasExcluded = $(el)
        .find("th")
        .toArray()
        .some((th) => normalize($(th).text()).includes(needleHeader));

      if (!hasExcluded) result = $(el);
    }
  });

  return result;
}

function getBestTeam($: cheerio.CheerioAPI): Teammate[] | void {
    let teamTable = getTableByChildText(["DPS", "Support"], $, "any")[0];
    const tableRows = $(teamTable).find("tr");
    if(tableRows){
        const tableHeaders = tableRows.first().find("th");
        const tableData = tableRows.eq(1).find("td");
        const teammates = Array.prototype.map.call(tableHeaders, (elm, index: number)=> {
            const teammateRole = $(elm).text().trim();
            const teammateElement = tableData.eq(index);
            const teammateLinkElm = teammateElement.find("a");
            const teammateName = teammateLinkElm.text().trim();
            const teammateUrl = teammateLinkElm.attr("href");
            return {
                role: teammateRole,
                name: teammateName,
                url: teammateUrl
            }
        }) as Teammate[];
        return teammates;
    } else {
        return console.warn("No team table found with 'Sub DPS' or 'Support' header");
    }
}

function getEquipment($: cheerio.CheerioAPI):Gear[] | void {
    const equipmentTable = getTableByChildText(["Weapon", "Armor", "Accessory"], $, "all")[0];
    const tableRows = $(equipmentTable).find("tr");
    if(tableRows){
        const tableHeaders = tableRows.first().find("th");
        const tableData = tableRows.eq(1).find("td");
        const gears = Array.prototype.map.call(tableHeaders, (elm, index: number)=> {
            const gearType = $(elm).text().trim();
            const gearElement = tableData.eq(index);
            const gearLinkElm = gearElement.find("a");
            const gearName = gearLinkElm.text().trim();
            const gearUrl = gearLinkElm.attr("href");
            const gearImg = gearElement.find("img").attr("src");
            return {
                type: gearType,
                name: gearName,
                url: gearUrl,
                img: gearImg
            }
        }) as Gear[];
        return gears;
    } else {
        return console.warn("Equipment table not found");
    }
}

function getPartner($: cheerio.CheerioAPI): Partner | void {
    const partnerTable = getTableByChildText(["Partner", "Details"], $, "all")[0];
    const tableRows = $(partnerTable).find("tr");
    if(tableRows){
        const tableData = tableRows.eq(1).find("td").first();
        const partnerLinkElm = tableData.find("a");
        const partnerName = partnerLinkElm.text().trim();
        const partnerUid = generateUid(partnerName);
        return {
            name: partnerName,
            uid: partnerUid
        }
    }
}

function getMemoryFragments($: cheerio.CheerioAPI): BestSets | void {
    const mfTable = getTableAfterHeading($, "Best Memory Fragments", "Click on a Link to Jump to a Section!");
    if(mfTable){
        const mfsSets = mfTable.find("tr").eq(0).find("td");
        const fourPieceSet:MemoryFragmentSet = mfsSets.eq(0).map((_, el) => {
            const setName = $(el).find("a").text().trim();
            const setId = generateUid(setName);
            return {
                name: setName,
                id: setId
            }
        })[0];
        const twoPieceSet:MemoryFragmentSet = mfsSets.eq(1).map((_, el) => {
            const setName = $(el).find("a").text().trim();
            const setId = generateUid(setName);
            return {
                name: setName,
                id: setId
            }
        })[0];
        const mfs:BestSets = {
            fourPieceSet,
            twoPieceSet
        };
        return mfs;
    }
}

export async function scrapeCharacter(
    url: string
): Promise<CharacterScrapeResult> {
    const teamAndBuildUrl = await getTeamAndBuildUrl(url);
    const { data } = await axios.get(teamAndBuildUrl, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }
    });

    const $ = cheerio.load(data);

    const name =
        $("h1.p-archiveHeader__title")
            .first()
            .text()
            .replace("Best Team and Build", "")
            .trim();

    const uid = generateUid(name);
    const teammates = getBestTeam($);
    const equipment = getEquipment($);
    const partner = getPartner($);
    const memoryFragments = getMemoryFragments($);

    return {
        uid,
        id: uid,
        name,
        bestEquipment: equipment,
        bestPartner: partner,
        bestTeammates: teammates,
        bestMemoryFragments: memoryFragments,
        bestChaosZones: [],
        sourceUrl: url,
        updatedAt: new Date().toISOString()
    };
}

export default scrapeCharacter;