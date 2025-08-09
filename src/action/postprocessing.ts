import ExcelJS from "exceljs";

export const prepareUnggahTeknisi = async (mainWorkbook: ExcelJS.Workbook) => {
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

		const colLetterToIndex = (letter: string) => {
			let result = 0;
			for (let i = 0; i < letter.length; i++) {
				result = result * 26 + (letter.charCodeAt(i) - 64);
			}
			return result;
		};

		validationSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
			if (rowNumber === 1) return;

			const afCell = row.getCell(colLetterToIndex("AF"));
			const afValue = afCell.value;

			if (
				afValue === true ||
				(typeof afValue === "string" && afValue.toUpperCase() === "TRUE")
			) {
				const targetRow = targetWorksheet.getRow(targetRowIndex++);

				columnMapping.forEach(({ source, target }) => {
					targetRow.getCell(colLetterToIndex(target)).value = row.getCell(
						colLetterToIndex(source)
					).value;
				});

				const cellM = targetRow.getCell(colLetterToIndex("M"));
				const cellN = targetRow.getCell(colLetterToIndex("N"));
				const cellO = targetRow.getCell(colLetterToIndex("O"));

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
