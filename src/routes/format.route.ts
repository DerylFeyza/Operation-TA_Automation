import express from "express";
const app = express();
import { formatExecution } from "../controllers/format.controller";

app.post("/postprocess", formatExecution);

module.exports = app;
