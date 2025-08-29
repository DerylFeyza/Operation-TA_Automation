import express from "express";
const app = express();
import {
	getUpdateLogs,
	getCreateTicketLogs,
	getTicketStatusWFM,
	getTicketStatusInsera,
} from "../controllers/ticket.controller";

app.post("/update/logs", getUpdateLogs);
app.post("/create/logs", getCreateTicketLogs);
app.post("/wfm/status", getTicketStatusWFM);
app.post("/insera/status", getTicketStatusInsera);

module.exports = app;
