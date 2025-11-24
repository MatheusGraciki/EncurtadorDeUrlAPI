"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUrl = createUrl;
exports.getOriginalUrl = getOriginalUrl;
const service_1 = require("./service");
async function createUrl(req, res) {
    try {
        const { shortUrl, originalUrl } = req.body;
        await (0, service_1.createShortUrlService)(shortUrl, originalUrl);
        return res.sendStatus(201);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}
async function getOriginalUrl(req, res) {
    try {
        const { shortUrl } = req.params;
        if (!shortUrl) {
            return res.status(400).json({ error: "shortUrl param is required" });
        }
        const url = await (0, service_1.getOriginalUrlService)(shortUrl);
        console.debug(url);
        return res.redirect(url);
    }
    catch (error) {
        const msg = error?.message || String(error);
        if (msg.toLowerCase().includes("não existe")) {
            return res.status(404).json({ error: msg });
        }
        return res.status(500).json({ error: msg });
    }
}
