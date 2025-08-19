import ExcelJS from "exceljs";

export const highlightAndFormat = async (workbook: ExcelJS.Workbook) => {
	const validationSheet = workbook.getWorksheet("validation");
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

export const translateWHParadise = async (mainWorkbook: ExcelJS.Workbook) => {
	const workbook = new ExcelJS.Workbook();
	try {
		await workbook.xlsx.readFile("src/resources/scmt-paradise.xlsx");

		const sourceWorksheet = workbook.getWorksheet(1);
		if (!sourceWorksheet) {
			console.error("Worksheet not found in scmt-paradise.xlsx");
			return null;
		}

		const validationSheet = mainWorkbook.getWorksheet("validation");
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

export const formatUnggahTeknisi = async (mainWorkbook: ExcelJS.Workbook) => {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile("src/resources/unggah_teknisi_format.xlsx");

	const dropdownWorkbook = new ExcelJS.Workbook();
	await dropdownWorkbook.xlsx.readFile("src/resources/dropdown_template.xlsx");
	const dropdownSheet = dropdownWorkbook.worksheets[0];

	const dropdownM = dropdownSheet.getCell("A1").dataValidation;
	const dropdownN = dropdownSheet.getCell("B1").dataValidation;
	const dropdownO = dropdownSheet.getCell("C1").dataValidation;
	const valueM = dropdownSheet.getCell("A1").value;
	const valueN = dropdownSheet.getCell("B1").value;
	const valueO = dropdownSheet.getCell("C1").value;

	try {
		const sourceWorksheet = workbook.worksheets[0];
		const targetWorksheet = mainWorkbook.addWorksheet("unggah_teknisi");
		const validationSheet = mainWorkbook.getWorksheet("validation");
		const sourceRow = sourceWorksheet.getRow(1);
		const targetRow = targetWorksheet.getRow(1);

		sourceRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
			targetRow.getCell(colNumber).value = cell.value;
			targetRow.getCell(colNumber).style = JSON.parse(
				JSON.stringify(cell.style)
			);
		});
		targetRow.commit();

		sourceWorksheet.columns.forEach((col, index) => {
			if (col.width) {
				targetWorksheet.getColumn(index + 1).width = col.width;
			}
		});

		let targetRowIndex = 2;
		const columnMapping = [
			{ source: "R", target: "A" },
			{ source: "B", target: "B" },
			{ source: "F", target: "D" },
			{ source: "J", target: "E" },
			{ source: "D", target: "H" },
			{ source: "C", target: "I" },
			{ source: "K", target: "J" },
			{ source: "G", target: "P" },
			{ source: "E", target: "R" },
			{ source: "H", target: "S" },
			{ source: "C", target: "Q" },
		];

		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;

			const afCell = row.getCell("AF");
			const afValue = afCell.value;

			if (
				afValue === true ||
				(typeof afValue === "string" && afValue.toUpperCase() === "TRUE")
			) {
				const targetRow = targetWorksheet.getRow(targetRowIndex++);

				columnMapping.forEach(({ source, target }) => {
					targetRow.getCell(target).value = row.getCell(source).value;
				});

				const cellM = targetRow.getCell("M");
				const cellN = targetRow.getCell("N");
				const cellO = targetRow.getCell("O");

				cellM.dataValidation = JSON.parse(JSON.stringify(dropdownM));
				cellN.dataValidation = JSON.parse(JSON.stringify(dropdownN));
				cellO.dataValidation = JSON.parse(JSON.stringify(dropdownO));

				cellM.value = valueM;
				cellN.value = valueN;
				cellO.value = valueO;

				targetRow.commit();
			}
		});
	} catch (error) {
		console.error("Error preparing unggah_teknisi sheet:", error);
	}
};

export const formatSCMT = async (mainWorkbook: ExcelJS.Workbook) => {
	try {
		const validationSheet = mainWorkbook.getWorksheet("validation");

		let activateSheet = mainWorkbook.getWorksheet("activate_scmt");
		let addwhSheet = mainWorkbook.getWorksheet("addwh_scmt");

		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (activateSheet && addwhSheet) return;

			if (rowNumber === 1) return;

			const adValue = row.getCell("AD").value;
			const aeValue = row.getCell("AE").value;

			if (
				!activateSheet &&
				(adValue === true ||
					(typeof adValue === "string" && adValue.toUpperCase() === "TRUE"))
			) {
				mainWorkbook.addWorksheet("activate_scmt");
				activateSheet = mainWorkbook.getWorksheet("activate_scmt");
			}

			if (
				!addwhSheet &&
				(aeValue === true ||
					(typeof aeValue === "string" && aeValue.toUpperCase() === "TRUE"))
			) {
				mainWorkbook.addWorksheet("addwh_scmt");
				addwhSheet = mainWorkbook.getWorksheet("addwh_scmt");
			}

			if (activateSheet && addwhSheet) return true;
		});

		if (activateSheet) {
			activateSheet.getCell("A1").value =
				"technician_code;technician_ktp;old_warehouse_code;new_warehouse_code;ignore_stock";
			let rowIndex = 2;
			validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber === 1) return;
				const activateSCMTRow = row.getCell("AD").value;
				if (
					activateSCMTRow === true ||
					(typeof activateSCMTRow === "string" &&
						activateSCMTRow.toUpperCase() === "TRUE")
				) {
					const technicianCode = row.getCell("R").value || "";
					const technicianKtp = row.getCell("G").value || "";

					activateSheet.getCell(
						`A${rowIndex}`
					).value = `${technicianCode};${technicianKtp};;;YES`;

					rowIndex++;
				}
			});
		}
		if (addwhSheet) {
			addwhSheet.getCell("A1").value =
				"technician_code;technician_ktp;old_warehouse_code;new_warehouse_code;ignore_stock";
			let rowIndex = 2;
			validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
				if (rowNumber === 1) return;
				const addwhSCMTRow = row.getCell("AE").value;
				if (
					addwhSCMTRow === true ||
					(typeof addwhSCMTRow === "string" &&
						addwhSCMTRow.toUpperCase() === "TRUE")
				) {
					const technicianCode = row.getCell("R").value || "";
					const technicianKtp = row.getCell("G").value || "";
					const technicianWHSCMT = (row.getCell("L").value || "").toString();
					if (technicianWHSCMT.includes(",")) {
						const warehouseCodes = technicianWHSCMT
							.split(",")
							.map((code) => code.trim())
							.filter(Boolean);
						for (const whCode of warehouseCodes) {
							addwhSheet.getCell(
								`A${rowIndex}`
							).value = `${technicianCode};${technicianKtp};;${whCode};YES`;

							rowIndex++;
						}
					} else {
						addwhSheet.getCell(
							`A${rowIndex}`
						).value = `${technicianCode};${technicianKtp};;${technicianWHSCMT};YES`;

						rowIndex++;
					}
				}
			});
		}
	} catch (error) {
		console.error("Error preparing add_wh_scmt sheet:", error);
	}
};
