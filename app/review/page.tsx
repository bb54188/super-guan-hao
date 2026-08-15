/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type ImageSeries =
  | "wet-hair"
  | "bedside-gaming"
  | "dorm-portraits"
  | "campus-duo"
  | "quote-log"
  | "event-album"
  | "other-photo"
  | "unclassified";

type AutoClassification = {
  suggestedSeries: ImageSeries;
  confidence: number;
  summary: string;
  status: "classified" | "needs-review";
};

type PendingMedia = {
  mediaKey: string;
  mediaType: string;
  mediaName: string;
  mediaSize?: number;
};

type PendingSubmission = {
  id: string;
  category: "photo" | "video" | "story" | "series";
  title: string;
  description: string;
  submitter: string;
  contact?: string;
  sourceUrl?: string;
  createdAt: string;
  mediaKey?: string;
  mediaType?: string;
  mediaName?: string;
  mediaItems?: PendingMedia[];
  series?: ImageSeries;
  autoClassification?: AutoClassification;
};

const categoryLabel = { photo: "图片", video: "视频", story: "事迹", series: "系列" };
const imageSeriesOptions: Array<{ value: ImageSeries; label: string }> = [
  { value: "wet-hair", label: "清晨洗头" },
  { value: "bedside-gaming", label: "床铺游戏" },
  { value: "dorm-portraits", label: "床铺肖像" },
  { value: "campus-duo", label: "校园同框" },
  { value: "quote-log", label: "聊天记录" },
  { value: "event-album", label: "事件图册" },
  { value: "other-photo", label: "其他影像" },
  { value: "unclassified", label: "待整理" },
];

function imageSeriesLabel(series: ImageSeries): string {
  return imageSeriesOptions.find((item) => item.value === series)?.label ?? "待整理";
}

function isImageSeries(value: string): value is ImageSeries {
  return imageSeriesOptions.some((item) => item.value === value);
}

function submissionMedia(item: PendingSubmission): PendingMedia[] {
  if (item.mediaItems?.length) return item.mediaItems;
  if (!item.mediaKey) return [];
  return [
    {
      mediaKey: item.mediaKey,
      mediaType: item.mediaType ?? "application/octet-stream",
      mediaName: item.mediaName ?? "media",
    },
  ];
}

export default function ReviewPage() {
  const [token, setToken] = useState("");
  const [draftToken, setDraftToken] = useState("");
  const [items, setItems] = useState<PendingSubmission[]>([]);
  const [seriesSelections, setSeriesSelections] = useState<Record<string, ImageSeries>>({});
  const [message, setMessage] = useState("请输入审核口令。口令只保存在当前浏览器标签页。");
  const [loading, setLoading] = useState(false);

  async function request(path: string, currentToken: string, init?: RequestInit) {
    const response = await fetch(path, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${currentToken}`,
      },
    });
    const result = (await response.json()) as {
      submissions?: PendingSubmission[];
      message?: string;
      error?: string;
    };
    if (!response.ok) throw new Error(result.error ?? "审核请求失败");
    return result;
  }

  const load = useCallback(async (currentToken: string) => {
    if (!currentToken) return;
    setLoading(true);
    try {
      const result = await request("/api/admin/submissions", currentToken);
      const submissions = result.submissions ?? [];
      const selections: Record<string, ImageSeries> = {};
      for (const item of submissions) {
        if (item.category === "photo") {
          selections[item.id] = item.series ?? "unclassified";
        }
      }
      setItems(submissions);
      setSeriesSelections(selections);
      setMessage(result.submissions?.length ? `共有 ${result.submissions.length} 条待审核投稿。` : "目前没有待审核投稿。");
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? error.message : "审核列表加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("guan-hao-review-token") ?? "";
    if (!saved) return;
    window.setTimeout(() => {
      setToken(saved);
      setDraftToken(saved);
      void load(saved);
    }, 0);
  }, [load]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draftToken.trim();
    if (!value) return;
    sessionStorage.setItem("guan-hao-review-token", value);
    setToken(value);
    await load(value);
  }

  async function decide(id: string, action: "approve" | "reject") {
    const label = action === "approve" ? "通过" : "拒绝";
    if (!window.confirm(`确认${label}这条投稿吗？`)) return;
    setLoading(true);
    try {
      const result = await request(
        `/api/admin/submissions/${id}/${action}`,
        token,
        action === "approve"
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ series: seriesSelections[id] ?? "unclassified" }),
            }
          : { method: "POST" },
      );
      setItems((current) => current.filter((item) => item.id !== id));
      setSeriesSelections((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setMessage(result.message ?? `投稿已${label}。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "审核操作失败");
    } finally {
      setLoading(false);
    }
  }

  async function openMedia(id: string, index: number) {
    try {
      const response = await fetch(`/api/admin/submissions/${id}/media/${index}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "媒体读取失败");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "媒体读取失败");
    }
  }

  function lock() {
    sessionStorage.removeItem("guan-hao-review-token");
    setToken("");
    setDraftToken("");
    setItems([]);
    setSeriesSelections({});
    setMessage("审核页面已锁定。");
  }

  return (
    <main className="community-page review-page">
      <nav className="community-nav" aria-label="审核页导航">
        <a className="brand" href="/">
          <span className="brand-mark">GH</span>
          <span className="brand-copy">超级大关昊<small>REVIEW CONSOLE</small></span>
        </a>
        <div><a href="/submissions">公开投稿区</a><a href="/submit">投稿页</a></div>
      </nav>

      <header className="community-hero review-hero">
        <p className="section-kicker">PRIVATE REVIEW · 管理员</p>
        <h1>投稿审核台。</h1>
        <p>通过后内容立即进入公开投稿区；拒绝会删除待审记录及其上传文件。</p>
      </header>

      <section className="review-console">
        {!token ? (
          <form className="review-unlock" onSubmit={unlock}>
            <label className="field">
              <span>审核口令</span>
              <input
                type="password"
                value={draftToken}
                onChange={(event) => setDraftToken(event.target.value)}
                autoComplete="current-password"
                required
                placeholder="输入管理员审核口令"
              />
            </label>
            <button type="submit">进入审核台 ↗</button>
          </form>
        ) : (
          <div className="review-toolbar">
            <p>{message}</p>
            <div><button onClick={() => void load(token)} disabled={loading}>刷新</button><button onClick={lock}>锁定</button></div>
          </div>
        )}

        {!token && <p className="review-message">{message}</p>}

        <div className="review-list">
          {items.map((item) => {
            const media = submissionMedia(item);
            return (
              <article className="review-card" key={item.id}>
              <header>
                <span>{categoryLabel[item.category]}</span>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("zh-CN")}</time>
              </header>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <dl>
                <div><dt>投稿人</dt><dd>{item.submitter}</dd></div>
                <div><dt>联系方式</dt><dd>{item.contact || "未填写"}</dd></div>
                <div>
                  <dt>上传文件</dt>
                  <dd>
                    {media.length > 0
                      ? media.map((mediaItem, index) => (
                          <span className="review-media-name" key={mediaItem.mediaKey}>
                            {index + 1}. {mediaItem.mediaName}
                          </span>
                        ))
                      : "无"}
                  </dd>
                </div>
              </dl>
              {item.category === "photo" && (
                <section className="review-classification" aria-label="图片自动分类结果">
                  <div className="review-classification-result">
                    <span>
                      {item.autoClassification?.status === "classified"
                        ? "AUTO CLASSIFIED"
                        : "NEEDS REVIEW"}
                    </span>
                    <strong>
                      智能建议 · {imageSeriesLabel(item.autoClassification?.suggestedSeries ?? "unclassified")}
                    </strong>
                    <em>
                      {item.autoClassification
                        ? `${Math.round(item.autoClassification.confidence * 100)}%`
                        : "—"}
                    </em>
                  </div>
                  <p>
                    {item.autoClassification?.summary ??
                      "这张图片尚未得到可靠识别结果，请人工选择系列。"}
                  </p>
                  <label>
                    <span>审核后归入系列</span>
                    <select
                      value={seriesSelections[item.id] ?? "unclassified"}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (!isImageSeries(value)) return;
                        setSeriesSelections((current) => ({
                          ...current,
                          [item.id]: value,
                        }));
                      }}
                    >
                      {imageSeriesOptions.map((series) => (
                        <option key={series.value} value={series.value}>{series.label}</option>
                      ))}
                    </select>
                  </label>
                </section>
              )}
              {item.sourceUrl && <a className="review-source" href={item.sourceUrl} target="_blank" rel="noreferrer">查看素材链接 ↗</a>}
              <footer>
                {media.map((mediaItem, index) => (
                  <button key={mediaItem.mediaKey} onClick={() => void openMedia(item.id, index)}>
                    查看素材 {media.length > 1 ? index + 1 : ""}
                  </button>
                ))}
                <button className="review-reject" onClick={() => void decide(item.id, "reject")}>拒绝</button>
                <button className="review-approve" onClick={() => void decide(item.id, "approve")}>通过并上架</button>
              </footer>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
