import type { NewsStory } from "@/lib/types";
import { StoryCard } from "./StoryCard";

type NewsPageProps = {
  stories: NewsStory[];
  isDemo?: boolean;
};

export function NewsPage({ stories, isDemo = false }: NewsPageProps) {
  const loyolaStories = stories.filter(
    (story) => story.origin === "drupal"
  );

  const mediaStories = stories.filter(
    (story) => story.origin !== "drupal"
  );

  const loyolaPinned = loyolaStories.slice(0, 6);

  const [featured, ...rest] = mediaStories;

  return (
    <main>
      <header className="masthead">
        <div className="shell masthead__inner">
          <a className="brand" href="#top" aria-label="Newsroom home">
            <span className="brand__mark" aria-hidden="true"></span>
            <span>Loyola University New Orleans</span>
          </a>
            <nav className="masthead__nav" aria-label="News sections">
            <a className="masthead__link" href="#loyola-news">
              Loyola News
            </a>

            <a className="masthead__link" href="#coverage">
              Media Coverage
            </a>
          </nav>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="shell hero__grid">
          <div>
            <p className="eyebrow">News &amp; media</p>
            <h1>In the News</h1>
          </div>
          <div className="hero__intro">
            <p>
              Recent media coverage, expert commentary, and stories making an
              impact beyond our community.
            </p>
            {isDemo && (
              <span className="demo-badge">Preview data</span>
            )}
          </div>
        </div>
      </section>
<section className="coverage" id="coverage">
  <div className="shell">
    {featured ? (
      <>
        <div className="section-heading">
          <p className="eyebrow">Latest coverage</p>

          <p className="section-heading__count">
            {mediaStories.length}{" "}
            {mediaStories.length === 1 ? "story" : "stories"}
          </p>
        </div>

        <StoryCard story={featured} featured />
      </>
    ) : (
      <div className="empty-state">
        <p className="eyebrow">Media coverage</p>
        <h2>No stories are available right now.</h2>
        <p>Check back soon for the latest coverage.</p>
      </div>
    )}
  </div>
</section>

{loyolaPinned.length > 0 && (
  <section className="coverage" id="loyola-news">
    <div className="shell">
      <div className="section-heading">
        <p className="eyebrow">Latest from Loyola</p>

        <p className="section-heading__count">
          {loyolaPinned.length} Loyola News stories
        </p>
      </div>

      <div className="story-grid">
        {loyolaPinned.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
          />
        ))}
      </div>
    </div>
  </section>
)}

{rest.length > 0 && (
  <section className="coverage">
    <div className="shell">
      <div className="section-heading">
        <p className="eyebrow">More media coverage</p>

        <p className="section-heading__count">
          {rest.length}{" "}
          {rest.length === 1 ? "story" : "stories"}
        </p>
      </div>

      <div className="story-grid">
        {rest.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
          />
        ))}
      </div>
    </div>
  </section>
)}

      <footer className="footer">
        <div className="shell footer__inner">
          <p>
            Loyola News powered by Drupal. Media coverage powered by Meltwater.
          </p>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
