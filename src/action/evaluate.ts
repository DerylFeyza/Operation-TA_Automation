import ExcelJS from "exceljs";

export const evaluateRow = async (
	validationSheet: ExcelJS.Worksheet
): Promise<void> => {
	try {
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

			if (
				aValue !== qValue &&
				xValue != "aktif" &&
				yValue != "active" &&
				aaValue === 0
			) {
				console.log(aValue);
				console.log(qValue);
				console.log(xValue);
				console.log(yValue);
				console.log(aaValue);
				validationSheet.getCell(`R${rowNumber}`).value = "DELETE ROW";

				console.log(`Highlighted row ${rowNumber}, column Q in gray`);
			}

			// if (currentValue) {
			// 		cellR.value = `${String(currentValue)}, DELETE ROW`;
			// 	} else {
			// 		cellR.value = "DELETE ROW";
			// 	}
		});
	} catch (error) {
		console.error("Automation error:", error);
		throw error;
	}
};
