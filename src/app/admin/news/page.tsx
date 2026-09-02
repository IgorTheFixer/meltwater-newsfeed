"use client";

import {
  ChangeEvent,
  useState,
} from "react";

import type {
  ImportSummary,
  NewsStory,
} from "@/lib/types";

export default function NewsAdminPage() {
  const [file, setFile] =
    useState<File | null>(null);

  const [stories, setStories] =
    useState<NewsStory[]>([]);

  const [filter, setFilter] =
  useState<"all" | "included" | "hidden" | "new">("all");

  const [summary, setSummary] =
    useState<ImportSummary | null>(null);
  
  const [lastPublishedAt, setLastPublishedAt] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  function selectFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      event.target.files?.[0];

    if (!selected) return;

    setFile(selected);
    setStories([]);
    setSummary(null);
    setMessage("");
  }

  async function importFile() {
    if (!file) return;

    setLoading(true);
    setMessage("");

    const formData = new FormData();

    formData.append("file", file);

    try {
      const response = await fetch(
        "/api/news/import",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Import failed."
        );
      }

      setStories(data.stories);
      setSummary(data.summary);
      setLastPublishedAt(data.lastPublishedAt);

      const hasNewStories = data.stories.some(
        (story: NewsStory) => story.isNew
      );

      setFilter(hasNewStories ? "new" : "all");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Import failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleStory(id: string) {
  setStories((current) =>
    current.map((story) =>
      story.id === id
        ? {
            ...story,
            published: !story.published,
            publishedEdited: true,
          }
        : story
    )
  );
}

  function updateTitle(
    id: string,
    title: string
  ) {
    setStories((current) =>
      current.map((story) =>
        story.id === id
  ? {
      ...story,
      title,
      titleEdited: true,
    }
  : story
      )
    );
  }

  async function publishStories() {
    setPublishing(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/news/publish",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            stories,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Publish failed."
        );
      }

      setMessage(
        "Coverage feed published successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Publish failed."
      );
    } finally {
      setPublishing(false);
    }
  }

  const filteredStories = stories.filter((story) => {
  if (filter === "included") {
    return story.published;
  }

  if (filter === "hidden") {
    return !story.published;
  }

  if (filter === "new") {
    return story.isNew;
  }

  return true;
});

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "64px 24px",
      }}
    >
      <header
        style={{
          marginBottom: "48px",
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: ".12em",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          Loyola University New Orleans
        </p>

        <h1>News Feed Manager</h1>

        <p>
          Upload a Meltwater coverage export,
          review the results, and publish the
          approved stories.
        </p>

        {lastPublishedAt && (
          <p
            style={{
              color: "#6e6964",
              fontSize: "14px",
            }}
          >
            Last published:{" "}
            {new Date(lastPublishedAt).toLocaleString()}
          </p>
        )}
      </header>

      <section
        style={{
          border: "2px dashed #ccc",
          borderRadius: "16px",
          padding: "48px",
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        <input
          type="file"
          accept=".csv,text/csv,text/tab-separated-values"
          onChange={selectFile}
        />

        {file && (
          <p>
            Selected: <strong>{file.name}</strong>
          </p>
        )}

        <button
          onClick={importFile}
          disabled={!file || loading}
          style={{
            padding: "12px 24px",
            marginTop: "20px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Processing..."
            : "Process Meltwater File"}
        </button>
      </section>

      {summary && (
        <section
          style={{
            marginBottom: "40px",
          }}
        >
          <h2>Import Summary</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "16px",
            }}
          >
            <Stat
              label="Total"
              value={summary.total}
            />

            <Stat
              label="Articles"
              value={summary.articles}
            />

            <Stat
              label="Social"
              value={summary.social}
            />

            <Stat
              label="Radio"
              value={summary.audio}
            />

            <Stat
              label="TV"
              value={summary.video}
            />

            <Stat
              label="Reposts"
              value={summary.reposts}
            />

            <Stat
              label="Duplicates"
              value={
                summary.possibleDuplicates
              }
            />
          </div>
        </section>
      )}

      {stories.length > 0 && (
        <>
          <section>
            <h2>Review Coverage</h2>
            <div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "24px",
  }}
>
  {(["all", "included", "hidden", "new"] as const).map((option) => (
    <button
      key={option}
      onClick={() => setFilter(option)}
      style={{
        padding: "8px 14px",
        borderRadius: "999px",
        border: "1px solid #ccc",
        background: filter === option ? "#171513" : "#fff",
        color: filter === option ? "#fff" : "#171513",
        fontWeight: 700,
        cursor: "pointer",
        textTransform: "capitalize",
      }}
    >
      {option}{" "}
{option === "all"
  ? stories.length
  : option === "included"
    ? stories.filter((story) => story.published).length
    : option === "hidden"
      ? stories.filter((story) => !story.published).length
      : stories.filter((story) => story.isNew).length}
    </button>
  ))}
</div>
            {filteredStories.map((story) => (
              <article
                key={story.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "40px 1fr",
                  gap: "20px",
                  borderTop: "1px solid #ddd",
                  padding: "24px 0",
                  opacity: story.published
                    ? 1
                    : 0.5,
                }}
              >
                <div
  style={{
    paddingTop: "3px",
  }}
>
  <input
    type="checkbox"
    checked={story.published}
    onChange={() => toggleStory(story.id)}
    aria-label={`Include ${story.title} in news feed`}
    title={story.published ? "Included in feed" : "Hidden from feed"}
  />
</div>

                <div>
                  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "8px",
  }}
>
  <span
    style={{
      fontSize: "13px",
      textTransform: "uppercase",
      letterSpacing: ".08em",
    }}
  >
    {story.type} · {story.source}
  </span>

  <span
    style={{
      padding: "4px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 800,
      letterSpacing: ".08em",
      textTransform: "uppercase",
      background: story.published ? "#e8f2ea" : "#ece9e5",
      color: story.published ? "#245c30" : "#6e6964",
    }}
  >
    {story.published ? "Included" : "Hidden"}
  </span>
  {story.isNew && (
  <span
    style={{
      padding: "4px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 800,
      letterSpacing: ".08em",
      textTransform: "uppercase",
      background: "#fff3cd",
      color: "#7a5a00",
    }}
  >
    New
  </span>
)}
</div>

                  <input
                    value={story.title}
                    onChange={(event) =>
                      updateTitle(
                        story.id,
                        event.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      fontSize: "20px",
                      fontWeight: 700,
                      padding: "8px 0",
                      border: 0,
                      borderBottom:
                        "1px solid #ddd",
                    }}
                  />

                  {story.description && (
                    <p>
                      {story.description}
                    </p>
                  )}

                  {story.isLoyolaOwned && (
                    <strong>
                      Loyola-owned content
                    </strong>
                  )}

                  {story.possibleDuplicate && (
                    <p>
                      ⚠ Possible duplicate
                    </p>
                  )}

                  <p>
                    <a
                      href={story.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View original →
                    </a>
                  </p>
                </div>
              </article>
            ))}
          </section>

          <footer
            style={{
              position: "sticky",
              bottom: 0,
              background: "white",
              borderTop: "1px solid #ddd",
              padding: "20px 0",
              marginTop: "40px",
            }}
          >
            <button
              onClick={publishStories}
              disabled={publishing}
              style={{
                padding: "14px 28px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {publishing
                ? "Publishing..."
                : `Publish ${
                    stories.filter(
                      (story) =>
                        story.published
                    ).length
                  } Stories`}
            </button>

            {message && (
              <span
                style={{
                  marginLeft: "20px",
                }}
              >
                {message}
              </span>
            )}
          </footer>
        </>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}
    >
      <strong
        style={{
          display: "block",
          fontSize: "28px",
        }}
      >
        {value}
      </strong>

      <span>{label}</span>
    </div>
  );
}