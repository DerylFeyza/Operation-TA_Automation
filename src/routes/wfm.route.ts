import express from "express";
const app = express();
import {
	getLatestWFMOTP,
	getLatestINSERAOTP,
} from "../controllers/wfm.controller";

app.get("/otp", getLatestWFMOTP);
app.get("/test", getLatestINSERAOTP);
module.exports = app;
