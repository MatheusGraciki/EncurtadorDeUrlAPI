"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
// use a descriptive param name so it's clear in controller/service
router.get("/:shortUrl", controller_1.getOriginalUrl);
router.post("/create", controller_1.createUrl);
exports.default = router;
