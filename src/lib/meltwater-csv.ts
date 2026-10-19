import Papa from "papaparse";
import type {
  ImportSummary,
  NewsStory,
  NewsType,
} from "@/lib/types";

type MeltwaterRow = Record<string, string>;

function clean(value?: string) {
  return value?.trim() || "";
}

function numberFrom(value?: string) {
  if (!value) return undefined;

  const cleaned = value.replace(/,/g, "").trim();

  if (!cleaned) return undefined;

  const valueAsNumber = Number(cleaned);

  return Number.isNaN(valueAsNumber)
    ? undefined
    : valueAsNumber;
}

function mapType(contentType: string): NewsType {
  switch (contentType.toLowerCase()) {
    case "news article":
      return "article";

    case "social post":
      return "social";

    case "repost":
      return "repost";

    case "audio":
      return "audio";

    case "video":
      return "video";

    default:
      return "article";
  }
}

function isLoyolaOwned(
  author: string,
  handle: string
) {
  const text = `${author} ${handle}`.toLowerCase();

  const loyolaAccounts = [
    "loyola university new orleans",
    "loynolaw",
    "loyolacmm",
    "loynovate",
    "loyno",
  ];

  return loyolaAccounts.some((account) =>
    text.includes(account)
  );
}

function cleanExcerpt(value?: string) {
  if (!value) return undefined;

  return value
    .replace(/^\.\.\.\s*/, "")
    .replace(/\s*\.\.\.$/, "")
    .trim();
}

function createTitle(
  row: MeltwaterRow,
  type: NewsType
) {
  const meltwaterTitle = clean(row["Title"]);
  const author = clean(row["Author Name"]);
  const source = clean(row["Source Name"]);

  if (type === "article" && meltwaterTitle) {
    return meltwaterTitle;
  }

  if (type === "social") {
    return `${author || source || "Social media"} post`;
  }

  if (type === "repost") {
    return `${author || source || "Social media"} repost`;
  }

  if (type === "audio") {
    return `${source || "Radio"} radio mention`;
  }

  if (type === "video") {
    return `${source || "Television"} TV mention`;
  }

  return meltwaterTitle || source || "Media coverage";
}

function normalizeDate(
  date: string,
  time: string
) {
  if (!date) {
    return new Date().toISOString();
  }

  const combined = time
    ? `${date}T${time}`
    : `${date}T12:00:00`;

  const parsed = new Date(combined);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toISOString();
}

function normalizeRow(
  row: MeltwaterRow
): NewsStory | null {
  const externalId = clean(row["Document ID"]);
  const url = clean(row["URL"]);

  if (!externalId || !url) {
    return null;
  }

  const contentType = clean(row["Content Type"]);
  const type = mapType(contentType);

  const source = clean(row["Source Name"]);
  const sourceDomain = clean(row["Source Domain"]);

  const author = clean(row["Author Name"]);
  const authorHandle = clean(row["Author Handle"]);

  const loyolaOwned = isLoyolaOwned(
    author,
    authorHandle
  );

  /*
   * Our default editorial rules:
   *
   * - normal media coverage = published
   * - reposts = hidden
   * - Loyola's own posts = hidden
   *
   * Editor can change these later.
   */
  const published =
    type !== "repost" && !loyolaOwned;

  let description: string | undefined;

  if (type === "social" || type === "repost") {
    description =
      cleanExcerpt(row["Opening Text"]) ||
      cleanExcerpt(row["Hit Sentence"]);
  } else {
    description =
      cleanExcerpt(row["Opening Text"]) ||
      cleanExcerpt(row["Hit Sentence"]);
  }

  return {
    id: externalId,
    externalId,

    title: createTitle(row, type),
    originalTitle: clean(row["Title"]) || undefined,

    description,
    mentionContext:
      cleanExcerpt(row["Hit Sentence"]),

    url,
    image: clean(row["Image"]) || undefined,

    source,
    sourceDomain: sourceDomain || undefined,

    author: author || undefined,
    authorHandle: authorHandle || undefined,

    publishedAt: normalizeDate(
      clean(row["Date"]),
      clean(row["Time"])
    ),

    type,
    origin: "meltwater",

    reach: numberFrom(row["Reach"]),
    engagement: numberFrom(row["Engagement"]),

    sentiment:
      clean(row["Sentiment"]) || undefined,

    isLoyolaOwned: loyolaOwned,

    published,
  };
}

function markDuplicates(
  stories: NewsStory[]
) {
  const titleCounts = new Map<string, number>();

  for (const story of stories) {
    if (story.type !== "article") continue;

    const key = story.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    titleCounts.set(
      key,
      (titleCounts.get(key) || 0) + 1
    );
  }

  return stories.map((story) => {
    const key = story.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return {
      ...story,
      possibleDuplicate:
        story.type === "article" &&
        (titleCounts.get(key) || 0) > 1,
    };
  });
}

export function parseMeltwaterFile(
  buffer: ArrayBuffer
) {
  const bytes = new Uint8Array(buffer);

  /*
   * Meltwater exports may use UTF-16LE.
   * Detect the BOM automatically.
   */
  const isUtf16 =
    bytes.length >= 2 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xfe;

  const decoder = new TextDecoder(
    isUtf16 ? "utf-16le" : "utf-8"
  );

  const text = decoder
    .decode(bytes)
    .replace(/^\uFEFF/, "");

  /*
   * The Meltwater "CSV" export we inspected
   * uses tab-separated columns.
   */
  const parsed = Papa.parse<MeltwaterRow>(
    text,
    {
      header: true,
      delimiter: "\t",
      skipEmptyLines: true,

      transformHeader(header) {
        return header.trim();
      },
    }
  );

  const stories = markDuplicates(
    parsed.data
      .map(normalizeRow)
      .filter(
        (story): story is NewsStory =>
          story !== null
      )
  );

  const summary: ImportSummary = {
    total: stories.length,

    articles: stories.filter(
      (story) => story.type === "article"
    ).length,

    social: stories.filter(
      (story) => story.type === "social"
    ).length,

    reposts: stories.filter(
      (story) => story.type === "repost"
    ).length,

    audio: stories.filter(
      (story) => story.type === "audio"
    ).length,

    video: stories.filter(
      (story) => story.type === "video"
    ).length,

    loyolaOwned: stories.filter(
      (story) => story.isLoyolaOwned
    ).length,

    hiddenByDefault: stories.filter(
      (story) => !story.published
    ).length,

    possibleDuplicates: stories.filter(
      (story) => story.possibleDuplicate
    ).length,
  };

  return {
    stories,
    summary,
    parseErrors: parsed.errors,
  };
}