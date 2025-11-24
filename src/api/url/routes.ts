import { Router } from "express";
import { createUrl, getOriginalUrl } from "./controller";

const router = Router();

// use a descriptive param name so it's clear in controller/service
router.get("/:shortUrl", getOriginalUrl);

router.post("/create", createUrl);

export default router;
