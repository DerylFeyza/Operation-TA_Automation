import ExcelJS from "exceljs";
import type { Request, Response } from "express";
import fs from "fs";
import {
	sourceSheetType,
	TeknisiType,
	AksesMytechType,
} from "../types/teknisi";
import { getTeknisi } from "../utils/database/naker.query";
import {
	getAksesMyTech,
	getAksesSCMT,
} from "../utils/database/operation.query";
import {
	initializeValidationSheet,
	initializeQuerySheet,
	initializeMyTechSheet,
	initializeSCMTSheet,
} from "../services/sheet.service";
import {
	validateTeleAccess,
	validateOldNIK,
	getAllUserLabor,
} from "../services/validation.service";
import {
	translateWHParadise,
	highlightAndFormat,
} from "../services/format.service";
import { evaluateRow } from "../services/evaluate.service";
import { getCurrentTime } from "../utils/utils";

export const automateValidation = async (req: Request, res: Response) => {
	try {
		const filePath = req?.file?.path;
		if (!filePath) return res.status(400).send("No file uploaded");

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

		const sourceData: sourceSheetType[] = [];
		sourceSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				sourceData.push({
					nik: row.getCell(1).value,
					sto: row.getCell(2).value,
					ccan: row.getCell(3).value,
					inv: row.getCell(4).value,
					nde: row.getCell(5).value,
					nikpengirim: row.getCell(6).value,
					pengirim: row.getCell(7).value,
					tglnde: row.getCell(8).value,
					request: row.getCell(9).value,
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
			validationSheet.getCell(`R${targetRow}`).value = value;
		});

		await validateOldNIK(workbook, validationSheet, querySheetColumnAValues);
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
				validationSheet.getCell(`K${row}`).value = matchingSourceRow.sto;
				validationSheet.getCell(`L${row}`).value = matchingSourceRow.ccan;
				validationSheet.getCell(`M${row}`).value = matchingSourceRow.inv;
				validationSheet.getCell(`N${row}`).value = matchingSourceRow.nde;
				validationSheet.getCell(`O${row}`).value =
					matchingSourceRow.nikpengirim;
				validationSheet.getCell(`P${row}`).value = matchingSourceRow.pengirim;
				validationSheet.getCell(`Q${row}`).value = matchingSourceRow.tglnde;
				validationSheet.getCell(`AB${row}`).value = matchingSourceRow.request;
			}
		}

		const formatLabor: any[] = [];
		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber >= 2) {
				let cellValue = row.getCell(18).value;
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
			const lookupValue = validationSheet.getCell(`R${row}`).value;
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

			validationSheet.getCell(`Y${row}`).value = result;
			validationSheet.getCell(`Z${row}`).value = scmtresult;
			validationSheet.getCell(`AA${row}`).value = scmtwh;
			validationSheet.getCell(`AB${row}`).value = scmtnte;
		}
		await translateWHParadise(workbook);
		await evaluateRow(validationSheet);
		await highlightAndFormat(workbook);

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
	} catch (err) {
		console.error(err);
		res.status(500).send("Error processing Excel file");
	}
};

export const accessNIK = async (req: Request, res: Response) => {
	try {
		const id = req.params.id;
		const teknisiData = await getTeknisi(id ? [id] : []);
		if (teknisiData.length == 0) {
			return res.status(404).send("Teknisi Not Found");
		}

		const laborAccess = await getAllUserLabor(id, teknisiData[0].id_telegram);

		return res.json({
			data: teknisiData,
			labors: laborAccess,
		});
	} catch (error) {
		console.error(error);
		res.status(500).send("Error fetching teknisi data");
	}
};
