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

test("renders a prominent personal-page notice with direct links", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `person-notice-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /每个人物都有对应的个人页面，点击即可进入/);
  assert.match(html, /href="\/people\/guan-hao"/);
  assert.match(html, /href="\/people\/zhao-zixuan"/);
  assert.match(html, /href="\/people\/yin-haozhe"/);
  assert.match(html, /href="\/people\/zhao-junjie"/);
  const returnHomeworkVideo = html.match(
    /<video(?=[^>]*aria-label="2026年8月1日返校交作业时在走廊遇到关昊的视频")[^>]*>/i,
  )?.[0];
  assert.ok(returnHomeworkVideo);
  assert.match(returnHomeworkVideo, /preload="none"/i);
  assert.doesNotMatch(returnHomeworkVideo, /\bautoplay\b/i);
  assert.doesNotMatch(returnHomeworkVideo, /\bloop\b/i);
  assert.doesNotMatch(returnHomeworkVideo, /data-autoplay-mobile/i);
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
  assert.match(html, /可以简短填写/);
  assert.match(html, /两个及以上文件会自动合并为一个系列/);
  const mediaInput = html.match(/<input(?=[^>]*name="media")[^>]*>/i)?.[0];
  assert.ok(mediaInput);
  assert.match(mediaInput, /\bmultiple=""/i);
  assert.doesNotMatch(html, /minlength=["']10["']/i);
});

test("renders the ChatGPT bug feedback page", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `bugs-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/bugs", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /发现问题/);
  assert.match(html, /交给 ChatGPT/);
  assert.match(html, /提交 Bug 并自动分析/);
  assert.match(html, /name="steps"/);
  assert.match(html, /name="actual"/);
  assert.match(html, /不含账号、口令、Token/);
  assert.match(html, /联系方式不会发送给 ChatGPT/);
});

test("stores a private bug report and protects its progress token", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `bug-api-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const stored = new Map();
  const media = {
    put: async (key, value) => {
      stored.set(key, typeof value === "string" ? value : await new Response(value).text());
      return {};
    },
    get: async (key) => {
      const value = stored.get(key);
      return value === undefined ? null : { json: async () => JSON.parse(value) };
    },
  };
  const body = JSON.stringify({
    title: "首页视频异常播放",
    pagePath: "/",
    steps: "打开首页后不点击任何视频。",
    expected: "视频保持暂停。",
    actual: "视频自动开始播放。",
    environment: "测试浏览器",
    agreement: true,
  });

  const response = await worker.fetch(
    new Request("http://localhost/api/bugs", {
      method: "POST",
      headers: {
        "content-length": String(new TextEncoder().encode(body).byteLength),
        "content-type": "application/json",
      },
      body,
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      MEDIA: media,
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 202);
  const result = await response.json();
  assert.equal(result.status, "waiting-setup");
  assert.match(result.trackingToken, /^[0-9a-f]{64}$/i);
  assert.equal("callbackToken" in result, false);
  const reportEntry = [...stored.entries()].find(([key]) => key.includes("/bugs/reports/"));
  assert.ok(reportEntry);
  const report = JSON.parse(reportEntry[1]);
  assert.equal(report.actual, "视频自动开始播放。");
  assert.notEqual(report.statusTokenHash, result.trackingToken);
  assert.equal("callbackToken" in report, false);

  const unauthorized = await worker.fetch(
    new Request(`http://localhost/api/bugs/${result.id}/status`),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, MEDIA: media },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(unauthorized.status, 401);

  const statusResponse = await worker.fetch(
    new Request(`http://localhost/api/bugs/${result.id}/status`, {
      headers: { Authorization: `Bearer ${result.trackingToken}` },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, MEDIA: media },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(statusResponse.status, 200);
  const statusResult = await statusResponse.json();
  assert.equal(statusResult.report.status, "waiting-setup");
  assert.equal("steps" in statusResult.report, false);
  assert.equal("contact" in statusResult.report, false);
});

test("dispatches an enabled bug autofix and accepts only its scoped callback", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `bug-dispatch-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const stored = new Map();
  const background = [];
  const media = {
    put: async (key, value) => {
      stored.set(key, typeof value === "string" ? value : await new Response(value).text());
      return {};
    },
    get: async (key) => {
      const value = stored.get(key);
      return value === undefined ? null : { json: async () => JSON.parse(value) };
    },
  };
  const originalFetch = globalThis.fetch;
  let dispatchedPayload;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://api.github.com/repos/bb54188/super-guan-hao/dispatches");
    assert.equal(init.headers.Authorization, "Bearer test-github-token");
    dispatchedPayload = JSON.parse(init.body);
    return new Response(null, { status: 204 });
  };

  try {
    const body = JSON.stringify({
      title: "投稿视频不能播放",
      pagePath: "/submissions",
      steps: "打开投稿区并点击视频播放。",
      expected: "视频可以播放。",
      actual: "播放器显示错误。",
      environment: "测试浏览器",
      agreement: true,
    });
    const env = {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      MEDIA: media,
      GITHUB_AUTOFIX_TOKEN: "test-github-token",
    };
    const context = {
      waitUntil(promise) { background.push(promise); },
      passThroughOnException() {},
    };
    const response = await worker.fetch(
      new Request("http://localhost/api/bugs", {
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
    assert.equal(response.status, 202);
    const result = await response.json();
    assert.equal(result.status, "queued");
    assert.equal(background.length, 1);
    await Promise.all(background);
    assert.equal(dispatchedPayload.event_type, "website_bug_report");
    assert.equal(dispatchedPayload.client_payload.id, result.id);
    assert.match(dispatchedPayload.client_payload.callback_token, /^[0-9a-f]{64}$/i);

    const callbackBody = JSON.stringify({
      status: "patch-ready",
      statusMessage: "修复提案已经通过测试。",
      fixUrl: "https://github.com/bb54188/super-guan-hao/pull/123",
    });
    const callbackResponse = await worker.fetch(
      new Request(`http://localhost/api/bugs/${result.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${dispatchedPayload.client_payload.callback_token}`,
          "content-length": String(new TextEncoder().encode(callbackBody).byteLength),
          "content-type": "application/json",
        },
        body: callbackBody,
      }),
      env,
      context,
    );
    assert.equal(callbackResponse.status, 200);

    const statusResponse = await worker.fetch(
      new Request(`http://localhost/api/bugs/${result.id}/status`, {
        headers: { Authorization: `Bearer ${result.trackingToken}` },
      }),
      env,
      context,
    );
    const statusResult = await statusResponse.json();
    assert.equal(statusResult.report.status, "patch-ready");
    assert.equal(statusResult.report.fixUrl, "https://github.com/bb54188/super-guan-hao/pull/123");
  } finally {
    globalThis.fetch = originalFetch;
  }
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

test("accepts a one-character description into pending storage", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `api-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const stored = new Map();
  const body = JSON.stringify({
    category: "story",
    title: "测试校园事迹",
    description: "短",
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
  const pendingEntry = [...stored.entries()].find(
    ([key]) => key.includes("/pending/") && key.endsWith(".json"),
  );
  assert.ok(pendingEntry);
  assert.equal(JSON.parse(pendingEntry[1]).description, "短");
});


test("serves valid byte ranges for submitted video", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `range-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const id = "c5e79d30-ca4f-4dfd-be2d-85c0aa6396c9";
  const mediaKey = "community/submissions/media/video.mp4";
  const record = {
    id,
    category: "video",
    title: "测试视频",
    description: "短",
    submitter: "测试投稿人",
    createdAt: new Date().toISOString(),
    status: "approved",
    mediaKey,
    mediaType: "video/mp4",
    mediaName: "video.mp4",
  };
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    MEDIA: {
      get: async (key, options) => {
        if (key.endsWith(`/approved/${id}.json`)) {
          return { json: async () => record };
        }
        if (key === mediaKey) {
          const ranged = Boolean(options);
          return {
            size: 10,
            range: { offset: 0, length: ranged ? 4 : 10, suffix: undefined },
            httpEtag: '"test-etag"',
            body: new Blob([ranged ? "0123" : "0123456789"]).stream(),
            writeHttpMetadata(headers) {
              headers.set("Content-Type", "video/mp4");
            },
          };
          }
        return null;
      },
    },
  };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const response = await worker.fetch(
    new Request(`http://localhost/api/submissions/${id}/media`, {
      headers: { Range: "bytes=0-3" },
    }),
    env,
    context,
  );

  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 0-3/10");
  assert.equal(response.headers.get("content-length"), "4");
  assert.equal(await response.text(), "0123");

  const fullResponse = await worker.fetch(
    new Request(`http://localhost/api/submissions/${id}/media`),
    env,
    context,
  );
  assert.equal(fullResponse.status, 200);
  assert.equal(fullResponse.headers.get("content-range"), null);
  assert.equal(fullResponse.headers.get("content-length"), "10");
  assert.equal(await fullResponse.text(), "0123456789");
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

test("automatically groups multiple uploads into one series", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `multi-series-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const stored = new Map();
  const mediaBinding = {
    put: async (key, value, options = {}) => {
      if (typeof value === "string") {
        stored.set(key, { kind: "text", value, contentType: options.httpMetadata?.contentType });
      } else {
        stored.set(key, {
          kind: "bytes",
          value: await new Response(value).arrayBuffer(),
          contentType: options.httpMetadata?.contentType,
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
        httpEtag: '"series-test-etag"',
        body: new Blob([object.value]).stream(),
        arrayBuffer: async () => object.value,
        writeHttpMetadata(headers) {
          if (object.contentType) headers.set("Content-Type", object.contentType);
        },
      };
    },
    delete: async (keys) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) stored.delete(key);
    },
    list: async ({ prefix }) => ({
      objects: [...stored.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => ({ key })),
    }),
  };
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    MEDIA: mediaBinding,
  };
  const context = { waitUntil() {}, passThroughOnException() {} };

  async function upload(file, name, category) {
    const response = await worker.fetch(
      new Request("http://localhost/api/submission-uploads", {
        method: "PUT",
        headers: {
          "content-length": String(file.size),
          "content-type": file.type,
          "x-file-name": encodeURIComponent(name),
          "x-submission-category": category,
        },
        body: file,
      }),
      env,
      context,
    );
    assert.equal(response.status, 201);
    return response.json();
  }

  const photo = await upload(
    new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" }),
    "系列照片.jpg",
    "photo",
  );
  const video = await upload(
    new Blob(["series-video"], { type: "video/mp4" }),
    "系列视频.mp4",
    "video",
  );
  const body = JSON.stringify({
    category: "series",
    title: "测试混合系列",
    description: "同一次投稿中的照片和视频。",
    submitter: "测试投稿人",
    agreement: true,
    uploads: [photo, video].map(({ uploadId, uploadToken }) => ({ uploadId, uploadToken })),
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
    env,
    context,
  );

  assert.equal(response.status, 201);
  assert.match((await response.json()).message, /2 项内容的系列/);
  const pendingKey = [...stored.keys()].find(
    (key) => key.includes("/pending/") && key.endsWith(".json"),
  );
  assert.ok(pendingKey);
  const pending = JSON.parse(stored.get(pendingKey).value);
  assert.equal(pending.category, "series");
  assert.equal(pending.mediaItems.length, 2);
  assert.deepEqual(
    pending.mediaItems.map((item) => item.mediaName),
    ["系列照片.jpg", "系列视频.mp4"],
  );
  assert.equal(
    [...stored.keys()].some((key) => key.includes("/uploads/") && key.endsWith(".json")),
    false,
  );

  const approvedKey = pendingKey.replace("/pending/", "/approved/");
  stored.set(approvedKey, {
    kind: "text",
    value: JSON.stringify({ ...pending, status: "approved", approvedAt: new Date().toISOString() }),
  });
  const publicList = await worker.fetch(
    new Request("http://localhost/api/submissions?category=series"),
    env,
    context,
  );
  assert.equal(publicList.status, 200);
  const [publicSeries] = (await publicList.json()).submissions;
  assert.equal(publicSeries.category, "series");
  assert.equal(publicSeries.isSeries, true);
  assert.equal(publicSeries.media.length, 2);
  assert.match(publicSeries.media[1].mediaUrl, /\/media\/1$/);

  const secondMedia = await worker.fetch(
    new Request(`http://localhost/api/submissions/${pending.id}/media/1`),
    env,
    context,
  );
  assert.equal(secondMedia.status, 200);
  assert.equal(secondMedia.headers.get("content-type"), "video/mp4");
  assert.equal(await secondMedia.text(), "series-video");
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
