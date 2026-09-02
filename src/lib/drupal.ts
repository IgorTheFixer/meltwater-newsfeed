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

  relationships: {
  field_featured_image: {
    data: {
      type: string;
      id: string;
    } | null;
  };
};
};

type DrupalIncludedFile = {
  type: "file--file";
  id: string;

  attributes: {
    filename: string;

    uri: {
      url: string;
    };
  };
};

type DrupalNewsResponse = {
  data: DrupalNewsNode[];
  included?: DrupalIncludedFile[];
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
  url.searchParams.set(
  "include",
  "field_featured_image"
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

  return data.data.map((node) => {
  const imageId =
    node.relationships.field_featured_image.data?.id;

  const imageFile = data.included?.find(
    (file) => file.id === imageId
  );

  const imagePath =
    imageFile?.attributes.uri.url;

  const image = imagePath
    ? imagePath.startsWith("http")
      ? imagePath
      : `${DRUPAL_BASE_URL}${imagePath}`
    : undefined;

  return {
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

    image,

    source: "Loyola University New Orleans",
    sourceDomain: "loyno.edu",

    publishedAt: node.attributes.created,

    type: "article" as const,
    origin: "drupal" as const,

    isLoyolaOwned: true,
    published: true,
  };
});
}