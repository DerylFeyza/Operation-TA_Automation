import type { Request, Response } from "express";
import { formatUnggahTeknisi, formatSCMT } from "../services/format.service";
import fs from "fs";
import ExcelJS from "exceljs";

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

		res.setHeader("Content-Disposition", "attachment; filename=processed.xlsx");
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
