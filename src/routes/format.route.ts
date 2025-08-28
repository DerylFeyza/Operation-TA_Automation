import express from "express";
const app = express();
import {
	formatExecution,
	formatUploadSCMT,
} from "../controllers/format.controller";
import { upload } from "../lib/multer";

app.post("/postprocess", upload.single("sheet"), formatExecution);
app.post("/scmt", upload.single("file"), formatUploadSCMT);

module.exports = app;
