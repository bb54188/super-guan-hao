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
  const form = new FormData();
  form.set("category", "story");
  form.set("title", "测试校园事迹");
  form.set("description", "这是一条用于自动验证投稿审核流程的校园事迹内容。");
  form.set("submitter", "测试投稿人");
  form.set("agreement", "yes");

  const response = await worker.fetch(
    new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "content-length": "1024" },
      body: form,
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
