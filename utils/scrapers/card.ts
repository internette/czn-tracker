import * as cheerio from "cheerio";
import axios from "axios";
import { getTableByChildText, getTableRowByTh } from "./tools";

interface CardDetails {
    name: string
    user: string | null
    effect: string[]
    type: string
    subType: string
    apCost: string
    affinity: string
    imageUrl: string
    tags: CardTag[] | string[]
}

interface CardTag {
    tagName: string,
    effect: string
}

function getCardDetails (cardName: string, $: cheerio.CheerioAPI){
    const cardDataTable = getTableByChildText(['Effect', "Card Type", "AP Cost"], $, 'all');
    if(!cardDataTable) { return undefined };
    const ogEffect = getTableRowByTh($(cardDataTable), "Effect", $).find("td").text().trim();
    const effect = ogEffect.split('・').map(str=> str.trim()).filter(str => str.length > 0);
    const type = getTableRowByTh($(cardDataTable), "Card Type", $).find("td").text().trim();
    const apCost = getTableRowByTh($(cardDataTable), "AP Cost", $).find("td").text().trim();
    const cardDetails: CardDetails = {
        name: cardName,
        effect,
        type,
        apCost,
        user: "",
        subType: "",
        affinity: "",
        imageUrl: "",
        tags: []
    }
    const subTypeRow = getTableRowByTh($(cardDataTable), "Card Subtype", $);
    if(subTypeRow){
        const subType =  subTypeRow.find("td").text().trim();
        cardDetails.subType = subType;
    }
    const affinityRow = getTableRowByTh($(cardDataTable), "Affinity", $);
    if(affinityRow){
        const affinity =  affinityRow.find("td").text().trim();
        cardDetails.affinity = affinity;
    }
    const userRow = getTableRowByTh($(cardDataTable), "User", $);
    if(userRow){
        const user =  userRow.find("td").text().trim();
        cardDetails.user = user;
    }
    const tagsRow = getTableRowByTh($(cardDataTable), "Tags", $);
    if(tagsRow){
        const tags =  tagsRow.find("td").text().trim();
        cardDetails.tags = tags
            .split("\n")
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => {
                const parsedTag = tag.split("   ");
                return {
                    tagName: parsedTag[1],
                    effect: parsedTag[2]
                }
            });
    }
    return cardDetails;
}

export async function scrapeCard(
    url: string, cardName: string
): Promise<any> {
    try {
        const cardsData = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
            }
        });
        const $cardData = cheerio.load(cardsData.data);
        const cardDetails = getCardDetails(cardName, $cardData);
        return cardDetails;
    } catch(err){
        return {
            name: cardName,
            user: undefined,
            tags: undefined,
            effect: undefined,
            type: undefined,
            subType: undefined,
            apCost: undefined,
            affinity: undefined,
            imageUrl: undefined
        }
    }
}