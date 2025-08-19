import express from "express";
const app = express();
import {
	trackTechnicians,
	technicianWarehouses,
	adminApprove,
} from "../controllers/technician.controller";

app.post("/track", trackTechnicians);
app.post("/admin/approve", adminApprove);
app.post("/warehouse", technicianWarehouses);

module.exports = app;
