import type { NewsStory } from "@/lib/types";
import { formatStoryDate } from "@/lib/date";
import { ArrowIcon } from "./ArrowIcon";

type StoryCardProps = {
  story: NewsStory;
  featured?: boolean;
};

export function StoryCard({ story, featured = false }: StoryCardProps) {
  const date = formatStoryDate(story.publishedAt);

  return (
    <article className={featured ? "story story--featured" : "story"}>
      <div className="story__meta">

        {story.source && <span>{story.source}</span>}
        {story.source && date && <span className="story__dot" aria-hidden="true" />}
        {date && story.publishedAt && (
          <time dateTime={story.publishedAt}>{date}</time>
        )}
      </div>

      <h2 className="story__title">
        <a href={story.url} target="_blank" rel="noreferrer">
          {story.title}
        </a>
      </h2>

      {story.description && (
        <p className="story__description">{story.description}</p>
      )}

      <a
        className="story__link"
        href={story.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Read ${story.title}`}
      >
        Read coverage <ArrowIcon />
      </a>
    </article>
  );
}
