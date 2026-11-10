import {
  createShortUrlDb,
  getOriginalUrlDb,
  RedisCommands,
} from "./db";

export interface UrlService {
  create(originalUrl: string): Promise<{ shortUrl: string }>;
  resolve(shortUrl: string): Promise<string>;
}

export function createUrlService(redis?: RedisCommands): UrlService {
  return {
    create: (originalUrl) => createShortUrlDb(originalUrl, redis),
    resolve: (shortUrl) => getOriginalUrlDb(shortUrl, redis),
  };
}

const defaultService = createUrlService();

export const createShortUrlService = defaultService.create;
export const getOriginalUrlService = defaultService.resolve;
