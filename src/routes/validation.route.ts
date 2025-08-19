import express from "express";
const app = express();
import {
	automateValidation,
	accessNIK,
} from "../controllers/validation.controller";
import { upload } from "../lib/multer";

app.post("/upload", upload.single("sheet"), automateValidation);
app.post("/admin/approve", automateValidation);
app.get("/nik/:id", accessNIK);

module.exports = app;
