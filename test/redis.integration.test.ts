import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import Redis from "ioredis";
import {
  createShortUrlDb,
  getOriginalUrlDb,
  LINK_TTL_SECONDS,
  ShortUrlNotFoundError,
} from "../src/api/url/db";

const redisUrl = process.env.TEST_REDIS_URL;

test(
  "creates, resolves, expires, and handles collisions with ioredis",
  { skip: redisUrl ? false : "TEST_REDIS_URL is not configured" },
  async () => {
    const redis = new Redis(redisUrl as string, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    const prefix = `integration:${randomBytes(8).toString("hex")}`;
    const collision = `${prefix}:collision`;
    const available = `${prefix}:available`;
    const expired = `${prefix}:expired`;

    try {
      await redis.connect();
      await redis.set(collision, "https://existing.example", "EX", 60);
      const ids = [collision, available];

      const created = await createShortUrlDb(
        "https://new.example",
        redis,
        () => ids.shift() ?? available,
      );

      assert.deepEqual(created, { shortUrl: available });
      assert.equal(await redis.get(collision), "https://existing.example");
      assert.equal(await getOriginalUrlDb(available, redis), "https://new.example");
      const ttl = await redis.ttl(available);
      assert.ok(ttl > LINK_TTL_SECONDS - 5 && ttl <= LINK_TTL_SECONDS);

      await redis.set(expired, "https://expired.example", "PX", 10);
      await new Promise((resolve) => setTimeout(resolve, 30));
      await assert.rejects(getOriginalUrlDb(expired, redis), ShortUrlNotFoundError);
    } finally {
      await redis.del(collision, available, expired);
      await redis.quit();
    }
  },
);
