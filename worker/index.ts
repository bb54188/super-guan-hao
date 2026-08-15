/** Cloudflare Worker entry point for the vinext application. */
import {
  handleImageOptimization,
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
} from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

const WECHAT_VERIFICATION_PATH = "/fca6cb2f88fa0690d15f0cde3ad718b0.txt";
const WECHAT_VERIFICATION_VALUE = "21d8b5393838f286c4a5bc799c24ce6302a4301b";
const REVIEW_TOKEN_HASH = "dc565be1f707b601ac2ef93fea8ac39eb06357034cb86b84d65eb3c5cbc5b7ec";
const SUBMISSION_ROOT = "community/submissions";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024;

type SubmissionCategory = "photo" | "video" | "story";
type SubmissionStatus = "pending" | "approved";

type SubmissionRecord = {
  id: string;
  category: SubmissionCategory;
  title: string;
  description: string;
  submitter: string;
  contact?: string;
  sourceUrl?: string;
  createdAt: string;
  approvedAt?: string;
  status: SubmissionStatus;
  mediaKey?: string;
  mediaType?: string;
  mediaName?: string;
};

interface WorkerEnv {
  ASSETS: Fetcher;
  MEDIA: R2Bucket;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: {
          format: string;
          quality: number;
        }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function cleanText(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isCategory(value: string): value is SubmissionCategory {
  return value === "photo" || value === "video" || value === "story";
}

function isSubmissionRecord(value: unknown): value is SubmissionRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.description === "string" &&
    typeof record.submitter === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.category === "string" &&
    isCategory(record.category) &&
    (record.status === "pending" || record.status === "approved")
  );
}

function pendingKey(id: string): string {
  return `${SUBMISSION_ROOT}/pending/${id}.json`;
}

function approvedKey(id: string): string {
  return `${SUBMISSION_ROOT}/approved/${id}.json`;
}

function validId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseSourceUrl(value: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function extensionFor(type: string): string | null {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return extensions[type] ?? null;
}

async function readSubmission(env: WorkerEnv, key: string): Promise<SubmissionRecord | null> {
  const object = await env.MEDIA.get(key);
  if (!object) return null;
  try {
    const value: unknown = await object.json();
    return isSubmissionRecord(value) ? value : null;
  } catch {
    return null;
  }
}

async function listSubmissions(
  env: WorkerEnv,
  status: SubmissionStatus,
): Promise<SubmissionRecord[]> {
  const listed = await env.MEDIA.list({
    prefix: `${SUBMISSION_ROOT}/${status}/`,
    limit: 24,
  });
  const records = await Promise.all(
    listed.objects.map((object) => readSubmission(env, object.key)),
  );
  return records
    .filter((record): record is SubmissionRecord => record !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function verifyReviewToken(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  const encoder = new TextEncoder();
  const providedHash = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  const expectedHash = Uint8Array.from(
    REVIEW_TOKEN_HASH.match(/.{2}/g) ?? [],
    (byte) => Number.parseInt(byte, 16),
  );
  const actual = new Uint8Array(providedHash);
  let difference = actual.length ^ expectedHash.length;
  for (let index = 0; index < Math.max(actual.length, expectedHash.length); index += 1) {
    difference |= (actual[index] ?? 0) ^ (expectedHash[index] ?? 0);
  }
  return difference === 0;
}

async function createSubmission(request: Request, env: WorkerEnv): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return json({ error: "请使用网站投稿表单。" }, 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return json({ error: "无法确认投稿大小，请重新选择文件后提交。" }, 411);
  }
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ error: "单次投稿不能超过 20 MB。" }, 413);
  }

  const form = await request.formData();
  if (cleanText(form.get("website"), 100)) {
    return json({ ok: true, message: "投稿已提交，等待审核。" }, 201);
  }

  const categoryValue = cleanText(form.get("category"), 20);
  const title = cleanText(form.get("title"), 60);
  const description = cleanText(form.get("description"), 2000);
  const submitter = cleanText(form.get("submitter"), 30);
  const contact = cleanText(form.get("contact"), 100);
  const sourceUrlInput = cleanText(form.get("sourceUrl"), 500);
  const sourceUrl = parseSourceUrl(sourceUrlInput);
  const agreement = form.get("agreement") === "yes";
  const mediaEntry = form.get("media");
  const media = mediaEntry && typeof mediaEntry !== "string" && mediaEntry.size > 0
    ? mediaEntry
    : null;

  if (!isCategory(categoryValue)) {
    return json({ error: "请选择图片、视频或事迹分类。" }, 400);
  }
  if (title.length < 2 || description.length < 10 || submitter.length < 2) {
    return json({ error: "请完整填写标题、内容和投稿人。" }, 400);
  }
  if (!agreement) {
    return json({ error: "请确认内容已获授权且不包含隐私信息。" }, 400);
  }
  if (sourceUrlInput && !sourceUrl) {
    return json({ error: "素材链接必须是有效的 HTTP 或 HTTPS 地址。" }, 400);
  }
  if ((categoryValue === "photo" || categoryValue === "video") && !media && !sourceUrl) {
    return json({ error: "图片或视频投稿需要上传文件或填写素材链接。" }, 400);
  }

  let mediaKey: string | undefined;
  let mediaType: string | undefined;
  let mediaName: string | undefined;
  const id = crypto.randomUUID();

  if (media) {
    const extension = extensionFor(media.type);
    if (!extension) {
      return json({ error: "仅支持 JPG、PNG、WebP、GIF、MP4 和 WebM 文件。" }, 415);
    }
    if (media.size > MAX_UPLOAD_BYTES) {
      return json({ error: "上传文件不能超过 20 MB；更大的视频请填写素材链接。" }, 413);
    }
    if (categoryValue === "photo" && !media.type.startsWith("image/")) {
      return json({ error: "图片分类只能上传图片文件。" }, 400);
    }
    if (categoryValue === "video" && !media.type.startsWith("video/")) {
      return json({ error: "视频分类只能上传视频文件。" }, 400);
    }

    mediaKey = `${SUBMISSION_ROOT}/media/${id}.${extension}`;
    mediaType = media.type;
    mediaName = media.name.slice(0, 120);
    await env.MEDIA.put(mediaKey, media.stream(), {
      httpMetadata: { contentType: media.type },
      customMetadata: { submissionId: id },
    });
  }

  const submission: SubmissionRecord = {
    id,
    category: categoryValue,
    title,
    description,
    submitter,
    ...(contact ? { contact } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
    createdAt: new Date().toISOString(),
    status: "pending",
    ...(mediaKey ? { mediaKey, mediaType, mediaName } : {}),
  };

  try {
    await env.MEDIA.put(pendingKey(id), JSON.stringify(submission), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
    });
  } catch (error) {
    if (mediaKey) await env.MEDIA.delete(mediaKey);
    throw error;
  }

  return json(
    {
      ok: true,
      id,
      message: "投稿已提交，审核通过后会自动出现在投稿区。",
    },
    201,
  );
}

function publicSubmission(record: SubmissionRecord): Record<string, unknown> {
  return {
    id: record.id,
    category: record.category,
    title: record.title,
    description: record.description,
    submitter: record.submitter,
    createdAt: record.createdAt,
    approvedAt: record.approvedAt,
    sourceUrl: record.sourceUrl,
    mediaType: record.mediaType,
    mediaName: record.mediaName,
    mediaUrl: record.mediaKey ? `/api/submissions/${record.id}/media` : undefined,
  };
}

async function listApproved(request: Request, env: WorkerEnv): Promise<Response> {
  const category = new URL(request.url).searchParams.get("category") ?? "all";
  const records = await listSubmissions(env, "approved");
  const filtered = isCategory(category)
    ? records.filter((record) => record.category === category)
    : records;
  return json({ submissions: filtered.map(publicSubmission) });
}

function rangeHeaders(object: R2ObjectBody, headers: Headers): number {
  headers.set("Accept-Ranges", "bytes");
  if (!object.range) return 200;
  let offset = 0;
  let length = object.size;
  if ("suffix" in object.range) {
    length = Math.min(object.range.suffix, object.size);
    offset = object.size - length;
  } else {
    offset = object.range.offset ?? 0;
    length = object.range.length ?? object.size - offset;
  }
  headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
  headers.set("Content-Length", String(length));
  return 206;
}

async function serveMedia(
  request: Request,
  env: WorkerEnv,
  record: SubmissionRecord,
  isPublic: boolean,
): Promise<Response> {
  if (!record.mediaKey) return json({ error: "该投稿没有上传媒体文件。" }, 404);
  const object = await env.MEDIA.get(record.mediaKey, {
    range: request.headers,
  });
  if (!object) return json({ error: "媒体文件不存在。" }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", isPublic ? "public, max-age=3600" : "private, no-store");
  const status = rangeHeaders(object, headers);
  return new Response(request.method === "HEAD" ? null : object.body, { status, headers });
}

async function handlePublicApi(request: Request, env: WorkerEnv, url: URL): Promise<Response> {
  if (url.pathname === "/api/submissions") {
    if (request.method === "GET") return listApproved(request, env);
    if (request.method === "POST") return createSubmission(request, env);
    return json({ error: "Method not allowed" }, 405);
  }

  const mediaMatch = url.pathname.match(/^\/api\/submissions\/([^/]+)\/media$/);
  if (mediaMatch && (request.method === "GET" || request.method === "HEAD")) {
    const id = mediaMatch[1];
    if (!validId(id)) return json({ error: "无效的投稿编号。" }, 400);
    const record = await readSubmission(env, approvedKey(id));
    if (!record) return json({ error: "投稿不存在或尚未通过审核。" }, 404);
    return serveMedia(request, env, record, true);
  }

  return json({ error: "Not found" }, 404);
}

async function handleAdminApi(request: Request, env: WorkerEnv, url: URL): Promise<Response> {
  if (!(await verifyReviewToken(request))) {
    return json({ error: "审核口令不正确。" }, 401);
  }

  if (url.pathname === "/api/admin/submissions" && request.method === "GET") {
    return json({ submissions: await listSubmissions(env, "pending") });
  }

  const match = url.pathname.match(
    /^\/api\/admin\/submissions\/([^/]+)\/(approve|reject|media)$/,
  );
  if (!match || !validId(match[1])) return json({ error: "Not found" }, 404);
  const [, id, action] = match;
  const record = await readSubmission(env, pendingKey(id));
  if (!record) return json({ error: "待审核投稿不存在。" }, 404);

  if (action === "media" && (request.method === "GET" || request.method === "HEAD")) {
    return serveMedia(request, env, record, false);
  }
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (action === "approve") {
    const approved: SubmissionRecord = {
      ...record,
      contact: undefined,
      status: "approved",
      approvedAt: new Date().toISOString(),
    };
    await env.MEDIA.put(approvedKey(id), JSON.stringify(approved), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
    });
    await env.MEDIA.delete(pendingKey(id));
    return json({ ok: true, message: "投稿已通过并自动上架。" });
  }

  await env.MEDIA.delete(
    record.mediaKey ? [pendingKey(id), record.mediaKey] : pendingKey(id),
  );
  return json({ ok: true, message: "投稿已拒绝并删除。" });
}

const worker = {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (
        url.pathname === WECHAT_VERIFICATION_PATH &&
        (request.method === "GET" || request.method === "HEAD")
      ) {
        return new Response(request.method === "HEAD" ? null : WECHAT_VERIFICATION_VALUE, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }

      if (url.pathname.startsWith("/api/admin/submissions")) {
        return await handleAdminApi(request, env, url);
      }
      if (url.pathname.startsWith("/api/submissions")) {
        return await handlePublicApi(request, env, url);
      }

      if (url.pathname === "/_vinext/image") {
        const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
        return handleImageOptimization(
          request,
          {
            fetchAsset: (path) =>
              env.ASSETS.fetch(new Request(new URL(path, request.url))),
            transformImage: async (body, { width, format, quality }) => {
              const result = await env.IMAGES.input(body)
                .transform(width > 0 ? { width } : {})
                .output({ format, quality });
              return result.response();
            },
          },
          allowedWidths,
        );
      }

      return handler.fetch(request, env, ctx);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "request failed",
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return json({ error: "服务器暂时无法处理该请求，请稍后重试。" }, 500);
    }
  },
};

export default worker;
