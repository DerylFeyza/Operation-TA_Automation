import ExcelJS from "exceljs";
import {
	AksesMytechType,
	NIKLamaType,
	AksesValidation,
} from "../types/teknisi";
import {
	getAksesTele,
	getAksesMyTech,
	getAksesSCMT,
} from "../utils/operation.query";
import { cekNIKLama } from "../utils/naker.query";
import { initializeNIKLamaSheet, initializeMyTechSheet } from "./sheets";

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

		const validationLabor: any[] = [];
		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				const cellValue = row.getCell("R").value;
				validationLabor.push(cellValue);
			}
		});

		const rowsToDelete: number[] = [];
		aksesTeleSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				const cellValue = row.getCell("C").value;
				const exists = validationLabor.some(
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
			const seenAccountIds = new Set();
			aksesTeleSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber >= 2) {
					const accountId = row.getCell(3).value;
					if (!seenAccountIds.has(String(accountId))) {
						seenAccountIds.add(String(accountId));
						aksesTeleValues.push({
							accountId: accountId,
							nik: row.getCell(11).value,
						});
					}
				}
			});

			aksesTeleValues.forEach((value, index) => {
				const targetRow = firstEmptyRow + index;
				validationSheet.getCell(`R${targetRow}`).value = value.accountId;
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
		const nikLamaSheet = await initializeNIKLamaSheet(workbook);
		const nikLama1Rows = Array.isArray(nikLama1Data)
			? nikLama1Data
			: nikLama1Data[0] || [];

		nikLama1Rows.forEach((row: NIKLamaType) => {
			nikLamaSheet.addRow([Number(row.nik_baru), Number(row.nik_lama)]);
		});

		//create labor from nik lama 1
		const nikLama1ColumnAValues: any[] = [];
		const nikLama1ColumnBValues: any[] = [];
		nikLamaSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
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
			validationSheet.getCell(`R${targetRow}`).value = valueB;
		});

		let lastFilledCol = nikLamaSheet.columnCount;
		let nikterlamaVal: any[] = [];
		nikLamaSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				const cellValue = row.getCell(lastFilledCol).value;
				nikterlamaVal.push(cellValue);
			}
		});

		let nikLamaData = await cekNIKLama(nikterlamaVal);

		while (nikLamaData.length > 0) {
			const headerRow = nikLamaSheet.getRow(1);
			let firstEmptyCol = 1;
			while (
				headerRow.getCell(firstEmptyCol).value !== null &&
				headerRow.getCell(firstEmptyCol).value !== undefined
			) {
				firstEmptyCol++;
			}
			headerRow.getCell(firstEmptyCol).value = `nik ${firstEmptyCol}`;
			if (nikLamaData.length > 0) {
				const nikLama2Rows = Array.isArray(nikLamaData)
					? nikLamaData
					: nikLamaData[0] || [];

				nikLama2Rows.forEach((row: NIKLamaType) => {
					const nikBaru = Number(row.nik_baru);
					const nikLama = Number(row.nik_lama);

					nikLamaSheet.eachRow(
						{ includeEmpty: false },
						(sheetRow, rowNumber) => {
							if (rowNumber >= 2) {
								const lastColValue = sheetRow.getCell(lastFilledCol).value;
								if (Number(lastColValue) === nikBaru) {
									sheetRow.getCell(firstEmptyCol).value = nikLama;
								}
							}
						}
					);
				});

				const nikLamaVal: any[] = [];
				const nikbaruVal: any[] = [];
				nikLamaSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
					if (rowNumber >= 2) {
						const nikLamaCol = row.getCell(firstEmptyCol).value;
						if (nikLamaCol !== null && nikLamaCol !== undefined) {
							const nikBaruCol = row.getCell(1).value;
							nikLamaVal.push(nikLamaCol);
							nikbaruVal.push(nikBaruCol);
						}
					}
				});

				const startRow2 = validationSheet.actualRowCount + 1;
				nikLamaVal.forEach((nikLama, index) => {
					const targetRow = startRow2 + index;
					const nikBaru = nikbaruVal[index];
					validationSheet.getCell(`A${targetRow}`).value = nikBaru;
					validationSheet.getCell(`R${targetRow}`).value = nikLama;
				});
			}
			lastFilledCol = nikLamaSheet.columnCount;
			nikterlamaVal = [];
			nikLamaSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber >= 2) {
					const cellValue = row.getCell(lastFilledCol).value;
					if (cellValue !== null && cellValue !== undefined) {
						nikterlamaVal.push(cellValue);
					}
				}
			});
			nikLamaData = await cekNIKLama(nikterlamaVal);
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
				const cellWHParadise = String(row.getCell("M").value || "");
				for (const [dimension, code] of dimensionToCodeMap.entries()) {
					if (cellWHParadise.includes(dimension)) {
						const updatedValue = cellWHParadise.replace(
							dimension,
							`${dimension}(${code})`
						);
						row.getCell("M").value = updatedValue;
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

export const getAllUserLabor = async (
	NIK: string,
	idtele: string
): Promise<AksesValidation[]> => {
	let laborlist: string[] = [NIK];

	try {
		let i = 1;
		while (laborlist.length == i) {
			const lastNIK = laborlist[laborlist.length - 1];
			const nikLamaData = await cekNIKLama([lastNIK]);
			if (nikLamaData.length > 0) {
				nikLamaData.forEach((item) => {
					laborlist.push(String(item.nik_lama));
				});
			}
			i++;
		}

		const aksesTele = await getAksesTele([idtele]);
		if (aksesTele.length > 0) {
			if (aksesTele.length > 0) {
				aksesTele.forEach((item) => {
					const accountId = String(item.ACCOUNT_ID);
					if (!laborlist.includes(accountId)) {
						laborlist.push(accountId);
					}
				});
			}
		}

		const validationArray: AksesValidation[] = [];
		const aksesMytech = await getAksesMyTech(laborlist);
		const aksesSCMT = await getAksesSCMT(laborlist);
		laborlist.forEach((labor) => {
			const mytechMatch = aksesMytech.find(
				(item) => String(item.ACCOUNT_ID) === labor
			);
			const scmtMatch = aksesSCMT.find(
				(item) => String(item.TECHNICIAN_CODE) === labor
			);

			const mytechStatus = (mytechMatch?.STATUS_USER || "").trim();
			const scmtStatus = (scmtMatch?.TECHNICIAN_STATUS || "").trim();
			const totalNTE = scmtMatch?.TOTAL_NTE ? Number(scmtMatch.TOTAL_NTE) : 0;

			let reject = false;
			let action = "";

			if (labor === NIK) {
				reject = false;
				action = "NIK Baru";
			} else if (
				(mytechStatus === "aktif" || scmtStatus === "active") &&
				totalNTE === 0
			) {
				reject = true;
				action = `TERMINATE Labor sebelum create user`;
			} else if (totalNTE > 0) {
				reject = true;
				action = `REJECT, membawa NTE`;
			}

			const validationObj: AksesValidation = {
				labor,
				mytech: mytechMatch ? String(mytechMatch.STATUS_USER || "") : "",
				scmt: scmtMatch ? String(scmtMatch.TECHNICIAN_STATUS || "") : "",
				nte: totalNTE,
				reject,
				action,
			};
			validationArray.push(validationObj);
		});

		return validationArray;
	} catch (error) {
		console.error("Error fetching from db", error);
	}
};
