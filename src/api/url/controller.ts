import { Request, Response } from "express";
import { ShortUrlCollisionError, ShortUrlNotFoundError } from "./db";
import { UrlService } from "./service";

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_048) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createUrlController(service: UrlService) {
  return async function createUrl(req: Request, res: Response): Promise<void> {
    const originalUrl = req.body?.originalUrl;
    if (!isValidHttpUrl(originalUrl)) {
      res.status(400).json({ error: "originalUrl must be a valid HTTP(S) URL" });
      return;
    }

    try {
      const data = await service.create(originalUrl);
      res.status(201).json({ data });
    } catch (error) {
      if (error instanceof ShortUrlCollisionError) {
        res.status(503).json({ error: "Unable to create a short URL" });
        return;
      }
      console.error("Failed to create short URL");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  };
}

export function getOriginalUrlController(service: UrlService) {
  return async function getOriginalUrl(req: Request, res: Response): Promise<void> {
    const { shortUrl } = req.params as { shortUrl?: string };
    if (!shortUrl) {
      res.status(400).json({ error: "shortUrl param is required" });
      return;
    }

    try {
      const url = await service.resolve(shortUrl);
      res.redirect(url);
    } catch (error) {
      if (error instanceof ShortUrlNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error("Failed to resolve short URL");
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  };
}
