import { NewsPage } from "@/components/NewsPage";
import { getPublishedStories } from "@/lib/news-store";
import { getDrupalNews } from "@/lib/drupal";

export default async function Home() {
  const drupalStories = await getDrupalNews();
  const meltwaterStories = await getPublishedStories();

  const stories = [
    ...drupalStories,
    ...meltwaterStories,
  ].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() -
      new Date(a.publishedAt).getTime()
  );

  return (
    <NewsPage
      stories={stories}
      isDemo={false}
    />
  );
}