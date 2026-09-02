export type NewsType =
  | "article"
  | "social"
  | "repost"
  | "audio"
  | "video";

export type NewsStory = {
  id: string;
  externalId: string;

  title: string;
  originalTitle?: string;
  titleEdited?: boolean;

  description?: string;
  mentionContext?: string;

  url: string;
  image?: string;

  source: string;
  sourceDomain?: string;

  author?: string;
  authorHandle?: string;

  publishedAt: string;

  type: NewsType;
  origin?: "drupal" | "meltwater";

  reach?: number;
  engagement?: number;

  sentiment?: string;

  isLoyolaOwned: boolean;
  possibleDuplicate?: boolean;
  isNew?: boolean;

  published: boolean;
  publishedEdited?: boolean;
};

export type ImportSummary = {
  total: number;
  articles: number;
  social: number;
  reposts: number;
  audio: number;
  video: number;
  loyolaOwned: number;
  hiddenByDefault: number;
  possibleDuplicates: number;
};