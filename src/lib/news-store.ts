import { get } from "@vercel/blob";
import type { NewsStory } from "@/lib/types";

type PublishedFeed = {
  updatedAt: string;
  stories: NewsStory[];
};

export async function getPublishedStories(): Promise<
  NewsStory[]
> {
  try {
    const result = await get(
      "news/news.json",
      {
        access: "private",
        useCache: false
      }
    );

    if (
      !result ||
      result.statusCode !== 200 ||
      !result.stream
    ) {
      return [];
    }

    const text = await new Response(
      result.stream
    ).text();

    const data =
      JSON.parse(text) as PublishedFeed;

    return data.stories
      .filter(
        (story) => story.published
      )
      .sort(
        (a, b) =>
          new Date(
            b.publishedAt
          ).getTime() -
          new Date(
            a.publishedAt
          ).getTime()
      );
  } catch (error) {
    console.error(
      "Published news could not be loaded:",
      error
    );

    return [];
  }
}