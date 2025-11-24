import { createShortUrlDb, getOriginalUrlDb } from "./db";

export async function createShortUrlService(shortUrl: string, originalUrl: string) {
  try {
    const data = await createShortUrlDb(shortUrl, originalUrl);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getOriginalUrlService(shortUrl: string) {
  try {
    return await getOriginalUrlDb(shortUrl);
  } catch (error) {
    throw error;
  }
}