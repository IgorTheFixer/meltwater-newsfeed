import { NextResponse } from "next/server";

import { get, put } from "@vercel/blob";

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
    const body = await request.json();

    const incomingStories =
      body.stories as NewsStory[];

    if (!Array.isArray(incomingStories)) {
      return NextResponse.json(
        {
          error: "Invalid coverage data.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * First, try to load the stories that
     * have already been published.
     */
    let existingStories: NewsStory[] = [];

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
        }
      }
    } catch {
      /*
       * If news.json doesn't exist yet,
       * that's okay. This just means this
       * is the first publish.
       */
      existingStories = [];
    }

    /*
     * Put all existing stories into a Map.
     *
     * Meltwater's Document ID becomes
     * externalId, so it is our duplicate key.
     */
    const storyMap = new Map<
      string,
      NewsStory
    >();

    for (const story of existingStories) {
      storyMap.set(
        story.externalId || story.id,
        story
      );
    }

    /*
     * Now process today's upload.
     */
    for (const incomingStory of incomingStories) {
      const key =
        incomingStory.externalId ||
        incomingStory.id;

      const existingStory =
        storyMap.get(key);

      if (existingStory) {
  /*
   * This story already exists.
   *
   * Refresh Meltwater's information,
   * but preserve the editor's title
   * and Included/Hidden decision.
   */
  const titleWasEdited =
    incomingStory.titleEdited ||
    existingStory.titleEdited;

  storyMap.set(key, {
    ...existingStory,
    ...incomingStory,

    title: incomingStory.titleEdited
      ? incomingStory.title
      : existingStory.titleEdited
        ? existingStory.title
        : incomingStory.title,

    titleEdited: titleWasEdited,

    published: incomingStory.publishedEdited
  ? incomingStory.published
  : existingStory.publishedEdited
    ? existingStory.published
    : incomingStory.published,

publishedEdited:
  incomingStory.publishedEdited ||
  existingStory.publishedEdited,
  });
      } else {
        /*
         * Brand-new Meltwater story.
         */
        storyMap.set(
          key,
          incomingStory
        );
      }
    }

    const mergedStories =
      Array.from(storyMap.values());

    const payload = {
      updatedAt:
        new Date().toISOString(),

      stories: mergedStories,
    };

    const blob = await put(
      "news/news.json",
      JSON.stringify(
        payload,
        null,
        2
      ),
      {
        access: "private",

        contentType:
          "application/json",

        addRandomSuffix: false,

        allowOverwrite: true,

        cacheControlMaxAge: 60,
      }
    );

    return NextResponse.json({
      success: true,

      totalStories:
        mergedStories.length,

      newStories:
        mergedStories.length -
        existingStories.length,

      url: blob.url,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Coverage could not be published.",
      },
      {
        status: 500,
      }
    );
  }
}