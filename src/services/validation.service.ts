import { initializeNIKLamaSheet, initializeMyTechSheet } from "./sheet.service";
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
