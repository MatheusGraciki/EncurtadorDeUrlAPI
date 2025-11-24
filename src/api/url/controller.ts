import { Request, Response } from "express";
import { createShortUrlService, getOriginalUrlService } from "./service";

export async function createUrl(req: Request, res: Response) {
  try {
    const { shortUrl, originalUrl } = req.body; 

    await createShortUrlService(shortUrl, originalUrl);

    return res.sendStatus(201);

  } catch (error: any) {
    return res.status(400).json({error: error.message });
        
  }
}

export async function getOriginalUrl(req: Request, res: Response) {
  try {
    const { shortUrl } = req.params as { shortUrl: string };

    if (!shortUrl) {
      return res.status(400).json({ error: "shortUrl param is required" });
    }

    const url = await getOriginalUrlService(shortUrl);
    console.debug(url);
    return res.redirect(url as string);
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.toLowerCase().includes("não existe")) {
      return res.status(404).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
}
