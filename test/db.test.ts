import assert from "node:assert/strict";
import test from "node:test";
import {
  createShortUrlDb,
  getOriginalUrlDb,
  LINK_TTL_SECONDS,
  RedisCommands,
  ShortUrlCollisionError,
  ShortUrlNotFoundError,
} from "../src/api/url/db";

class FakeRedis implements RedisCommands {
  readonly values = new Map<string, string>();
  readonly setCalls: unknown[][] = [];

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async set(
    key: string,
    value: string,
    expiryMode: "EX",
    ttlSeconds: number,
    condition: "NX",
  ): Promise<"OK" | null> {
    this.setCalls.push([key, value, expiryMode, ttlSeconds, condition]);
    if (this.values.has(key)) {
      return null;
    }
    this.values.set(key, value);
    return "OK";
  }
}

test("creates a link atomically with the 30-day TTL", async () => {
  const redis = new FakeRedis();
  const result = await createShortUrlDb(
    "https://example.com/path",
    redis,
    () => "abc123",
  );

  assert.deepEqual(result, { shortUrl: "abc123" });
  assert.deepEqual(redis.setCalls[0], [
    "abc123",
    "https://example.com/path",
    "EX",
    LINK_TTL_SECONDS,
    "NX",
  ]);
  assert.equal(LINK_TTL_SECONDS, 2_592_000);
});

test("retries an identifier collision without overwriting the existing link", async () => {
  const redis = new FakeRedis();
  redis.values.set("collision", "https://existing.example");
  const ids = ["collision", "available"];

  const result = await createShortUrlDb(
    "https://new.example",
    redis,
    () => ids.shift() ?? "available",
  );

  assert.deepEqual(result, { shortUrl: "available" });
  assert.equal(redis.values.get("collision"), "https://existing.example");
});

test("fails after repeated collisions", async () => {
  const redis = new FakeRedis();
  redis.values.set("collision", "https://existing.example");

  await assert.rejects(
    createShortUrlDb("https://new.example", redis, () => "collision"),
    ShortUrlCollisionError,
  );
  assert.equal(redis.setCalls.length, 10);
});

test("resolves an existing link and reports an expired or unknown link", async () => {
  const redis = new FakeRedis();
  redis.values.set("exists", "https://example.com");

  assert.equal(await getOriginalUrlDb("exists", redis), "https://example.com");
  await assert.rejects(getOriginalUrlDb("expired", redis), ShortUrlNotFoundError);
});

test("propagates Redis failures to the application layer", async () => {
  const redis: RedisCommands = {
    get: async () => {
      throw new Error("connection failed");
    },
    set: async () => {
      throw new Error("connection failed");
    },
  };

  await assert.rejects(createShortUrlDb("https://example.com", redis));
  await assert.rejects(getOriginalUrlDb("id", redis));
});
