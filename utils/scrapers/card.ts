import * as cheerio from "cheerio";
import axios from "axios";
import { Storage } from "@google-cloud/storage";
import { getTableByChildText, getTableRowByTh } from "./tools";

const CARD_IMAGES_BUCKET = "czn-cards";

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
        if (!cardDetails) return undefined;

        const originalImageUrl = await getCardImage(url);
        if (originalImageUrl) {
            const fileName = `${cardName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
            cardDetails.imageUrl = await uploadCardImageToGCS(originalImageUrl, fileName);
        }

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

export async function getCardImage(url: string) {
    const cardsData = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }
    });
    const $ = cheerio.load(cardsData.data);
    const cardDataTable = getTableByChildText(['Effect', "Card Type", "AP Cost"], $, 'all');
    if (!cardDataTable || cardDataTable.length === 0) return undefined;
    const imgRow = $(cardDataTable).find("tr").eq(1);
    const img = imgRow.find("td").find("img");
    const imgUrl = img.attr("data-src");
    return imgUrl;
}

export async function uploadCardImageToGCS(
    originalImageUrl: string,
    destinationFileName: string
): Promise<string> {
    const response = await axios.get(originalImageUrl, {
        responseType: "arraybuffer",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }
    });
    const buffer = Buffer.from(response.data);

    const storage = new Storage();
    const bucket = storage.bucket(CARD_IMAGES_BUCKET);
    const file = bucket.file(destinationFileName);

    const contentType = typeof response.headers["content-type"] === "string"
        ? response.headers["content-type"] as string
        : "image/jpeg";

    await file.save(buffer, {
        metadata: { contentType }
    });

    const publicUrl = `https://storage.googleapis.com/${CARD_IMAGES_BUCKET}/${destinationFileName}`;
    return publicUrl;
}