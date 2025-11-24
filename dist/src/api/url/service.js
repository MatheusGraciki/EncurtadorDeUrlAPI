"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShortUrlService = createShortUrlService;
exports.getOriginalUrlService = getOriginalUrlService;
const db_1 = require("./db");
async function createShortUrlService(shortUrl, originalUrl) {
    try {
        const data = await (0, db_1.createShortUrlDb)(shortUrl, originalUrl);
        return data;
    }
    catch (error) {
        throw error;
    }
}
async function getOriginalUrlService(shortUrl) {
    try {
        return await (0, db_1.getOriginalUrlDb)(shortUrl);
    }
    catch (error) {
        throw error;
    }
}
