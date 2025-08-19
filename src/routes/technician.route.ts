import express from "express";
const app = express();
import {
	trackTechnicians,
	technicianWarehouses,
	adminApprove,
	superadminApprove,
	completeApprove,
} from "../controllers/technician.controller";
import { requireAdminCookie, requireSuperAdminCookie } from "../auth/idmt.auth";

app.post("/track", requireAdminCookie, trackTechnicians);
app.post(
	"/approve",
	requireAdminCookie,
	requireSuperAdminCookie,
	completeApprove
);
app.post("/admin/approve", requireAdminCookie, adminApprove);
app.post("/superadmin/approve", requireSuperAdminCookie, superadminApprove);
app.post("/warehouse", requireAdminCookie, technicianWarehouses);

module.exports = app;
