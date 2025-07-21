import ExcelJS from "exceljs";

export const evaluateRow = async (
	validationSheet: ExcelJS.Worksheet
): Promise<void> => {
	try {
		validateLaborReject(validationSheet);
		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;
			const columnA = row.getCell("A").value;
			const columnL = row.getCell("L").value;
			const columnQ = row.getCell("Q").value;
			const columnX = row.getCell("X").value;
			const columnY = row.getCell("Y").value;
			const columnZ = row.getCell("Z").value;
			const columnAA = row.getCell("AA").value;

			const aValue = String(columnA || "");
			const qValue = String(columnQ || "");
			const xValue = String(columnX || "");
			const yValue = String(columnY || "");
			const aaValue = Number(columnAA) || 0;
			const lValue = String(columnL || "");
			const zValue = String(columnZ || "");

			if (aValue !== qValue && xValue != "aktif" && yValue != "active") {
				//lowk still doubt myself on ts, ask what to do if NTE > 0 and has no access
				validationSheet.getCell(`R${rowNumber}`).value = "DELETE ROW";
			}

			if (
				aValue !== qValue &&
				(xValue === "aktif" || yValue === "active") &&
				aaValue === 0
			) {
				validationSheet.getCell(`R${rowNumber}`).value = "TERMINATE USER";
			}

			const updatedRValue = String(
				validationSheet.getCell(`R${rowNumber}`).value || ""
			);

			if (
				updatedRValue != "DELETE ROW" &&
				updatedRValue != "TERMINATE USER" &&
				updatedRValue != "REJECT"
			) {
				if (xValue === "-" && yValue === "-") {
					validationSheet.getCell(`R${rowNumber}`).value = "CREATE USER";
				}
				if (xValue === "-" && yValue !== "-") {
					validationSheet.getCell(`R${rowNumber}`).value = "CREATE MYTECH";
				}
				if (xValue !== "-" && yValue === "-") {
					validationSheet.getCell(`R${rowNumber}`).value = "CREATE SCMT";
				}
				if (xValue === "non aktif") {
					const currentValue = validationSheet.getCell(`R${rowNumber}`).value;
					if (currentValue) {
						validationSheet.getCell(`R${rowNumber}`).value = `${String(
							currentValue
						)}, AKTIVASI MYTECH`;
					} else {
						validationSheet.getCell(`R${rowNumber}`).value = "AKTIVASI MYTECH";
					}
				}
				if (yValue === "inactive") {
					const currentValue = validationSheet.getCell(`R${rowNumber}`).value;
					if (currentValue) {
						validationSheet.getCell(`R${rowNumber}`).value = `${String(
							currentValue
						)}, AKTIVASI SCMT`;
					} else {
						validationSheet.getCell(`R${rowNumber}`).value = "AKTIVASI SCMT";
					}
				}

				if (lValue && zValue) {
					const lValues = lValue
						.split(",")
						.map((v) => v.trim())
						.filter(Boolean);
					const zValues = zValue
						.split("|")
						.map((v) => v.trim())
						.filter(Boolean);

					const missingValues = lValues.filter((lVal) => {
						const paradiseMatch = lVal.match(/\(([^)]+)\)/);
						const whParadiseTranslationMatch = paradiseMatch
							? paradiseMatch[1]
							: null;
						return (
							!zValues.includes(lVal) &&
							(!whParadiseTranslationMatch ||
								!zValues.includes(whParadiseTranslationMatch))
						);
					});

					if (missingValues.length > 0) {
						const currentValue = validationSheet.getCell(`R${rowNumber}`).value;
						if (currentValue) {
							validationSheet.getCell(`R${rowNumber}`).value = `${String(
								currentValue
							)}, TAMBAH GUDANG`;
						} else {
							validationSheet.getCell(`R${rowNumber}`).value = "TAMBAH GUDANG";
						}
						validationSheet.getCell(
							`U${rowNumber}`
						).value = `Menambahkan Gudang ${missingValues.join(", ")}`;
					}
				}
			}
		});

		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;
			const rValue = row.getCell("R").value;
			if (!rValue) {
				validationSheet.getCell(`R${rowNumber}`).value = "CREATE USER";
				validationSheet.getCell(`T${rowNumber}`).value = "DONE(EKSISTING)";
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
				columnQ: string;
			}>
		>();

		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;
			const columnA = row.getCell("A").value;
			const nikValue = String(columnA || "");
			if ((nikOccurrences.get(nikValue) || 0) <= 1) return;

			const columnQ = row.getCell("Q").value;
			const columnX = row.getCell("X").value;
			const columnY = row.getCell("Y").value;
			const columnAA = row.getCell("AA").value;

			const qValue = String(columnQ || "");
			const mytechStatus = String(columnX || "");
			const scmtStatus = String(columnY || "");
			const nteCount = Number(columnAA) || 0;

			const hasAccess =
				(mytechStatus === "aktif" || scmtStatus === "active") && nteCount > 0;

			if (!nikGroups.has(nikValue)) {
				nikGroups.set(nikValue, []);
			}

			nikGroups.get(nikValue)?.push({
				rowNumber,
				hasAccess,
				columnQ: qValue,
			});
		});

		for (const [nikValue, rowsData] of nikGroups) {
			const hasAnyAccess = rowsData.some((row) => row.hasAccess);

			if (hasAnyAccess) {
				rowsData.forEach((rowData) => {
					if (nikValue === rowData.columnQ && !rowData.hasAccess) {
						validationSheet.getCell(`R${rowData.rowNumber}`).value = "REJECT";
						validationSheet.getCell(`T${rowData.rowNumber}`).value =
							"DONE(REJECT)";
						validationSheet.getCell(`U${rowData.rowNumber}`).value =
							"Masih Membawa NTE";
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
