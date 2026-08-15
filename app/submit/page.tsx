/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { FormEvent, useState } from "react";

type SubmitState =
  | { kind: "idle"; message: string }
  | { kind: "sending"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const categoryNotes = {
  photo: "校园照片、聊天截图或人物影像",
  video: "短视频、现场记录或外部素材链接",
  story: "人物事迹、校园传说或名场面文字",
};

export default function SubmitPage() {
  const [category, setCategory] = useState<keyof typeof categoryNotes>("photo");
  const [state, setState] = useState<SubmitState>({ kind: "idle", message: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ kind: "sending", message: "正在提交，请不要关闭页面……" });

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        body: new FormData(form),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "投稿提交失败");
      form.reset();
      setCategory("photo");
      setState({
        kind: "success",
        message: result.message ?? "投稿已提交，等待审核。",
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "投稿提交失败，请稍后再试。",
      });
    }
  }

  return (
    <main className="community-page">
      <nav className="community-nav" aria-label="投稿页导航">
        <a className="brand" href="/">
          <span className="brand-mark">GH</span>
          <span className="brand-copy">超级大关昊<small>COMMUNITY ARCHIVE</small></span>
        </a>
        <div>
          <a href="/submissions">浏览投稿区</a>
          <a href="/">返回首页</a>
        </div>
      </nav>

      <header className="community-hero">
        <p className="section-kicker">COMMUNITY SUBMISSION · 公开投稿</p>
        <h1>把新的<br />名场面投进来。</h1>
        <p>图片、视频与事迹分开归档。投稿通过人工审核后，会自动出现在投稿区。</p>
        <div className="community-process" aria-label="投稿流程">
          <span><b>01</b> 填写投稿</span>
          <span><b>02</b> 管理员审核</span>
          <span><b>03</b> 自动上架</span>
        </div>
      </header>

      <section className="submission-layout">
        <aside className="submission-guide">
          <span>投稿须知</span>
          <h2>先分类，<br />再归档。</h2>
          <ul>
            <li>投稿人会公开显示，联系方式不会公开。</li>
            <li>单个上传文件不超过 20 MB；大视频可填写素材链接。</li>
            <li>不得上传隐私、违法内容或未经允许的他人影像。</li>
            <li>管理员可根据内容调整标题、说明或拒绝投稿。</li>
          </ul>
        </aside>

        <form className="submission-form" onSubmit={submit}>
          <div className="submission-category" role="group" aria-label="投稿分类">
            {(["photo", "video", "story"] as const).map((value) => (
              <label key={value} className={category === value ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="category"
                  value={value}
                  checked={category === value}
                  onChange={() => setCategory(value)}
                />
                <strong>{value === "photo" ? "图片" : value === "video" ? "视频" : "事迹"}</strong>
                <span>{categoryNotes[value]}</span>
              </label>
            ))}
          </div>

          <label className="field">
            <span>投稿标题 *</span>
            <input name="title" minLength={2} maxLength={60} required placeholder="例如：302呕吐之夜" />
          </label>

          <label className="field">
            <span>内容说明 *</span>
            <textarea
              name="description"
              minLength={10}
              maxLength={2000}
              required
              rows={7}
              placeholder="说明发生了什么、人物是谁、素材拍摄时间等……"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>投稿人 *</span>
              <input name="submitter" minLength={2} maxLength={30} required placeholder="审核通过后公开显示" />
            </label>
            <label className="field">
              <span>联系方式</span>
              <input name="contact" maxLength={100} placeholder="仅管理员查看，可不填" />
            </label>
          </div>

          <label className="field file-field">
            <span>上传素材</span>
            <input name="media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" />
            <small>支持 JPG、PNG、WebP、GIF、MP4、WebM，最大 20 MB。</small>
          </label>

          <label className="field">
            <span>素材链接</span>
            <input name="sourceUrl" type="url" maxLength={500} placeholder="大文件或原始出处链接，可不填" />
          </label>

          <label className="submission-agreement">
            <input name="agreement" type="checkbox" value="yes" required />
            <span>我确认有权提交这些内容，且内容不含敏感隐私或违法信息。</span>
          </label>

          <label className="submission-honeypot" aria-hidden="true">
            网站<input name="website" tabIndex={-1} autoComplete="off" />
          </label>

          <button className="submission-submit" type="submit" disabled={state.kind === "sending"}>
            {state.kind === "sending" ? "正在提交" : "提交审核"}<span aria-hidden="true">↗</span>
          </button>

          {state.kind !== "idle" && (
            <p className={`submission-status status-${state.kind}`} role="status">{state.message}</p>
          )}
        </form>
      </section>

      <footer className="community-footer">
        <a href="/submissions">进入公开投稿区 ↗</a>
        <a href="/review">管理员审核</a>
        <p>部分照片由千秋雯提供</p>
      </footer>
    </main>
  );
}
