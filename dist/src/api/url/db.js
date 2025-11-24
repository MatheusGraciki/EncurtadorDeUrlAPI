"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShortUrlDb = createShortUrlDb;
exports.getOriginalUrlDb = getOriginalUrlDb;
require("dotenv/config");
const redis_1 = require("@upstash/redis");
const redis = new redis_1.Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
});
async function createShortUrlDb(shortUrl, originalUrl) {
    const exists = await redis.get(shortUrl);
    if (exists) {
        throw new Error("this shortUrl already exists");
    }
    await redis.set(shortUrl, originalUrl, { ex: 60 * 60 * 24 * 30 });
    return { shortUrl, originalUrl };
}
async function getOriginalUrlDb(shortUrl) {
    const url = await redis.get(shortUrl);
    if (!url) {
        throw new Error("this shortUrl does not exist");
    }
    return url;
}
