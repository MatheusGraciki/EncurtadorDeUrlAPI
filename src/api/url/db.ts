import "dotenv/config";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function createShortUrlDb(shortUrl: string, originalUrl: string) {
  const exists = await redis.get(shortUrl);

  if (exists) {
    throw new Error("this shortUrl already exists");
  }

  await redis.set(shortUrl, originalUrl, { ex: 60 * 60 * 24 * 30 }); 

  return { shortUrl, originalUrl };
}

export async function getOriginalUrlDb(shortUrl:string) {
  const url  = await redis.get(shortUrl) 

  if (!url) {
    throw new Error("this shortUrl does not exist");
  }
  return url
}