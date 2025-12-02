import dotenv from "dotenv";
import express from "express";
import urlRoutes from "./api/url/routes";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/", urlRoutes);

export default app;