import * as cheerio from "cheerio";

export function getTableByChildText(texts: string[], $: cheerio.CheerioAPI, mode: "any" | "all" = "any") {
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

export function getTableAfterHeading($: cheerio.CheerioAPI, headingText: string, excludeHeader: string): cheerio.Cheerio<Element> | null {

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
