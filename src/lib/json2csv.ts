import { Response } from "express";
import { Parser } from "json2csv";

export const csvOutput = async (data: any, res: Response) => {
	const json2csvParser = new Parser();
	const csv = json2csvParser.parse(data);
	res.header("Content-Type", "text/csv");
	res.attachment("tracked_warehouse.csv");
	return res.send(csv);
};
