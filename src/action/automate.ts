import ExcelJS from "exceljs";
import { getTeknisi } from "../utils/naker.query";
import { initializeValidationSheet, initializeQuerySheet } from "./sheets";
import { TeknisiType, NIKLamaType, AksesMytechType } from "../types/teknisi";
import { validateTeleAccess, validateOldNIK } from "./validation";

export const automate = async (filePath: string) => {
	try {
		const workbook = new ExcelJS.Workbook();
		workbook.calcProperties.fullCalcOnLoad = true;

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

		const sourceData: any[] = [];
		sourceSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				sourceData.push({
					nik: row.getCell(1).value,
					col2: row.getCell(2).value,
					col3: row.getCell(3).value,
					col4: row.getCell(4).value,
					col5: row.getCell(5).value,
					col6: row.getCell(6).value,
					col7: row.getCell(7).value,
					col8: row.getCell(8).value,
				});
			}
		});

		const teknisiData = await getTeknisi(formatNIK);
		const querySheet = await initializeQuerySheet(workbook);
		const validationSheet = await initializeValidationSheet(workbook);

		const queryRows = Array.isArray(teknisiData)
			? teknisiData
			: teknisiData[0] || [];

		queryRows.forEach((row: TeknisiType) => {
			querySheet.addRow([
				Number(row.nik),
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

		await validateOldNIK(
			workbook,
			validationSheet,
			querySheet,
			querySheetColumnAValues
		);
		await validateTeleAccess(workbook, validationSheet, querySheet);

		const lastRowWithData = validationSheet.actualRowCount;
		for (let row = 2; row <= lastRowWithData; row++) {
			const lookupValue = validationSheet.getCell(`A${row}`).value;

			const matchingQueryRow = queryRows.find(
				(qRow) => Number(qRow.nik) === Number(lookupValue)
			);

			if (matchingQueryRow) {
				validationSheet.getCell(`B${row}`).value = matchingQueryRow.name;
				validationSheet.getCell(`C${row}`).value = matchingQueryRow.witel;
				validationSheet.getCell(`D${row}`).value = matchingQueryRow.regional;
				validationSheet.getCell(`E${row}`).value = matchingQueryRow.no_gsm;
				validationSheet.getCell(`F${row}`).value = matchingQueryRow.email;
				validationSheet.getCell(`G${row}`).value = matchingQueryRow.no_ktp;
				validationSheet.getCell(`H${row}`).value = matchingQueryRow.id_telegram;
				validationSheet.getCell(`I${row}`).value =
					matchingQueryRow.position_name;
				validationSheet.getCell(`J${row}`).value = matchingQueryRow.craft_akses;
			}

			// JavaScript VLOOKUP replacement for columns K through P (Format sheet lookup)
			const matchingSourceRow = sourceData.find(
				(sRow) => Number(sRow.nik) === Number(lookupValue)
			);

			if (matchingSourceRow) {
				validationSheet.getCell(`K${row}`).value = matchingSourceRow.col2;
				validationSheet.getCell(`L${row}`).value = matchingSourceRow.col3;
				validationSheet.getCell(`M${row}`).value = matchingSourceRow.col4;
				validationSheet.getCell(`N${row}`).value = matchingSourceRow.col5;
				validationSheet.getCell(`O${row}`).value = matchingSourceRow.col6;
				validationSheet.getCell(`P${row}`).value = matchingSourceRow.col7;
				validationSheet.getCell(`AB${row}`).value = matchingSourceRow.col8;
			}
		}

		return workbook;
	} catch (error) {
		console.error("Automation error:", error);
		throw error;
	}
};
