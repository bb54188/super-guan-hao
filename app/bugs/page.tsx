/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";

type BugStatus =
  | "waiting-setup"
  | "queued"
  | "analyzing"
  | "testing"
  | "patch-ready"
  | "needs-review"
  | "failed";

type BugProgress = {
  id: string;
  title: string;
  status: BugStatus;
  statusMessage: string;
  createdAt: string;
  updatedAt: string;
  fixUrl?: string;
};

type Tracking = {
  id: string;
  token: string;
};

const STORAGE_KEY = "super-guan-hao-last-bug";
const terminalStatuses = new Set<BugStatus>([
  "waiting-setup",
  "patch-ready",
  "needs-review",
  "failed",
]);

const statusLabels: Record<BugStatus, string> = {
  "waiting-setup": "等待启用",
  queued: "已排队",
  analyzing: "正在分析",
  testing: "自动测试",
  "patch-ready": "修复提案完成",
  "needs-review": "需要人工处理",
  failed: "处理失败",
};

const stages = [
  "保存报告",
  "ChatGPT 分析",
  "构建与测试",
  "修复提案",
] as const;

const completedStageCount: Record<BugStatus, number> = {
  "waiting-setup": 1,
  queued: 1,
  analyzing: 2,
  testing: 3,
  "patch-ready": 4,
  "needs-review": 2,
  failed: 1,
};

function environmentSummary(): string {
  if (typeof navigator === "undefined" || typeof window === "undefined") return "";
  return [
    navigator.userAgent,
    `屏幕 ${window.screen.width}×${window.screen.height}`,
    `窗口 ${window.innerWidth}×${window.innerHeight}`,
  ].join(" · ");
}

function subscribeEnvironment(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function subscribeStoredTracking(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("bug-tracking-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("bug-tracking-change", onChange);
  };
}

function storedTrackingSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function parseTracking(value: string): Tracking | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const candidate = parsed as Record<string, unknown>;
    return typeof candidate.id === "string" && typeof candidate.token === "string"
      ? { id: candidate.id, token: candidate.token }
      : null;
  } catch {
    return null;
  }
}

export default function BugReportPage() {
  const detectedEnvironment = useSyncExternalStore(
    subscribeEnvironment,
    environmentSummary,
    () => "",
  );
  const storedTracking = useSyncExternalStore(
    subscribeStoredTracking,
    storedTrackingSnapshot,
    () => "",
  );
  const [environmentOverride, setEnvironmentOverride] = useState<string | null>(null);
  const [trackingOverride, setTrackingOverride] = useState<Tracking | false | null>(null);
  const [progress, setProgress] = useState<BugProgress | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const environment = environmentOverride ?? detectedEnvironment;
  const restoredTracking = useMemo(() => parseTracking(storedTracking), [storedTracking]);
  const tracking = trackingOverride === null
    ? restoredTracking
    : trackingOverride || null;

  useEffect(() => {
    if (!tracking) return;
    let active = true;
    let timeout: number | undefined;

    async function refresh() {
      try {
        const response = await fetch(`/api/bugs/${tracking.id}/status`, {
          headers: { Authorization: `Bearer ${tracking.token}` },
          cache: "no-store",
        });
        const result = (await response.json()) as { report?: BugProgress; error?: string };
        if (!response.ok || !result.report) throw new Error(result.error ?? "进度读取失败");
        if (!active) return;
        setProgress(result.report);
        setMessage("");
        if (!terminalStatuses.has(result.report.status)) {
          timeout = window.setTimeout(() => void refresh(), 8000);
        }
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "进度读取失败");
        timeout = window.setTimeout(() => void refresh(), 15000);
      }
    }

    void refresh();
    return () => {
      active = false;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [tracking]);

  const completedStages = useMemo(() => {
    if (!progress) return new Set<number>();
    return new Set(Array.from({ length: completedStageCount[progress.status] }, (_, index) => index));
  }, [progress]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setMessage("正在保存报告并建立修复任务……");

    try {
      const response = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          pagePath: formData.get("pagePath"),
          steps: formData.get("steps"),
          expected: formData.get("expected"),
          actual: formData.get("actual"),
          environment: formData.get("environment"),
          contact: formData.get("contact"),
          website: formData.get("website"),
          agreement: formData.get("agreement") === "yes",
        }),
      });
      const result = (await response.json()) as {
        id?: string;
        trackingToken?: string;
        status?: BugStatus;
        statusMessage?: string;
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Bug 提交失败");
      if (!result.id || !result.trackingToken || !result.status) {
        setMessage(result.message ?? "反馈已收到。");
        form.reset();
        return;
      }
      const nextTracking = { id: result.id, token: result.trackingToken };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTracking));
      window.dispatchEvent(new Event("bug-tracking-change"));
      setTrackingOverride(nextTracking);
      setProgress({
        id: result.id,
        title: String(formData.get("title") ?? "Bug 反馈"),
        status: result.status,
        statusMessage: result.statusMessage ?? "报告已保存。",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setMessage(result.message ?? "Bug 已提交。");
      form.reset();
      setEnvironmentOverride(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bug 提交失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  function clearTracking() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("bug-tracking-change"));
    setTrackingOverride(false);
    setProgress(null);
    setMessage("");
  }

  return (
    <main className="community-page bug-page">
      <nav className="community-nav" aria-label="Bug 反馈页导航">
        <a className="brand" href="/">
          <span className="brand-mark">GH</span>
          <span className="brand-copy">超级大关昊<small>BUG REPAIR DESK</small></span>
        </a>
        <div>
          <a href="/submissions">投稿区</a>
          <a href="/">返回首页</a>
        </div>
      </nav>

      <header className="community-hero bug-hero">
        <p className="section-kicker">BUG REPORT · CHATGPT AUTOFIX</p>
        <h1>发现问题，<br />交给 ChatGPT。</h1>
        <p>提交后系统会保存报告、自动分析并尝试生成最小修复。修复必须先通过构建与测试，之后才会形成供管理员确认的修复提案。</p>
        <div className="community-process" aria-label="Bug 自动修复流程">
          <span><b>01</b> 提交报告</span>
          <span><b>02</b> 自动分析</span>
          <span><b>03</b> 构建测试</span>
          <span><b>04</b> 修复提案</span>
        </div>
      </header>

      <section className="bug-layout">
        <aside className="bug-guide">
          <span>写清楚会修得更快</span>
          <h2>怎么<br />复现？</h2>
          <ol>
            <li><b>页面</b><span>问题发生在哪个页面。</span></li>
            <li><b>步骤</b><span>按顺序写下点了什么、看到了什么。</span></li>
            <li><b>结果</b><span>实际结果和你希望看到的结果。</span></li>
            <li><b>环境</b><span>设备与浏览器会自动填写，也可以补充。</span></li>
          </ol>
          <p>请不要填写账号密码、管理员口令、API Token 或其他隐私信息。</p>
        </aside>

        <div className="bug-workspace">
          {progress && (
            <section className={`bug-progress status-${progress.status}`} aria-live="polite">
              <header>
                <div>
                  <span>BUG #{progress.id.slice(0, 8).toUpperCase()}</span>
                  <h2>{progress.title}</h2>
                </div>
                <strong>{statusLabels[progress.status]}</strong>
              </header>
              <div className="bug-progress-steps" aria-label="自动修复进度">
                {stages.map((stage, index) => (
                  <span className={completedStages.has(index) ? "is-complete" : ""} key={stage}>
                    <i>{String(index + 1).padStart(2, "0")}</i>{stage}
                  </span>
                ))}
              </div>
              <p>{progress.statusMessage}</p>
              <footer>
                {progress.fixUrl && (
                  <a href={progress.fixUrl} target="_blank" rel="noreferrer">查看修复提案 ↗</a>
                )}
                <button type="button" onClick={clearTracking}>提交另一个 Bug</button>
              </footer>
            </section>
          )}

          {!progress && (
            <form className="submission-form bug-form" onSubmit={submit}>
              <label className="field">
                <span>Bug 标题 *</span>
                <input name="title" minLength={2} maxLength={80} required placeholder="例如：华为浏览器进入首页会自动播放视频" />
              </label>

              <label className="field">
                <span>问题页面 *</span>
                <input name="pagePath" maxLength={300} required defaultValue="/" placeholder="例如：/、/submissions 或完整网址" />
              </label>

              <label className="field">
                <span>复现步骤 *</span>
                <textarea name="steps" maxLength={3000} required rows={6} placeholder={"1. 打开首页\n2. 向下滑到视频区\n3. 视频在没有点击时开始播放"} />
              </label>

              <div className="field-row">
                <label className="field">
                  <span>实际结果 *</span>
                  <textarea name="actual" maxLength={2000} required rows={5} placeholder="现在发生了什么？" />
                </label>
                <label className="field">
                  <span>期望结果</span>
                  <textarea name="expected" maxLength={2000} rows={5} placeholder="你希望它怎么工作？" />
                </label>
              </div>

              <label className="field">
                <span>设备与浏览器</span>
                <textarea
                  name="environment"
                  maxLength={500}
                  rows={4}
                  value={environment}
                  onChange={(event) => setEnvironmentOverride(event.target.value)}
                  placeholder="系统会自动检测，也可以手动补充版本号。"
                />
              </label>

              <label className="field">
                <span>联系方式</span>
                <input name="contact" maxLength={120} placeholder="仅管理员查看，可不填" />
              </label>

              <label className="submission-agreement">
                <input name="agreement" type="checkbox" value="yes" required />
                <span>我确认反馈中不含账号、口令、Token 或其他敏感信息，并同意将问题说明和设备信息交给 ChatGPT 处理；联系方式不会发送给 ChatGPT。</span>
              </label>

              <label className="submission-honeypot" aria-hidden="true">
                网站<input name="website" tabIndex={-1} autoComplete="off" />
              </label>

              <button className="submission-submit" type="submit" disabled={submitting}>
                {submitting ? "正在建立修复任务" : "提交 Bug 并自动分析"}
                <span aria-hidden="true">↗</span>
              </button>
              {message && <p className="submission-status status-sending" role="status">{message}</p>}
            </form>
          )}
        </div>
      </section>

      <footer className="community-footer">
        <a href="/">返回首页</a>
        <a href="/submit">我要投稿</a>
        <p>部分照片由千秋雯提供</p>
      </footer>
    </main>
  );
}
