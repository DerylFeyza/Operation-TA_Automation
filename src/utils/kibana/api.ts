import axios from "axios";
const KIBANA_BASE = process.env.KIBANA_BASE;

export async function getKibanaLogs({ queryString, termValue, size }) {
	const url = KIBANA_BASE;

	const body = {
		params: {
			index: "kafka_logs*",
			body: {
				size: size,
				query: {
					bool: {
						must: [
							{ query_string: { query: queryString } },
							{ term: { "ACTION.keyword": termValue } },
						],
					},
				},
				sort: [{ "@timestamp": "desc" }],
			},
		},
	};

	try {
		const response = await axios.post(url, body, {
			auth: {
				username: process.env.KIBANA_USERNAME,
				password: process.env.KIBANA_PASSWORD,
			},
			headers: {
				"kbn-xsrf": "true",
				"Content-Type": "application/json",
			},
		});

		return response.data;
	} catch (err) {
		console.error(
			"Error fetching kibana logs:",
			err.response?.data || err.message
		);
		throw err;
	}
}
