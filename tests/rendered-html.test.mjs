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
  assert.match(html, /自动识别/);
});

test("renders Zhao Junjie photo series controls", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `zhao-series-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/people/zhao-junjie", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /清晨洗头/);
  assert.match(html, /床铺游戏/);
  assert.match(html, /床铺肖像/);
  assert.match(html, /校园同框/);
  assert.match(html, /聊天记录/);
  assert.match(html, /aria-pressed="true"/);
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

test("classifies an uploaded image and stores its suggested series", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `classify-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const stored = new Map();
  let aiCalls = 0;
  const mediaBinding = {
    put: async (key, value) => {
      if (typeof value === "string") {
        stored.set(key, { kind: "text", value });
      } else {
        stored.set(key, {
          kind: "bytes",
          value: await new Response(value).arrayBuffer(),
        });
      }
      return {};
    },
    get: async (key) => {
      const object = stored.get(key);
      if (!object) return null;
      if (object.kind === "text") {
        return {
          size: new TextEncoder().encode(object.value).byteLength,
          json: async () => JSON.parse(object.value),
          arrayBuffer: async () => new TextEncoder().encode(object.value).buffer,
        };
      }
      return {
        size: object.value.byteLength,
        json: async () => JSON.parse(new TextDecoder().decode(object.value)),
        arrayBuffer: async () => object.value,
      };
    },
    delete: async (keys) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) stored.delete(key);
    },
  };
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    MEDIA: mediaBinding,
    AI: {
      run: async () => {
        aiCalls += 1;
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  series: "bedside-gaming",
                  confidence: 0.91,
                  summary: "宿舍床铺边正在使用手机的生活抓拍",
                }),
              },
            },
          ],
        };
      },
    },
  };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const image = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
    type: "image/jpeg",
  });
  const uploadResponse = await worker.fetch(
    new Request("http://localhost/api/submission-uploads", {
      method: "PUT",
      headers: {
        "content-length": String(image.size),
        "content-type": image.type,
        "x-file-name": encodeURIComponent("宿舍照片.jpg"),
        "x-submission-category": "photo",
      },
      body: image,
    }),
    env,
    context,
  );
  assert.equal(uploadResponse.status, 201);
  const upload = await uploadResponse.json();

  const body = JSON.stringify({
    category: "photo",
    title: "宿舍游戏时刻",
    description: "赵俊杰在宿舍床铺边使用手机的一张生活抓拍照片。",
    submitter: "测试投稿人",
    agreement: true,
    uploadId: upload.uploadId,
    uploadToken: upload.uploadToken,
    classificationPreview: "data:image/jpeg;base64,/9j/2Q==",
  });
  const submissionResponse = await worker.fetch(
    new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: {
        "content-length": String(new TextEncoder().encode(body).byteLength),
        "content-type": "application/json",
      },
      body,
    }),
    env,
    context,
  );

  assert.equal(submissionResponse.status, 201);
  assert.equal(aiCalls, 1);
  const pendingKey = [...stored.keys()].find(
    (key) => key.includes("/pending/") && key.endsWith(".json"),
  );
  assert.ok(pendingKey);
  const pending = JSON.parse(stored.get(pendingKey).value);
  assert.equal(pending.series, "bedside-gaming");
  assert.equal(pending.autoClassification.suggestedSeries, "bedside-gaming");
  assert.equal(pending.autoClassification.confidence, 0.91);
});
