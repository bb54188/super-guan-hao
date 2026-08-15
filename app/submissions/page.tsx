/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useEffect, useState } from "react";

type Category = "all" | "photo" | "video" | "story";
type Submission = {
  id: string;
  category: Exclude<Category, "all">;
  title: string;
  description: string;
  submitter: string;
  createdAt: string;
  approvedAt?: string;
  sourceUrl?: string;
  mediaType?: string;
  mediaName?: string;
  mediaUrl?: string;
};

const categories: Array<{ value: Category; label: string }> = [
  { value: "all", label: "全部" },
  { value: "photo", label: "图片" },
  { value: "video", label: "视频" },
  { value: "story", label: "事迹" },
];

const categoryLabel = { photo: "图片", video: "视频", story: "事迹" };

export default function SubmissionsPage() {
  const [category, setCategory] = useState<Category>("all");
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = category === "all" ? "" : `?category=${category}`;
    fetch(`/api/submissions${query}`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as { submissions?: Submission[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "投稿区加载失败");
        setItems(result.submissions ?? []);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "投稿区加载失败");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [category]);

  return (
    <main className="community-page community-archive-page">
      <nav className="community-nav" aria-label="投稿区导航">
        <a className="brand" href="/">
          <span className="brand-mark">GH</span>
          <span className="brand-copy">超级大关昊<small>COMMUNITY ARCHIVE</small></span>
        </a>
        <div><a href="/submit">我要投稿</a><a href="/">返回首页</a></div>
      </nav>

      <header className="community-hero archive-hero">
        <p className="section-kicker">APPROVED SUBMISSIONS · 审核发布</p>
        <h1>校园投稿区。</h1>
        <p>这里仅展示已经通过管理员审核的图片、视频和事迹，并注明投稿人。</p>
        <a className="archive-submit-link" href="/submit">提交新内容 <span aria-hidden="true">↗</span></a>
      </header>

      <section className="community-archive" aria-labelledby="archive-title">
        <header>
          <div>
            <p className="section-kicker">ONE-CLICK FILTER</p>
            <h2 id="archive-title">一键分类浏览。</h2>
          </div>
          <div className="archive-filters" role="group" aria-label="投稿分类筛选">
            {categories.map((item) => (
              <button
                key={item.value}
                className={category === item.value ? "is-active" : ""}
                onClick={() => {
                  if (item.value === category) return;
                  setLoading(true);
                  setError("");
                  setCategory(item.value);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {loading && <p className="archive-message">正在读取投稿档案……</p>}
        {error && <p className="archive-message archive-error">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="archive-empty">
            <span>ARCHIVE OPEN</span>
            <strong>这个分类还没有通过审核的投稿。</strong>
            <a href="/submit">成为第一位投稿人 ↗</a>
          </div>
        )}

        <div className="archive-grid">
          {items.map((item, index) => (
            <article className="community-card" key={item.id}>
              {item.mediaUrl && item.mediaType?.startsWith("image/") && (
                <a className="community-card-media" href={item.mediaUrl} target="_blank" rel="noreferrer">
                  <img src={item.mediaUrl} alt={item.title} loading={index > 2 ? "lazy" : "eager"} />
                </a>
              )}
              {item.mediaUrl && item.mediaType?.startsWith("video/") && (
                <div className="community-card-media">
                  <video controls preload="metadata" src={item.mediaUrl} aria-label={item.title} />
                </div>
              )}
              <div className="community-card-copy">
                <div className="community-card-meta">
                  <span>{categoryLabel[item.category]}</span>
                  <time dateTime={item.approvedAt ?? item.createdAt}>
                    {new Date(item.approvedAt ?? item.createdAt).toLocaleDateString("zh-CN")}
                  </time>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <footer>
                  <strong>投稿人 · {item.submitter}</strong>
                  {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer">素材来源 ↗</a>}
                </footer>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="community-footer">
        <a href="/submit">我要投稿 ↗</a>
        <p>部分照片由千秋雯提供</p>
      </footer>
    </main>
  );
}
