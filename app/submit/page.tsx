/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { FormEvent, useState } from "react";

type SubmitState =
  | { kind: "idle"; message: string }
  | { kind: "uploading"; message: string }
  | { kind: "sending"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type UploadResult = {
  uploadId: string;
  uploadToken: string;
};

const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
const MAX_MEDIA_ITEMS = 12;

const categoryNotes = {
  photo: "上传后自动识别场景并建议图片系列",
  video: "短视频、现场记录或外部素材链接",
  story: "人物事迹、校园传说或名场面文字",
};

function uploadCategoryFor(file: File): "photo" | "video" {
  return file.type.startsWith("video/") ? "video" : "photo";
}

function fileSizeLabel(size: number): string {
  return size >= 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

async function createClassificationPreview(file: File): Promise<string | undefined> {
  if (!file.type.startsWith("image/")) return undefined;
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("图片预览读取失败"));
    });
    image.src = objectUrl;
    await loaded;

    const maxEdge = 768;
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const preview = canvas.toDataURL("image/jpeg", 0.72);
    return preview.startsWith("data:image/jpeg;base64,") ? preview : undefined;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function SubmitPage() {
  const [category, setCategory] = useState<keyof typeof categoryNotes>("photo");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [state, setState] = useState<SubmitState>({ kind: "idle", message: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const media = formData
      .getAll("media")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const uploaded: UploadResult[] = [];
    let classificationPreview: string | undefined;

    try {
      if (media.length > MAX_MEDIA_ITEMS) {
        throw new Error(`每个系列最多上传 ${MAX_MEDIA_ITEMS} 个文件。`);
      }
      const oversized = media.find((file) => file.size > MAX_UPLOAD_BYTES);
      if (oversized) {
        throw new Error(`“${oversized.name}”超过 80 MB；更大的视频请填写素材链接。`);
      }

      if (media.length === 1 && media[0].type.startsWith("image/")) {
        setState({ kind: "uploading", message: "正在生成图片识别预览……" });
        classificationPreview = await createClassificationPreview(media[0]).catch(() => undefined);
      }

      for (const [index, file] of media.entries()) {
        setState({
          kind: "uploading",
          message: `正在上传 ${index + 1}/${media.length}：${file.name}`,
        });
        const uploadResponse = await fetch("/api/submission-uploads", {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "X-Submission-Category": uploadCategoryFor(file),
            "X-File-Name": encodeURIComponent(file.name),
          },
          body: file,
        });
        const uploadResult = (await uploadResponse.json()) as {
          uploadId?: string;
          uploadToken?: string;
          error?: string;
        };
        if (!uploadResponse.ok || !uploadResult.uploadId || !uploadResult.uploadToken) {
          throw new Error(uploadResult.error ?? "素材上传失败");
        }
        uploaded.push({
          uploadId: uploadResult.uploadId,
          uploadToken: uploadResult.uploadToken,
        });
      }

      setState({
        kind: "sending",
        message:
          media.length > 1
            ? "全部素材已就绪，正在自动整理为系列并提交审核……"
            : category === "photo"
            ? "素材已就绪，正在识别画面类型并提交审核……"
            : "素材已就绪，正在提交投稿信息……",
      });
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: media.length > 1 ? "series" : formData.get("category"),
          title: formData.get("title"),
          description: formData.get("description"),
          submitter: formData.get("submitter"),
          contact: formData.get("contact"),
          sourceUrl: formData.get("sourceUrl"),
          website: formData.get("website"),
          agreement: formData.get("agreement") === "yes",
          ...(classificationPreview ? { classificationPreview } : {}),
          ...(uploaded.length > 0 ? { uploads: uploaded } : {}),
        }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "投稿提交失败");
      form.reset();
      setCategory("photo");
      setSelectedFiles([]);
      setState({
        kind: "success",
        message: result.message ?? "投稿已提交，等待审核。",
      });
    } catch (error) {
      await Promise.all(
        uploaded.map((item) =>
          fetch(`/api/submission-uploads/${item.uploadId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${item.uploadToken}` },
          }).catch(() => undefined),
        ),
      );
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
        <p>一次选择多个照片或视频会自动合并为一个系列；单张图片仍会识别画面类型并建议分类。</p>
        <div className="community-process" aria-label="投稿流程">
          <span><b>01</b> 填写投稿</span>
          <span><b>02</b> 智能识别</span>
          <span><b>03</b> 管理员确认</span>
          <span><b>04</b> 分类上架</span>
        </div>
      </header>

      <section className="submission-layout">
        <aside className="submission-guide">
          <span>投稿须知</span>
          <h2>自动识别，<br />人工确认。</h2>
          <ul>
            <li>投稿人会公开显示，联系方式不会公开。</li>
            <li>可一次选择最多 12 个照片或视频，两个及以上会自动组成一个系列。</li>
            <li>每个上传文件不超过 80 MB；更大的视频可填写素材链接。</li>
            <li>系统只分析图片场景，不进行人脸身份识别；无法可靠判断时归入“待整理”。</li>
            <li>不得上传隐私、违法内容或未经允许的他人影像。</li>
            <li>管理员可在上架前修改图片系列，或拒绝投稿。</li>
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
              maxLength={2000}
              required
              rows={7}
              placeholder="可以简短填写：发生了什么、人物是谁或素材拍摄时间等……"
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
            <input
              name="media"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                setSelectedFiles(files);
                if (files.length === 1 && files[0].type.startsWith("image/")) setCategory("photo");
                if (files.length === 1 && files[0].type.startsWith("video/")) setCategory("video");
              }}
            />
            <small>支持 JPG、PNG、WebP、GIF、MP4、WebM，每个文件最大 80 MB，最多 12 个。两个及以上文件会自动合并为一个系列。</small>
            {selectedFiles.length > 0 && (
              <div className={`selected-media-summary${selectedFiles.length > 1 ? " is-series" : ""}`}>
                <strong>
                  {selectedFiles.length > 1
                    ? `已选择 ${selectedFiles.length} 项 · 将自动创建系列`
                    : "已选择 1 个素材"}
                </strong>
                <ul>
                  {selectedFiles.map((file, index) => (
                    <li key={`${file.name}-${file.size}-${index}`}>
                      <span>{index + 1}. {file.name}</span>
                      <em>{fileSizeLabel(file.size)}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

          <button
            className="submission-submit"
            type="submit"
            disabled={state.kind === "uploading" || state.kind === "sending"}
          >
            {state.kind === "uploading"
              ? "正在上传"
              : state.kind === "sending"
                ? "正在提交"
                : "提交审核"}
            <span aria-hidden="true">↗</span>
          </button>

          {state.kind !== "idle" && (
            <p className={`submission-status status-${state.kind}`} role="status">{state.message}</p>
          )}
        </form>
      </section>

      <footer className="community-footer">
        <a href="/submissions">进入公开投稿区 ↗</a>
        <a href="/bugs">反馈网站 Bug</a>
        <a href="/review">管理员审核</a>
        <p>部分照片由千秋雯提供</p>
      </footer>
    </main>
  );
}
