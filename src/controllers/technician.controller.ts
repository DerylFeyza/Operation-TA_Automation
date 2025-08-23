import type { Response } from "express";
import { trackUser, approveTeknisi } from "../utils/idmt/api";
import {
	checkPersonId,
	getTechnicianWarehouse,
	checkApprovalExist,
} from "../utils/idmt/api";
import { csvOutput } from "../lib/json2csv";
import { AuthenticatedIDMTRequest } from "../auth/idmt.auth";

export const trackTechnicians = async (
	req: AuthenticatedIDMTRequest,
	res: Response
) => {
	try {
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const trackedData = await Promise.all(
			labor.map((singleLabor: string) =>
				trackUser(singleLabor, req.adminCookie)
			)
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

export const technicianWarehouses = async (
	req: AuthenticatedIDMTRequest,
	res: Response
) => {
	try {
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const trackedData = await Promise.all(
			labor.map((singleLabor: string) =>
				checkPersonId(singleLabor, req.adminCookie)
			)
		);

		const trackedWarehouseData = await Promise.all(
			trackedData.map((data) =>
				getTechnicianWarehouse(data.labor, data.personId, req.adminCookie)
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

export const adminApprove = async (
	req: AuthenticatedIDMTRequest,
	res: Response
) => {
	try {
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const personIdMapping = await Promise.all(
			labor.map((singleLabor: string) =>
				checkApprovalExist(singleLabor, req.adminCookie)
			)
		);

		const approveResult = await Promise.all(
			personIdMapping.map((data) =>
				approveTeknisi(data.labor, data.personId, req.adminCookie)
			)
		);

		if (output === "csv") {
			return csvOutput(approveResult, res);
		}

		return res.json(approveResult);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error approving technician with admin");
	}
};

export const superadminApprove = async (
	req: AuthenticatedIDMTRequest,
	res: Response
) => {
	try {
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const personIdMapping = await Promise.all(
			labor.map((singleLabor: string) =>
				checkApprovalExist(singleLabor, req.superAdminCookie)
			)
		);

		const approveResult = await Promise.all(
			personIdMapping.map((data) =>
				approveTeknisi(data.labor, data.personId, req.superAdminCookie)
			)
		);

		if (output === "csv") {
			return csvOutput(approveResult, res);
		}

		return res.json(approveResult);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error approving technician with superadmin");
	}
};

export const completeApprove = async (
	req: AuthenticatedIDMTRequest,
	res: Response
) => {
	try {
		const { labor, output } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		if (!req.adminCookie || !req.superAdminCookie) {
			return res.status(401).json({
				error:
					"Both admin and superadmin cookies are required for complete approval",
			});
		}

		const adminPersonIdMapping = await Promise.all(
			labor.map((singleLabor: string) =>
				checkApprovalExist(singleLabor, req.adminCookie)
			)
		);

		const adminApproveResults = await Promise.all(
			adminPersonIdMapping.map((data) =>
				approveTeknisi(data.labor, data.personId, req.adminCookie)
			)
		);

		const superadminPersonIdMapping = await Promise.all(
			labor.map((singleLabor: string) =>
				checkApprovalExist(singleLabor, req.superAdminCookie)
			)
		);

		const superadminApproveResults = await Promise.all(
			superadminPersonIdMapping.map((data) =>
				approveTeknisi(data.labor, data.personId, req.superAdminCookie)
			)
		);

		const combinedResults = labor.map((singleLabor: string, index: number) => ({
			labor: singleLabor,
			adminPersonId: adminPersonIdMapping[index]?.personId || null,
			adminApproveResult: adminApproveResults[index]?.data || null,
			superadminPersonId: superadminPersonIdMapping[index]?.personId || null,
			superadminApproveResult: superadminApproveResults[index]?.data || null,
		}));

		if (output === "csv") {
			return csvOutput(combinedResults, res);
		}

		return res.json(combinedResults);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error performing complete approval");
	}
};
