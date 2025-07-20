import ExcelJS from "exceljs";
import { getTeknisi, cekNIKLama } from "../utils/naker.query";
import {
	initializeValidationSheet,
	initializeQuerySheet,
	initializeNIKLama1Sheet,
	initializeNIKLama2Sheet,
} from "./sheets";
import { TeknisiType, NIKLamaType } from "../types/teknisi";
import { getAksesTele } from "../utils/operation.query";

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

		//cek NIK lama
		const nikLama1Data = await cekNIKLama(querySheetColumnAValues);
		if (nikLama1Data.length > 0) {
			const nikLama1Sheet = await initializeNIKLama1Sheet(workbook);
			const nikLama1Rows = Array.isArray(nikLama1Data)
				? nikLama1Data
				: nikLama1Data[0] || [];

			nikLama1Rows.forEach((row: NIKLamaType) => {
				nikLama1Sheet.addRow([Number(row.nik_baru), Number(row.nik_lama)]);
			});

			//create labor from nik lama 1
			const nikLama1ColumnAValues: any[] = [];
			const nikLama1ColumnBValues: any[] = [];
			nikLama1Sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber >= 2) {
					const cellValueA = row.getCell(1).value; // Column A
					const cellValueB = row.getCell(2).value; // Column B
					nikLama1ColumnAValues.push(cellValueA);
					nikLama1ColumnBValues.push(cellValueB);
				}
			});

			const startRow = validationSheet.actualRowCount + 1;
			nikLama1ColumnAValues.forEach((valueA, index) => {
				const targetRow = startRow + index;
				const valueB = nikLama1ColumnBValues[index];

				validationSheet.getCell(`A${targetRow}`).value = valueA;
				validationSheet.getCell(`Q${targetRow}`).value = valueB;
			});

			//check nik lama 2
			const nikLama2Data = await cekNIKLama(nikLama1ColumnBValues);
			if (nikLama2Data.length > 0) {
				const nikLama2Sheet = await initializeNIKLama2Sheet(workbook);
				const nikLama2Rows = Array.isArray(nikLama2Data)
					? nikLama2Data
					: nikLama2Data[0] || [];

				nikLama2Rows.forEach((row: NIKLamaType) => {
					const matchIndex = nikLama1ColumnBValues.findIndex(
						(val) => Number(val) === Number(row.nik_baru)
					);
					const calculatedValue =
						matchIndex !== -1 ? nikLama1ColumnAValues[matchIndex] : null;
					nikLama2Sheet.addRow([
						calculatedValue,
						Number(row.nik_baru),
						Number(row.nik_lama),
					]);
				});

				//create labor from nik lama 2
				const nikLama2ColumnAValues: any[] = [];
				const nikLama2ColumnCValues: any[] = [];
				nikLama2Sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
					if (rowNumber >= 2) {
						const cellValueA = row.getCell(1).value;
						const cellValueC = row.getCell(3).value;
						nikLama2ColumnAValues.push(cellValueA);
						nikLama2ColumnCValues.push(cellValueC);
					}
				});

				const startRow = validationSheet.actualRowCount + 1;
				nikLama2ColumnAValues.forEach((valueA, index) => {
					const targetRow = startRow + index;
					const valueC = nikLama2ColumnCValues[index];
					validationSheet.getCell(`A${targetRow}`).value = valueA;
					validationSheet.getCell(`Q${targetRow}`).value = valueC;
				});
			}
		}

		//fill validation data
		const lastRowWithData = validationSheet.actualRowCount;
		const queryLastRow = querySheet.actualRowCount;
		const sourceLastRow = sourceSheet.actualRowCount;

		// Fill columns B through J with VLOOKUP formulas
		for (let row = 2; row <= lastRowWithData; row++) {
			var lookup = 2;

			for (let col = 2; col <= 10; col++) {
				const columnLetter = String.fromCharCode(64 + col);
				const formulaCell = {
					formula: `=VLOOKUP($A${row},query!$A$2:$J$${queryLastRow},${col},FALSE)`,
					result: undefined,
				};
				validationSheet.getCell(`${columnLetter}${row}`).value = formulaCell;
			}
			for (let col = 11; col <= 16; col++) {
				const columnLetter = String.fromCharCode(64 + col);
				const formulaCell = {
					formula: `=VLOOKUP($A${row},Format!$A$2:$H$${sourceLastRow},${lookup},FALSE)`,
					result: undefined,
				};
				validationSheet.getCell(`${columnLetter}${row}`).value = formulaCell;
				lookup += 1;
			}
		}

		const formatIDTele: any[] = [];
		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				// Try to get calculated value instead of formula
				const cellValue = row.getCell(8).result || row.getCell(8).value;
				formatIDTele.push(cellValue);
			}
		});

		console.log("formatIDTele:", formatIDTele);
		// const aksesTele = await getAksesTele(formatIDTele);

		return workbook;
	} catch (error) {
		console.error("Automation error:", error);
		throw error;
	}
};
