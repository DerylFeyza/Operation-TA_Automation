import type { Request, Response } from "express";
import { formatUnggahTeknisi, formatSCMT } from "../services/format.service";
import { getCurrentTime } from "../utils/utils";
import fs from "fs";
import ExcelJS from "exceljs";
const XLSX = require("xlsx");
const path = require("path");

export const formatExecution = async (req: Request, res: Response) => {
	try {
		const filePath = req?.file?.path;
		if (!filePath) return res.status(400).send("No file uploaded");

		const workbook = new ExcelJS.Workbook();
		workbook.calcProperties.fullCalcOnLoad = true;

		await workbook.xlsx.readFile(filePath);

		const sourceSheet = workbook.getWorksheet("validation");
		if (!sourceSheet) {
			throw new Error("validation sheet not found");
		}

		let hasUnggahTeknisi = false;
		sourceSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (!hasUnggahTeknisi && rowNumber >= 2) {
				const cellValue = row.getCell("AF").value;
				if (
					cellValue === true ||
					(typeof cellValue === "string" && cellValue.toLowerCase() === "true")
				) {
					hasUnggahTeknisi = true;
				}
			}
		});

		if (hasUnggahTeknisi) {
			await formatUnggahTeknisi(workbook);
		}

		await formatSCMT(workbook);

		res.setHeader(
			"Content-Disposition",
			`attachment; filename=processed_${getCurrentTime()}.xlsx`
		);
		res.setHeader(
			"Content-Type",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		);

		await workbook.xlsx.write(res);
		res.end();

		fs.unlinkSync(filePath);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error processing Excel file");
	}
};

export const formatUploadSCMT = async (req: Request, res: Response) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}

	const originalName = req.file.originalname;
	const ext = path.extname(originalName).toLowerCase();
	const filePath = req?.file?.path;
	if (!filePath) return res.status(400).send("No file uploaded");
	let header = [];
	let dataRows = [];

	try {
		if (ext === ".csv") {
			let raw = fs.readFileSync(filePath, "utf-8");
			fs.unlinkSync(filePath);

			raw = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

			const lines = raw.trim().split("\n");
			if (lines.length < 2) {
				return res
					.status(400)
					.send("File harus punya header dan minimal 1 data");
			}
			const delimiter = lines[0].includes("\t") ? "\t" : ",";

			header = lines[0].split(delimiter).map((cell) => cell.trim());
			dataRows = lines
				.slice(1)
				.map((line) => line.split(delimiter).map((cell) => cell.trim()));
		} else if (ext === ".xlsx") {
			const workbook = XLSX.readFile(filePath);
			fs.unlinkSync(filePath);
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

			if (jsonData.length < 2) {
				return res
					.status(400)
					.send("Excel harus punya header dan minimal 1 data");
			}

			header = jsonData[0].map((cell) => String(cell).trim());
			dataRows = jsonData
				.slice(1)
				.map((row) => row.map((cell) => String(cell || "").trim()));
		} else {
			fs.unlinkSync(filePath);
			return res
				.status(400)
				.send("Format file tidak didukung. Gunakan .csv atau .xlsx");
		}

		const outputLines = [
			header.join(";"),
			...dataRows.map((cols) => cols.join(";")),
		];

		const finalCSV = outputLines.join("\n");
		const outputFile = `output_add_wh_${Date.now()}.csv`;
		const outputPath = path.join(__dirname, outputFile);

		fs.writeFileSync(outputPath, finalCSV, "utf-8");

		res.download(outputPath, outputFile, (err) => {
			fs.unlinkSync(outputPath);
			if (err) console.error("Download error:", err);
		});
	} catch (err) {
		console.error("Processing error:", err);
		fs.unlinkSync(filePath);
		res.status(500).send("Terjadi kesalahan saat memproses file.");
	}
};
