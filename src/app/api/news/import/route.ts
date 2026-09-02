import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

import { parseMeltwaterFile } from "@/lib/meltwater-csv";
import type { NewsStory } from "@/lib/types";

export const runtime = "nodejs";

type PublishedFeed = {
  updatedAt: string;
  stories: NewsStory[];
};

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Please select a Meltwater CSV file.",
        },
        {
          status: 400,
        }
      );
    }

    const arrayBuffer =
      await file.arrayBuffer();

    const result =
      parseMeltwaterFile(arrayBuffer);

    /*
     * Load the existing published feed so
     * previously saved editorial choices
     * can appear in the preview.
     */
    let existingStories: NewsStory[] = [];
    let lastPublishedAt: string | null = null;

    try {
      const existingBlob = await get(
        "news/news.json",
        {
          access: "private",
          useCache: false,
        }
      );

      if (
        existingBlob &&
        existingBlob.statusCode === 200 &&
        existingBlob.stream
      ) {
        const text = await new Response(
          existingBlob.stream
        ).text();

        const existingData =
          JSON.parse(text) as PublishedFeed;

        if (Array.isArray(existingData.stories)) {
          existingStories =
            existingData.stories;

          lastPublishedAt =
            existingData.updatedAt || null;
        }
      }
    } catch {
      /*
       * No existing feed is fine.
       * This simply means nothing has
       * been published yet.
       */
      existingStories = [];
    }

    const existingStoryMap =
      new Map<string, NewsStory>();

    for (const story of existingStories) {
      existingStoryMap.set(
        story.externalId || story.id,
        story
      );
    }

    /*
     * Apply previously saved manual edits
     * to the newly imported CSV preview.
     */
    const stories = result.stories.map(
      (incomingStory) => {
        const key =
          incomingStory.externalId ||
          incomingStory.id;

        const existingStory =
          existingStoryMap.get(key);

        if (!existingStory) {
  return {
    ...incomingStory,
    isNew: true,
  };
}

        return {
          ...incomingStory,

          title: existingStory.titleEdited
            ? existingStory.title
            : incomingStory.title,

          titleEdited:
            existingStory.titleEdited,

          published:
            existingStory.publishedEdited
              ? existingStory.published
              : incomingStory.published,

          publishedEdited:
            existingStory.publishedEdited,
        };
      }
    );

    return NextResponse.json({
      ...result,

      stories,
      
      lastPublishedAt,

      summary: {
        ...result.summary,

        hiddenByDefault: stories.filter(
          (story) => !story.published
        ).length,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "The Meltwater file could not be processed.",
      },
      {
        status: 500,
      }
    );
  }
}