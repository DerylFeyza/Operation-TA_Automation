import ExcelJS from "exceljs";
import { getTeknisi } from "../utils/naker.query";
import {
	initializeValidationSheet,
	initializeQuerySheet,
	initializeMyTechSheet,
	initializeSCMTSheet,
} from "./sheets";
import { TeknisiType, NIKLamaType, AksesMytechType } from "../types/teknisi";
import { getAksesMyTech, getAksesSCMT } from "../utils/operation.query";
import {
	validateTeleAccess,
	validateOldNIK,
	highlightAndFormat,
	translateWHParadise,
} from "./validation";
import { evaluateRow } from "./evaluate";

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

		const formatLabor: any[] = [];
		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				let cellValue = row.getCell(17).value;
				if (
					cellValue !== null &&
					cellValue !== undefined &&
					typeof cellValue !== "string"
				) {
					cellValue = String(cellValue);
				}
				formatLabor.push(cellValue);
			}
		});

		const aksesMytech = await getAksesMyTech(formatLabor);
		const aksesSCMT = await getAksesSCMT(formatLabor);

		const mytechSheet = await initializeMyTechSheet(workbook, "mytech");
		const scmtSheet = await initializeSCMTSheet(workbook);
		const aksesMytechRows = Array.isArray(aksesMytech)
			? aksesMytech
			: aksesMytech[0] || [];

		const aksesSCMTRows = Array.isArray(aksesSCMT)
			? aksesSCMT
			: aksesSCMT[0] || [];

		aksesMytechRows.forEach((row: AksesMytechType) => {
			mytechSheet.addRow([
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

		aksesSCMTRows.forEach((row: any) => {
			scmtSheet.addRow([
				typeof row.TECHNICIAN_CODE === "string" &&
				/^\d+$/.test(row.TECHNICIAN_CODE)
					? Number(row.TECHNICIAN_CODE)
					: row.TECHNICIAN_CODE,
				row.TECHNICIAN_NAME,
				row.TECHNICIAN_STATUS,
				row.CREATED_DATE,
				row.WH_CODE,
				row.WH_DESCRIPTION,
				row.WITEL_CODE,
				row.WITEL_NAME,
				row.ONT,
				row.STB,
				row.OTHER,
				row.TOTAL_NTE,
				row.LAST_TRANSACTION,
				row.TIME_STAMP,
				row.TECHNICIAN_CODE_REF,
			]);
		});

		const lastValidationRow = validationSheet.actualRowCount;
		for (let row = 2; row <= lastValidationRow; row++) {
			const lookupValue = validationSheet.getCell(`Q${row}`).value;
			let result = "-";
			let scmtresult = "-";
			let scmtwh = "-";
			let scmtnte = 0;

			if (lookupValue !== null && lookupValue !== undefined) {
				let foundInMytech = false;
				mytechSheet.eachRow(
					{ includeEmpty: false },
					(mytechRow, mytechRowNum) => {
						if (!foundInMytech && mytechRowNum >= 2) {
							const mytechValue = mytechRow.getCell(3).value;
							if (
								mytechValue !== null &&
								mytechValue !== undefined &&
								String(mytechValue) === String(lookupValue)
							) {
								result = mytechRow.getCell(7).value || "-";
								foundInMytech = true;
							}
						}
					}
				);

				let foundInScmt = false;
				scmtSheet.eachRow({ includeEmpty: false }, (scmtRow, scmtRowNum) => {
					if (!foundInScmt && scmtRowNum >= 2) {
						const scmtValue = scmtRow.getCell(1).value;
						if (
							scmtValue !== null &&
							scmtValue !== undefined &&
							String(scmtValue) === String(lookupValue)
						) {
							scmtresult = scmtRow.getCell(3).value || "-";
							scmtwh = scmtRow.getCell(5).value || "-";
							scmtnte = scmtRow.getCell(12).value || 0;
							foundInScmt = true;
						}
					}
				});
			}

			validationSheet.getCell(`X${row}`).value = result;
			validationSheet.getCell(`Y${row}`).value = scmtresult;
			validationSheet.getCell(`Z${row}`).value = scmtwh;
			validationSheet.getCell(`AA${row}`).value = scmtnte;
		}
		await translateWHParadise(workbook, validationSheet);
		await evaluateRow(validationSheet);
		await highlightAndFormat(workbook, validationSheet);

		return workbook;
	} catch (error) {
		console.error("Automation error:", error);
		throw error;
	}
};
