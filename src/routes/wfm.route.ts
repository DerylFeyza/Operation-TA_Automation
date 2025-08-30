import express from "express";
const app = express();
import { getLatestWFMOTP } from "../controllers/wfm.controller";

app.get("/otp", getLatestWFMOTP);
module.exports = app;
