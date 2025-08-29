import type { Request, Response } from "express";
import { insertIncident, updateMilestone } from "../utils/wfm/api";
import { getKibanaLogs } from "../utils/kibana/api";
import { csvOutput } from "../lib/json2csv";
import { getWFMTicketStatus } from "../utils/wfm/api";
import { getInseraTicketStatus } from "../utils/insera/api";

export const getUpdateLogs = async (req: Request, res: Response) => {
	try {
		const { tickets, output } = req.body || {};
		if (!Array.isArray(tickets) || tickets.length === 0) {
			return res.status(400).json({
				error: "Invalid request body: 'tickets' must be a non-empty array",
			});
		}

		const results = await Promise.all(
			tickets.map(async (ticket: string) => {
				const response = await getKibanaLogs({
					queryString: ticket,
					termValue: "updateTicket",
					size: 1,
				});

				if (
					!response?.rawResponse?.hits?.hits ||
					response.rawResponse.hits.hits.length === 0
				) {
					return [
						{
							ticket,
							updateData: "Log Not Found",
						},
					];
				}

				return response.rawResponse.hits.hits.map((hit: any) => ({
					ticket,
					updateData: JSON.parse(hit._source.REQ),
				}));
			})
		);

		const sources = results.flat();

		if (output === "csv") {
			return csvOutput(sources, res);
		}

		return res.json(sources);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error fetching update logs");
	}
};

export const getCreateTicketLogs = async (req: Request, res: Response) => {
	try {
		const { tickets, output } = req.body || {};
		if (!Array.isArray(tickets) || tickets.length === 0) {
			return res.status(400).json({
				error: "Invalid request body: 'tickets' must be a non-empty array",
			});
		}

		const results = await Promise.all(
			tickets.map(async (ticket: string) => {
				const response = await getKibanaLogs({
					queryString: ticket,
					termValue: "createTicket",
					size: 1,
				});

				if (
					!response?.rawResponse?.hits?.hits ||
					response.rawResponse.hits.hits.length === 0
				) {
					return [
						{
							ticket,
							updateData: "Log Not Found",
						},
					];
				}

				return response.rawResponse.hits.hits.map((hit: any) => ({
					ticket,
					updateData: JSON.parse(hit._source.REQ),
				}));
			})
		);

		const sources = results.flat();

		if (output === "csv") {
			return csvOutput(sources, res);
		}

		return res.json(sources);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error fetching create logs");
	}
};

export const getTicketStatusWFM = async (req: Request, res: Response) => {
	try {
		const { ticket } = req.body || {};
		if (!ticket) {
			return res.status(400).json({
				error: "Invalid request body: 'ticket' is required",
			});
		}

		const response = await getWFMTicketStatus(ticket);
		return res.json(response);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error fetching WFM ticket status");
	}
};

export const getTicketStatusInsera = async (req: Request, res: Response) => {
	try {
		const { ticket } = req.body || {};
		if (!ticket) {
			return res.status(400).json({
				error: "Invalid request body: 'ticket' is required",
			});
		}

		const response = await getInseraTicketStatus(ticket);
		return res.json(response);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error fetching Insera ticket status");
	}
};
