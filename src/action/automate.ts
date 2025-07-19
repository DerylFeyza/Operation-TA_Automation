import ExcelJS from "exceljs";
import { getTeknisi } from "../utils/naker.query";
import { initializeValidationSheet, initializeQuerySheet } from "./sheets";

export const automate = async (filePath: string) => {
	try {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(filePath);

		const sourceSheet = workbook.getWorksheet("Format");
		if (!sourceSheet) {
			throw new Error("Format sheet not found");
		}

		const formatNIK: any[] = [];
		sourceSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				const cellValue = row.getCell(1).value;
				formatNIK.push(cellValue);
			}
		});

		console.log("Column A values:", formatNIK);
		const teknisiData = await getTeknisi(formatNIK);
		console.log("Database results:", teknisiData);
		const querySheet = await initializeQuerySheet(workbook);
		const validationSheet = await initializeValidationSheet(workbook);

		const rows = Array.isArray(teknisiData)
			? teknisiData
			: teknisiData[0] || [];
		rows.forEach((row: any) => {
			querySheet.addRow([
				row.nik,
				row.name,
				row.witel,
				row.regional,
				row.no_gsm,
				row.email,
				row.no_ktp,
				row.id_telegram,
				row.position_name,
				row.craft_akses,
			]);
		});

		//create labor from new NIK
		const querySheetColumnAValues: any[] = [];
		querySheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				const cellValue = row.getCell(1).value;
				querySheetColumnAValues.push(cellValue);
			}
		});

		querySheetColumnAValues.forEach((value, index) => {
			const targetRow = index + 2;
			validationSheet.getCell(`A${targetRow}`).value = value;
			validationSheet.getCell(`Q${targetRow}`).value = value;
		});

		return workbook;
	} catch (error) {
		console.error("Automation error:", error);
		throw error;
	}
};
