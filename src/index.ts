const express = require("express");
import dotenv from "dotenv";
dotenv.config();
import multer from "multer";
import { automate } from "./action/automate";
import { getTeknisi } from "./utils/naker.query";
import type { Request, Response } from "express";
import { getAllUserLabor } from "./action/validation";
import { TeknisiType } from "./types/teknisi";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

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

app.get("/cek-allow/:id", async (req: Request, res: Response) => {
	try {
		const id = req.params.id;
		const teknisiData = await getTeknisi(id ? [id] : []);
		if (teknisiData.length == 0) {
			return res.status(404).send("Teknisi Not Found");
		}
		let allow = true;

		if (!teknisiData[0].id_telegram) {
			return res.status(400).json({
				allow: false,
				message: "Tidak Memiliki ID Telegram di DB Naker",
				data: teknisiData,
			});
		}

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
