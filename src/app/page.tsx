import { NewsPage } from "@/components/NewsPage";
import { getMeltwaterStories } from "@/lib/meltwater";
import { mockStories } from "@/lib/mock-stories";

export default async function Home() {
  try {
    const stories = await getMeltwaterStories();
    return <NewsPage stories={stories} isDemo={process.env.USE_MOCK_DATA === "true"} />;
  } catch (error) {
    console.error("Unable to load Meltwater feed:", error);

    // Development-friendly fallback: the page remains testable even if the
    // remote feed is unavailable. A production project can replace this with
    // an explicit error state if preferred.
    return <NewsPage stories={mockStories} isDemo />;
  }
}
