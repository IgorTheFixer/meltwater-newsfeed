const DRUPAL_BASE_URL = "https://www.loyno.edu";

type DrupalNewsNode = {
  id: string;

  attributes: {
    title: string;
    created: string;

    path: {
      alias: string | null;
    };

    body: {
      value: string;
      processed: string;
      summary: string;
    } | null;

    field_subhead: string | null;
  };
};

type DrupalNewsResponse = {
  data: DrupalNewsNode[];
};

export async function getDrupalNews() {
  const url = new URL(
    "/jsonapi/node/news",
    DRUPAL_BASE_URL
  );

  url.searchParams.set(
    "filter[status]",
    "1"
  );

  url.searchParams.set(
    "sort",
    "-created"
  );

  url.searchParams.set(
    "page[limit]",
    "5"
  );

  const response = await fetch(
    url.toString(),
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Drupal request failed: ${response.status}`
    );
  }

  const data =
    (await response.json()) as DrupalNewsResponse;

  return data.data.map((node) => ({
  id: node.id,
  externalId: node.id,

  title: node.attributes.title,
  originalTitle: node.attributes.title,

  description:
    node.attributes.field_subhead ||
    node.attributes.body?.summary ||
    undefined,

  url: node.attributes.path.alias
    ? `${DRUPAL_BASE_URL}${node.attributes.path.alias}`
    : DRUPAL_BASE_URL,

  source: "Loyola University New Orleans",
  sourceDomain: "loyno.edu",

  publishedAt: node.attributes.created,

  type: "article" as const,
  origin: "drupal" as const,

  isLoyolaOwned: true,
  published: true,
}));
}