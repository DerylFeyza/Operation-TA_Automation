const express = require("express");
const cookieParser = require("cookie-parser");
import dotenv from "dotenv";
dotenv.config();
import multer from "multer";
import { automate, postprocess } from "./action/automate";
import { getTeknisi } from "./utils/naker.query";
import type { Request, Response } from "express";
import { getAllUserLabor } from "./action/validation";
import {
	trackUser,
	checkApprovalExist,
	checkPersonId,
	getTechnicianWarehouse,
	approveTeknisi,
} from "./utils/idmt/api";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
	res.send("NDE Format Automation API by deryl");
});

app.post(
	"/upload",
	upload.single("sheet"),
	async (req: Request, res: Response) => {
		try {
			const filePath = req?.file?.path;
			if (!filePath) return res.status(400).send("No file uploaded");

			const processedWorkbook = await automate(filePath);
			res.setHeader(
				"Content-Disposition",
				"attachment; filename=processed.xlsx"
			);
			res.setHeader(
				"Content-Type",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			);

			await processedWorkbook.xlsx.write(res);
			res.end();

			fs.unlinkSync(filePath);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error processing Excel file");
		}
	}
);

app.post(
	"/postprocess",
	upload.single("sheet"),
	async (req: Request, res: Response) => {
		try {
			const filePath = req?.file?.path;
			if (!filePath) return res.status(400).send("No file uploaded");

			const processedWorkbook = await postprocess(filePath);
			res.setHeader(
				"Content-Disposition",
				"attachment; filename=processed.xlsx"
			);
			res.setHeader(
				"Content-Type",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			);

			await processedWorkbook.xlsx.write(res);
			res.end();

			fs.unlinkSync(filePath);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error processing Excel file");
		}
	}
);

app.post("/technician/track", async (req: Request, res: Response) => {
	try {
		const adminCookie = req.cookies.idmt_admin;
		const { nik, output } = req.body;

		if (!nik) {
			return res.status(400).json({ error: "NIK is required" });
		}

		const trackedData = await Promise.all(
			nik.map((singleNik: string) => trackUser(singleNik, adminCookie))
		);

		if (output === "csv") {
			const { Parser } = require("json2csv");
			const json2csvParser = new Parser();
			const csv = json2csvParser.parse(trackedData);
			res.header("Content-Type", "text/csv");
			res.attachment("tracked_data.csv");
			return res.send(csv);
		}

		return res.json(trackedData);
	} catch (err) {
		console.error(err);
		res.status(500).send("Error tracking person file");
	}
});

app.post("/technician/warehouse", async (req: Request, res: Response) => {
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
			const { Parser } = require("json2csv");
			const json2csvParser = new Parser();
			const csv = json2csvParser.parse(trackedWarehouseData);
			res.header("Content-Type", "text/csv");
			res.attachment("tracked_warehouse.csv");
			return res.send(csv);
		}

		return res.json(trackedWarehouseData);
	} catch (err) {
		console.error(err);
		res.status(500).send("Error tracking person file");
	}
});

app.post("/admin/approval/list", async (req: Request, res: Response) => {
	try {
		const adminCookie = req.cookies.idmt_admin;
		const { labor } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const trackedData = await Promise.all(
			labor.map((singleLabor: string) =>
				checkApprovalExist(singleLabor, adminCookie)
			)
		);

		return res.json(trackedData);
	} catch (err) {
		console.error(err);
		res.status(500).send("Error tracking person file");
	}
});

app.post("/superadmin/approval/list", async (req: Request, res: Response) => {
	try {
		const superAdminCookie = req.cookies.idmt_superadmin;
		const { labor } = req.body;

		if (!labor) {
			return res.status(400).json({ error: "Labor is required" });
		}

		const trackedData = await Promise.all(
			labor.map((singleLabor: string) =>
				checkApprovalExist(singleLabor, superAdminCookie)
			)
		);

		return res.json(trackedData);
	} catch (err) {
		console.error(err);
		res.status(500).send("Error tracking person file");
	}
});

app.post("/superadmin/approve", async (req: Request, res: Response) => {
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
			const { Parser } = require("json2csv");
			const json2csvParser = new Parser();
			const csv = json2csvParser.parse(approveResult);
			res.header("Content-Type", "text/csv");
			res.attachment("approve_result_mbaeva.csv");
			return res.send(csv);
		}

		return res.json(approveResult);
	} catch (err) {
		console.error(err);
		res.status(500).send("Error tracking person file");
	}
});

app.post("/admin/approve", async (req: Request, res: Response) => {
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
			const { Parser } = require("json2csv");
			const json2csvParser = new Parser();
			const csv = json2csvParser.parse(approveResult);
			res.header("Content-Type", "text/csv");
			res.attachment("approve_result_masruli.csv");
			return res.send(csv);
		}

		return res.json(approveResult);
	} catch (err) {
		console.error(err);
		res.status(500).send("Error tracking person file");
	}
});

app.get("/cek-allow/:id", async (req: Request, res: Response) => {
	try {
		const id = req.params.id;
		const teknisiData = await getTeknisi(id ? [id] : []);
		if (teknisiData.length == 0) {
			return res.status(404).send("Teknisi Not Found");
		}
		let allow = true;

		// if (!teknisiData[0].id_telegram) {
		// 	return res.status(400).json({
		// 		allow: false,
		// 		message: "Tidak Memiliki ID Telegram di DB Naker",
		// 		data: teknisiData,
		// 	});
		// }

		const laborAccess = await getAllUserLabor(id, teknisiData[0].id_telegram);
		if (laborAccess.length === 0) {
			return res.status(400).json({
				allow: true,
				message: "Tidak Memiliki Akses Labor Di NIK Lama",
				data: teknisiData,
			});
		}

		const hasRejections = laborAccess.some((access) => access.reject === true);
		if (hasRejections) {
			allow = false;
		}
		return res.json({
			allow: allow,
			data: teknisiData,
			laborAccess: laborAccess,
		});
	} catch (err) {
		console.error(err);
		res.status(500).send("Error fetching teknisi data");
	}
});

app.listen(process.env.PORT || 3003, () => {
	console.log(`Server running on http://localhost:${process.env.PORT || 3003}`);
});
