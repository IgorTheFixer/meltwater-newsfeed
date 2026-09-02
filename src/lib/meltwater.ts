import Parser from "rss-parser";
import { mockStories } from "./mock-stories";

export type NewsStory = {
  id: string;
  title: string;
  url: string;
  publishedAt?: string;
  description?: string;
  source?: string;
};

type FeedItem = {
  source?: string | { _?: string; $?: { url?: string } };
  creator?: string;
  "dc:creator"?: string;
  link?: string;
};

const parser = new Parser<{}, FeedItem>({
  customFields: {
    item: ["source", "creator", "dc:creator"],
  },
});

function cleanText(value?: string) {
  if (!value) return undefined;

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function domainFromUrl(value?: string) {
  if (!value) return undefined;

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function sourceFromItem(item: FeedItem) {
  if (typeof item.source === "string") {
    return cleanText(item.source);
  }

  if (item.source && typeof item.source === "object") {
    return cleanText(item.source._) ?? domainFromUrl(item.source.$?.url);
  }

  return (
    cleanText(item.creator) ??
    cleanText(item["dc:creator"]) ??
    domainFromUrl(item.link)
  );
}

export async function getMeltwaterStories(): Promise<NewsStory[]> {
  if (process.env.USE_MOCK_DATA === "true") {
    return mockStories;
  }

  const url = process.env.MELTWATER_RSS_URL;

  if (!url) {
    throw new Error("MELTWATER_RSS_URL is not configured.");
  }

  const response = await fetch(url, {
    next: { revalidate: 900 },
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "User-Agent": "MeltwaterNews/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Meltwater request failed: ${response.status} ${response.statusText}`
    );
  }

  const xml = await response.text();
  const feed = await parser.parseString(xml);

  return feed.items
    .map((item, index) => {
      const title = cleanText(item.title) ?? "Untitled article";
      const url = item.link ?? item.guid ?? "#";
      const publishedAt = item.isoDate ?? item.pubDate;
      const description = cleanText(
        item.contentSnippet ?? item.content
      );

      return {
        id: item.guid ?? item.link ?? `${title}-${index}`,
        title,
        url,
        publishedAt,
        description,
        source: sourceFromItem(item),
      } satisfies NewsStory;
    })
    .filter((story) => story.url !== "#")
    .sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    });
}
