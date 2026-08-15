import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders submission page", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `submit-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/submit", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /把新的/);
  assert.match(html, /投稿人/);
});

test("accepts a valid story submission into pending storage", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `api-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const stored = new Map();
  const body = JSON.stringify({
    category: "story",
    title: "测试校园事迹",
    description: "这是一条用于自动验证投稿审核流程的校园事迹内容。",
    submitter: "测试投稿人",
    agreement: true,
  });

  const response = await worker.fetch(
    new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: {
        "content-length": String(new TextEncoder().encode(body).byteLength),
        "content-type": "application/json",
      },
      body,
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      MEDIA: {
        put: async (key, value) => {
          stored.set(key, value);
          return {};
        },
        delete: async () => {},
      },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.ok, true);
  assert.equal(
    [...stored.keys()].some((key) => key.includes("/pending/") && key.endsWith(".json")),
    true,
  );
});

test("streams an accepted media upload into R2", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `upload-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const stored = new Map();
  const media = new Blob(["test-video"], { type: "video/mp4" });

  const response = await worker.fetch(
    new Request("http://localhost/api/submission-uploads", {
      method: "PUT",
      headers: {
        "content-length": String(media.size),
        "content-type": media.type,
        "x-file-name": encodeURIComponent("测试视频.mp4"),
        "x-submission-category": "video",
      },
      body: media,
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      MEDIA: {
        put: async (key, value) => {
          stored.set(key, value);
          return {};
        },
        delete: async () => {},
      },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 201);
  const result = await response.json();
  assert.match(result.uploadId, /^[0-9a-f-]{36}$/i);
  assert.match(result.uploadToken, /^[0-9a-f]{64}$/i);
  assert.equal(
    [...stored.keys()].some((key) => key.includes("/media/") && key.endsWith(".mp4")),
    true,
  );
  assert.equal(
    [...stored.keys()].some((key) => key.includes("/uploads/") && key.endsWith(".json")),
    true,
  );
});
