import ExcelJS from "exceljs";

export const evaluateRow = async (
	validationSheet: ExcelJS.Worksheet
): Promise<void> => {
	try {
		validateLaborReject(validationSheet);
		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;
			const columnNIK = row.getCell("A").value;
			const columnIDTELE = row.getCell("H").value;
			const columnPosition = row.getCell("I").value;
			const columnREQWHSCMT = row.getCell("L").value;
			const columnREQWHParadise = row.getCell("M").value;

			const columnLabor = row.getCell("R").value;
			const columnMytech = row.getCell("Y").value;
			const columnSCMT = row.getCell("Z").value;
			const columnWHSCMT = row.getCell("AA").value;
			const columnNTE = row.getCell("AB").value;

			const aValue = String(columnNIK || "");
			const hValue = String(columnIDTELE || "");
			const IValue = String(columnPosition || "");
			const qValue = String(columnLabor || "");
			const xValue = String(columnMytech || "");
			const yValue = String(columnSCMT || "");
			const aaValue = Number(columnNTE) || 0;
			const lValue = String(columnREQWHSCMT || "");
			const mValue = String(columnREQWHParadise || "");
			const zValue = String(columnWHSCMT || "");

			if (aValue !== qValue && xValue != "aktif" && yValue != "active") {
				validationSheet.getCell(`S${rowNumber}`).value = "DELETE ROW";
			}

			if (
				aValue !== qValue &&
				(xValue === "aktif" || yValue === "active") &&
				aaValue === 0
			) {
				validationSheet.getCell(`S${rowNumber}`).value = "TERMINATE USER";
			}

			if (!hValue) {
				validationSheet.getCell(`S${rowNumber}`).value = "REJECT";
				validationSheet.getCell(`U${rowNumber}`).value = "DONE(REJECT)";
				validationSheet.getCell(`V${rowNumber}`).value = "ID TELE KOSONG";
			}

			if (IValue == "NON ACTIVE") {
				if (xValue === "aktif" || yValue === "active") {
					validationSheet.getCell(`S${rowNumber}`).value = "TERMINATE USER";
					validationSheet.getCell(`U${rowNumber}`).value = "";
					validationSheet.getCell(`V${rowNumber}`).value = "RESIGN";
				} else {
					validationSheet.getCell(`S${rowNumber}`).value = "REJECT";
					validationSheet.getCell(`U${rowNumber}`).value = "DONE(REJECT)";
					validationSheet.getCell(`V${rowNumber}`).value = "RESIGN";
				}
			}

			if (IValue == "BUKAN TEKNISI") {
				if (xValue === "aktif" || yValue === "active") {
					validationSheet.getCell(`S${rowNumber}`).value = "TERMINATE USER";
					validationSheet.getCell(`U${rowNumber}`).value = "";
					validationSheet.getCell(`V${rowNumber}`).value = "BUKAN TEKNISI";
				} else {
					validationSheet.getCell(`S${rowNumber}`).value = "REJECT";
					validationSheet.getCell(`U${rowNumber}`).value = "DONE(REJECT)";
					validationSheet.getCell(`V${rowNumber}`).value = "BUKAN TEKNISI";
				}
			}

			const updatedRValue = String(
				validationSheet.getCell(`S${rowNumber}`).value || ""
			);

			if (
				updatedRValue != "DELETE ROW" &&
				updatedRValue != "TERMINATE USER" &&
				updatedRValue != "REJECT"
			) {
				if (xValue === "-" && yValue === "-") {
					validationSheet.getCell(`S${rowNumber}`).value = "CREATE USER";
				}
				if (xValue === "-" && yValue !== "-") {
					validationSheet.getCell(`S${rowNumber}`).value = "CREATE MYTECH";
				}
				if (xValue !== "-" && yValue === "-") {
					validationSheet.getCell(`S${rowNumber}`).value = "CREATE SCMT";
				}
				if (xValue === "non aktif") {
					const currentValue = validationSheet.getCell(`S${rowNumber}`).value;
					if (currentValue) {
						validationSheet.getCell(`S${rowNumber}`).value = `${String(
							currentValue
						)}, AKTIVASI MYTECH`;
					} else {
						validationSheet.getCell(`S${rowNumber}`).value = "AKTIVASI MYTECH";
					}
				}
				if (yValue === "inactive") {
					const currentValue = validationSheet.getCell(`S${rowNumber}`).value;
					if (currentValue) {
						validationSheet.getCell(`S${rowNumber}`).value = `${String(
							currentValue
						)}, AKTIVASI SCMT`;
					} else {
						validationSheet.getCell(`S${rowNumber}`).value = "AKTIVASI SCMT";
					}
				}

				const lValues = lValue
					.split(",")
					.map((v) => v.trim())
					.filter(Boolean);
				const mValues = mValue
					.split(",")
					.map((v) => v.trim())
					.filter(Boolean);
				const zValues = zValue
					.split("|")
					.map((v) => v.trim())
					.filter(Boolean);

				const missingSCMT = lValues.filter((lVal) => {
					// const paradiseMatch = lVal.match(/\(([^)]+)\)/);
					// const whParadiseTranslationMatch = paradiseMatch
					// 	? paradiseMatch[1]
					// 	: null;
					return !zValues.includes(lVal);
					//  &&
					// (!whParadiseTranslationMatch ||
					// 	!zValues.includes(whParadiseTranslationMatch))
				});

				const missingParadise = mValues.filter((mVal) => {
					const paradiseMatch = mVal.match(/\(([^)]+)\)/);
					const whParadiseTranslationMatch = paradiseMatch
						? paradiseMatch[1]
						: null;
					return (
						!whParadiseTranslationMatch ||
						!zValues.includes(whParadiseTranslationMatch)
					);
				});

				const anyMissingGudang =
					missingSCMT.length > 0 || missingParadise.length > 0;

				if (anyMissingGudang) {
					const currentValue = validationSheet.getCell(`S${rowNumber}`).value;
					if (currentValue) {
						validationSheet.getCell(`S${rowNumber}`).value = `${String(
							currentValue
						)}, TAMBAH GUDANG`;
					} else {
						validationSheet.getCell(`S${rowNumber}`).value = "TAMBAH GUDANG";
					}
				}

				if (missingSCMT.length > 0) {
					validationSheet.getCell(
						`V${rowNumber}`
					).value = `Menambahkan Gudang SCMT ${missingSCMT.join(", ")}`;
				}

				if (missingParadise.length > 0) {
					const currentKeteranganValue = validationSheet.getCell(
						`V${rowNumber}`
					).value;

					if (currentKeteranganValue) {
						validationSheet.getCell(`V${rowNumber}`).value = `${String(
							currentKeteranganValue
						)}, Gudang Paradise ${missingParadise.join(", ")}`;
					} else {
						validationSheet.getCell(
							`V${rowNumber}`
						).value = `Menambahkan Gudang Paradise ${missingParadise.join(
							", "
						)}`;
					}
				}
			}
		});

		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;
			const rValue = row.getCell("S").value;
			if (!rValue) {
				validationSheet.getCell(`S${rowNumber}`).value = "CREATE USER";
				validationSheet.getCell(`U${rowNumber}`).value = "DONE(EKSISTING)";
			}
		});
	} catch (error) {
		console.error("Automation error:", error);
		throw error;
	}
};
export const validateLaborReject = (
	validationSheet: ExcelJS.Worksheet
): void => {
	try {
		const nikOccurrences = new Map<string, number>();
		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;

			const columnA = row.getCell("A").value;
			const nikValue = String(columnA || "");

			nikOccurrences.set(nikValue, (nikOccurrences.get(nikValue) || 0) + 1);
		});

		const nikGroups = new Map<
			string,
			Array<{
				rowNumber: number;
				hasAccess: boolean;
				columnLabor: string;
			}>
		>();

		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;
			const columnA = row.getCell("A").value;
			const nikValue = String(columnA || "");
			if ((nikOccurrences.get(nikValue) || 0) <= 1) return;

			const columnLabor = row.getCell("R").value;
			// const columnX = row.getCell("X").value;
			// const columnY = row.getCell("Y").value;
			const columnNTE = row.getCell("AB").value;

			const laborValue = String(columnLabor || "");
			// const mytechStatus = String(columnX || "");
			// const scmtStatus = String(columnY || "");
			const nteCount = Number(columnNTE) || 0;

			// const hasAccess =
			// 	(mytechStatus === "aktif" || scmtStatus === "active") && nteCount > 0;

			const hasAccess = nteCount > 0;

			if (!nikGroups.has(nikValue)) {
				nikGroups.set(nikValue, []);
			}

			nikGroups.get(nikValue)?.push({
				rowNumber,
				hasAccess,
				columnLabor: laborValue,
			});
		});

		//TODO: IGNORE REQUEST jika punya NTE di labor lama
		for (const [nikValue, rowsData] of nikGroups) {
			const hasAnyAccess = rowsData.some((row) => row.hasAccess);
			if (hasAnyAccess) {
				const accessColumnLabor = rowsData
					.filter((row) => row.hasAccess)
					.map((row) => row.columnLabor)
					.join(", ");

				rowsData.forEach((rowData) => {
					if (nikValue === rowData.columnLabor && !rowData.hasAccess) {
						validationSheet.getCell(`S${rowData.rowNumber}`).value = "REJECT";
						validationSheet.getCell(`U${rowData.rowNumber}`).value =
							"DONE(REJECT)";
						validationSheet.getCell(
							`U${rowData.rowNumber}`
						).value = `Masih Membawa NTE Pada Labor ${accessColumnLabor}`;
					}
				});
			}
		}

		console.log("Duplicate validation with access completed");
	} catch (error) {
		console.error("Duplicate validation error:", error);
		throw error;
	}
};
