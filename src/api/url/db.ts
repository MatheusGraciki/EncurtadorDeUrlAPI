import { randomBytes } from "node:crypto";
import { getRedisClient } from "../../redis";

export const LINK_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_ID_ATTEMPTS = 10;

export interface RedisCommands {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    expiryMode: "EX",
    ttlSeconds: number,
    condition: "NX",
  ): Promise<"OK" | null>;
}

export class ShortUrlNotFoundError extends Error {
  constructor() {
    super("this shortUrl does not exist");
    this.name = "ShortUrlNotFoundError";
  }
}

export class ShortUrlCollisionError extends Error {
  constructor() {
    super("Unable to generate a unique short URL");
    this.name = "ShortUrlCollisionError";
  }
}

export async function createShortUrlDb(
  originalUrl: string,
  redis: RedisCommands = getRedisClient(),
  generateId: () => string = () => randomBytes(6).toString("hex"),
): Promise<{ shortUrl: string }> {
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
    const shortUrl = generateId();
    const result = await redis.set(
      shortUrl,
      originalUrl,
      "EX",
      LINK_TTL_SECONDS,
      "NX",
    );

    if (result === "OK") {
      return { shortUrl };
    }
  }

  throw new ShortUrlCollisionError();
}

export async function getOriginalUrlDb(
  shortUrl: string,
  redis: RedisCommands = getRedisClient(),
): Promise<string> {
  const url = await redis.get(shortUrl);
  if (url === null) {
    throw new ShortUrlNotFoundError();
  }
  return url;
}
