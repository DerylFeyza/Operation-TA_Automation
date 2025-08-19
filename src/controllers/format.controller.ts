import type { Request, Response } from "express";
import { formatUnggahTeknisi } from "../services/format.service";
import fs from "fs";

export const formatExecution = async (req: Request, res: Response) => {
	try {
		const filePath = req?.file?.path;
		if (!filePath) return res.status(400).send("No file uploaded");

		const processedWorkbook = await formatUnggahTeknisi(filePath);
		res.setHeader("Content-Disposition", "attachment; filename=processed.xlsx");
		res.setHeader(
			"Content-Type",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		);

		await processedWorkbook.xlsx.write(res);
		res.end();

		fs.unlinkSync(filePath);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error processing Excel file");
	}
};
