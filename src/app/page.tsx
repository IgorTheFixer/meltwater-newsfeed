import { NewsPage } from "@/components/NewsPage";
import { getPublishedStories } from "@/lib/news-store";

export default async function Home() {
  const stories = await getPublishedStories();

  console.log("PUBLISHED STORY COUNT:", stories.length);
  console.log("FIRST PUBLISHED STORY:", stories[0]);

  return (
    <NewsPage
      stories={stories}
      isDemo={false}
    />
  );
}