import ExcelJS from "exceljs";
import { AksesMytechType, NIKLamaType } from "../types/teknisi";
import { getAksesTele } from "../utils/operation.query";
import { cekNIKLama } from "../utils/naker.query";
import {
	initializeNIKLama1Sheet,
	initializeNIKLama2Sheet,
	initializeMyTechSheet,
} from "./sheets";

export const validateTeleAccess = async (
	workbook: ExcelJS.Workbook,
	validationSheet: ExcelJS.Worksheet,
	querySheet: ExcelJS.Worksheet
) => {
	const formatIDTele: any[] = [];
	querySheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
		if (rowNumber >= 2) {
			const cellValue = row.getCell(8).value;
			formatIDTele.push(cellValue);
		}
	});

	const aksesTele = await getAksesTele(formatIDTele);
	if (aksesTele.length > 0) {
		const aksesTeleSheet = await initializeMyTechSheet(workbook, "akses_tele");
		const aksesTeleRows = Array.isArray(aksesTele)
			? aksesTele
			: aksesTele[0] || [];

		aksesTeleRows.forEach((row: AksesMytechType) => {
			aksesTeleSheet.addRow([
				row.USER_ID,
				row.CODE,
				typeof row.ACCOUNT_ID === "string" && /^\d+$/.test(row.ACCOUNT_ID)
					? Number(row.ACCOUNT_ID)
					: row.ACCOUNT_ID,
				row.NAME,
				row.EMAIL,
				row.CREATE_DTM,
				row.STATUS_USER,
				row.MSISDN,
				row.APLIKASI,
				row.XS1,
			]);
		});

		const validationQValues: any[] = [];
		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				const cellValue = row.getCell("Q").value;
				validationQValues.push(cellValue);
			}
		});

		const rowsToDelete: number[] = [];
		aksesTeleSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				const cellValue = row.getCell("C").value;
				const exists = validationQValues.some(
					(value) => Number(value) === Number(cellValue)
				);
				if (exists) {
					rowsToDelete.push(rowNumber);
				}
			}
		});

		rowsToDelete
			.sort((a, b) => b - a)
			.forEach((rowNumber) => {
				aksesTeleSheet.spliceRows(rowNumber, 1);
			});

		if (aksesTeleSheet.actualRowCount <= 1) {
			console.log("No data rows left in akses_tele sheet after filtering");
			workbook.removeWorksheet(aksesTeleSheet.id);
			console.log("akses_tele sheet deleted as it contained no data");
		} else {
			//create labor from tele access
			const headerRow = aksesTeleSheet.getRow(1);
			headerRow.getCell(11).value = "NIK";
			const queryData: { id_telegram: any; nik: any }[] = [];
			querySheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber >= 2) {
					queryData.push({
						id_telegram: row.getCell(8).value,
						nik: row.getCell(1).value,
					});
				}
			});

			// For each row in akses_tele sheet, find matching NIK from query sheet
			aksesTeleSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber >= 2) {
					const telegramId = row.getCell(10).value;
					const matchingQuery = queryData.find(
						(item) => String(item.id_telegram) === String(telegramId)
					);
					if (matchingQuery) {
						row.getCell(11).value = Number(matchingQuery.nik);
					}
				}
			});

			// Find the first empty row in validation sheet
			const firstEmptyRow = validationSheet.actualRowCount + 1;

			// Get values from akses_tele sheet
			const aksesTeleValues: { accountId: any; nik: any }[] = [];
			aksesTeleSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber >= 2) {
					aksesTeleValues.push({
						accountId: row.getCell(3).value, // Column C (ACCOUNT_ID)
						nik: row.getCell(11).value, // Column K (NIK)
					});
				}
			});

			aksesTeleValues.forEach((value, index) => {
				const targetRow = firstEmptyRow + index;
				validationSheet.getCell(`Q${targetRow}`).value = value.accountId;
				validationSheet.getCell(`A${targetRow}`).value = value.nik;
			});
		}
	}
};

export const validateOldNIK = async (
	workbook: ExcelJS.Workbook,
	validationSheet: ExcelJS.Worksheet,
	querySheet: ExcelJS.Worksheet,
	querySheetColumnAValues: any[]
) => {
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
				const cellValueA = row.getCell(1).value;
				const cellValueB = row.getCell(2).value;
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

			const startRow2 = validationSheet.actualRowCount + 1;
			nikLama2ColumnAValues.forEach((valueA, index) => {
				const targetRow = startRow2 + index;
				const valueC = nikLama2ColumnCValues[index];
				validationSheet.getCell(`A${targetRow}`).value = valueA;
				validationSheet.getCell(`Q${targetRow}`).value = valueC;
			});
		}
	}
};

export const highlightAndFormat = async (
	workbook: ExcelJS.Workbook,
	validationSheet: ExcelJS.Worksheet
) => {
	const lastRow = validationSheet.actualRowCount;
	const valueCounts: { [key: string]: number } = {};

	for (let row = 2; row <= lastRow; row++) {
		const cellValue = validationSheet.getCell(`A${row}`).value;
		if (cellValue !== null && cellValue !== undefined) {
			const strValue = String(cellValue);
			valueCounts[strValue] = (valueCounts[strValue] || 0) + 1;
		}
	}

	for (let row = 2; row <= lastRow; row++) {
		const cellValue = validationSheet.getCell(`A${row}`).value;
		if (cellValue !== null && cellValue !== undefined) {
			const strValue = String(cellValue);
			if (valueCounts[strValue] > 1) {
				validationSheet.getCell(`A${row}`).fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: "FF90EE90" },
				};
			}
		}
	}

	const rowsToSort: {
		rowNum: number;
		rowData: any[];
		isDuplicate: boolean;
		value: any;
	}[] = [];

	for (let row = 2; row <= lastRow; row++) {
		const cellValue = validationSheet.getCell(`A${row}`).value;
		const rowData: any[] = [];

		for (let col = 1; col <= validationSheet.columnCount; col++) {
			const cell = validationSheet.getCell(row, col);
			rowData.push({
				value: cell.value,
				style: cell.style ? JSON.parse(JSON.stringify(cell.style)) : null,
			});
		}

		rowsToSort.push({
			rowNum: row,
			rowData: rowData,
			isDuplicate: valueCounts[String(cellValue)] > 1,
			value: cellValue,
		});
	}

	rowsToSort.sort((a, b) => {
		if (a.isDuplicate !== b.isDuplicate) {
			return a.isDuplicate ? -1 : 1;
		}
		if (a.value === b.value) return 0;
		return a.value < b.value ? -1 : 1;
	});

	const tempSheet = workbook.addWorksheet("TempSorted");

	for (let col = 1; col <= validationSheet.columnCount; col++) {
		tempSheet.getCell(1, col).value = validationSheet.getCell(1, col).value;
		const headerCell = validationSheet.getCell(1, col);
		if (headerCell.style) {
			tempSheet.getCell(1, col).style = JSON.parse(
				JSON.stringify(headerCell.style)
			);
		}
	}

	rowsToSort.forEach((item, index) => {
		const targetRowNum = index + 2;

		for (let col = 1; col <= validationSheet.columnCount; col++) {
			const targetCell = tempSheet.getCell(targetRowNum, col);
			const sourceData = item.rowData[col - 1];

			targetCell.value = sourceData.value;
			if (sourceData.style) {
				targetCell.style = sourceData.style;
			}
		}
	});

	const validationSheetName = validationSheet.name;
	workbook.removeWorksheet(validationSheet.id);
	tempSheet.name = validationSheetName;
};

export const translateWHParadise = async (
	mainWorkbook: ExcelJS.Workbook,
	validationSheet: ExcelJS.Worksheet
) => {
	const workbook = new ExcelJS.Workbook();
	try {
		await workbook.xlsx.readFile("src/resources/scmt-paradise.xlsx");

		const sourceWorksheet = workbook.getWorksheet(1);
		if (!sourceWorksheet) {
			console.error("Worksheet not found in scmt-paradise.xlsx");
			return null;
		}

		const targetWorksheet = mainWorkbook.addWorksheet("scmt-paradise");

		sourceWorksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
			const targetRow = targetWorksheet.getRow(rowNumber);

			row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
				targetRow.getCell(colNumber).value = cell.value;
				if (cell.style) {
					targetRow.getCell(colNumber).style = JSON.parse(
						JSON.stringify(cell.style)
					);
				}
			});

			targetRow.commit();
		});

		const dimensionToCodeMap = new Map();
		targetWorksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber > 1) {
				const dimension = String(row.getCell("E").value || "");
				const code = String(row.getCell("A").value || "");
				if (dimension && code) {
					dimensionToCodeMap.set(dimension.trim(), code);
				}
			}
		});

		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber > 1) {
				const cellLValue = String(row.getCell("L").value || "");
				for (const [dimension, code] of dimensionToCodeMap.entries()) {
					if (cellLValue.includes(dimension)) {
						const updatedValue = cellLValue.replace(
							dimension,
							`${dimension}(${code})`
						);
						row.getCell("L").value = updatedValue;
						break;
					}
				}
			}
		});

		return targetWorksheet;
	} catch (error) {
		console.error("Error reading scmt-paradise.xlsx:", error);
		return null;
	}
};
