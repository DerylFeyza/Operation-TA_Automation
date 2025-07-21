const express = require("express");
import dotenv from "dotenv";
dotenv.config();
import multer from "multer";
import { automate } from "./action/automate";
import { getTeknisi } from "./utils/naker.query";
import { getAksesSCMT } from "./utils/operation.query";
import type { Request, Response } from "express";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

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

app.listen(process.env.PORT || 3003, () => {
	console.log(`Server running on http://localhost:${process.env.PORT || 3003}`);
});
