import "dotenv/config";
import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function createShortUrlDb(originalUrl: string) {
  const MAX_ATTEMPTS = 10;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const shortUrl = randomBytes(6).toString("hex");
    const exists = await redis.get(shortUrl);

    if (!exists) {
      await redis.set(shortUrl, originalUrl, { ex: 60 * 60 * 24 * 30 });
      return { shortUrl };
    }
    console.error(`Colisão detectada para shortUrl "${shortUrl}", tentando novamente...`);
  }
  throw new Error("Não foi possível gerar uma shortUrl única após várias tentativas.");
}

export async function getOriginalUrlDb(shortUrl:string) {
  const url  = await redis.get(shortUrl) 

  if (!url) {
    throw new Error("this shortUrl does not exist");
  }
  return url
}