import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import test from "node:test";
import { createApp } from "../src/app";
import { ShortUrlNotFoundError } from "../src/api/url/db";
import { UrlService } from "../src/api/url/service";

async function withApp(
  service: UrlService,
  run: (baseUrl: string) => Promise<void>,
  isReady: () => Promise<boolean> = async () => true,
): Promise<void> {
  const server = createApp({ urlService: service, isReady }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const workingService: UrlService = {
  create: async () => ({ shortUrl: "abc123" }),
  resolve: async (shortUrl) => {
    if (shortUrl === "missing") {
      throw new ShortUrlNotFoundError();
    }
    return "https://example.com/destination";
  },
};

test("exposes liveness, readiness, and the existing CI endpoint", async () => {
  await withApp(workingService, async (baseUrl) => {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });

    const ready = await fetch(`${baseUrl}/ready`);
    assert.equal(ready.status, 200);

    const ci = await fetch(`${baseUrl}/testCiCD`);
    assert.equal(await ci.text(), "Hello World");
  });
});

test("creates and resolves links without changing the public response contract", async () => {
  await withApp(workingService, async (baseUrl) => {
    const created = await fetch(`${baseUrl}/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ originalUrl: "https://example.com/long" }),
    });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), { data: { shortUrl: "abc123" } });

    const resolved = await fetch(`${baseUrl}/abc123`, { redirect: "manual" });
    assert.equal(resolved.status, 302);
    assert.equal(resolved.headers.get("location"), "https://example.com/destination");
  });
});

test("validates URL input and returns 404 for unknown or expired identifiers", async () => {
  await withApp(workingService, async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ originalUrl: "javascript:alert(1)" }),
    });
    assert.equal(invalid.status, 400);

    const missing = await fetch(`${baseUrl}/missing`);
    assert.equal(missing.status, 404);
  });
});

test("does not expose Redis errors and reports failed readiness", async () => {
  const failingService: UrlService = {
    create: async () => {
      throw new Error("redis://user:secret@redis:6379");
    },
    resolve: async () => {
      throw new Error("redis://user:secret@redis:6379");
    },
  };

  await withApp(
    failingService,
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/create`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ originalUrl: "https://example.com" }),
      });
      assert.equal(response.status, 503);
      assert.equal((await response.text()).includes("secret"), false);

      const ready = await fetch(`${baseUrl}/ready`);
      assert.equal(ready.status, 503);
    },
    async () => false,
  );
});
