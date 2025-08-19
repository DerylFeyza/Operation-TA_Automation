import type { Request, Response } from "express";
import { trackUser, approveTeknisi } from "../utils/idmt/api";
import { checkPersonId, getTechnicianWarehouse } from "../utils/idmt/api";
import { csvOutput } from "../lib/json2csv";

export const trackTechnicians = async (req: Request, res: Response) => {
	try {
		const adminCookie = req.cookies.idmt_admin;
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const trackedData = await Promise.all(
			labor.map((singleLabor: string) => trackUser(singleLabor, adminCookie))
		);

		if (output === "csv") {
			csvOutput(trackedData, res);
		}

		return res.json(trackedData);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error tracking person");
	}
};

export const technicianWarehouses = async (req: Request, res: Response) => {
	try {
		const adminCookie = req.cookies.idmt_admin;
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const trackedData = await Promise.all(
			labor.map((singleLabor: string) =>
				checkPersonId(singleLabor, adminCookie)
			)
		);

		const trackedWarehouseData = await Promise.all(
			trackedData.map((data) =>
				getTechnicianWarehouse(data.labor, data.personId, adminCookie)
			)
		);

		if (output === "csv") {
			csvOutput(trackedData, res);
		}

		return res.json(trackedWarehouseData);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error getting technician warehouse");
	}
};

export const adminApprove = async (req: Request, res: Response) => {
	try {
		const adminCookie = req.cookies.idmt_admin;
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const personIdMapping = await Promise.all(
			labor.map((singleLabor: string) =>
				checkPersonId(singleLabor, adminCookie)
			)
		);

		const approveResult = await Promise.all(
			personIdMapping.map((data) =>
				approveTeknisi(data.labor, data.personId, adminCookie)
			)
		);

		if (output === "csv") {
			csvOutput(approveResult, res);
		}

		return res.json(approveResult);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error approving technician with admin");
	}
};

export const superadminApprove = async (req: Request, res: Response) => {
	try {
		const superAdminCookie = req.cookies.idmt_superadmin;
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const personIdMapping = await Promise.all(
			labor.map((singleLabor: string) =>
				checkPersonId(singleLabor, superAdminCookie)
			)
		);

		const approveResult = await Promise.all(
			personIdMapping.map((data) =>
				approveTeknisi(data.labor, data.personId, superAdminCookie)
			)
		);

		if (output === "csv") {
			csvOutput(approveResult, res);
		}

		return res.json(approveResult);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error approving technician with superadmin");
	}
};
