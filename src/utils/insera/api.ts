import axios from "axios";
const INSERA_BASE = process.env.INSERA_BASE;

export const getInseraTicketStatus = async (ticket: string) => {
	try {
		const api = `${INSERA_BASE}id.co.itasoft.telkom.oss.plugin.LoadTicketStatus/service?ticket_id=${ticket}`;

		const response = await axios.get(api, {
			headers: {
				"Access-Control-Allow-Origin": "*",
				Cookie:
					"JSESSIONID=gO395gm_67nB3mPlxKj-CUcaa5Pne5mwb0dl6GQ5.cident-8485984bc9-q9cf7; ADRUM=s~1756000565234&r~aHR0cHMlM0ElMkYlMkZvc3MtaW5jaWRlbnQudGVsa29tLmNvLmlkJTJGanclMkZ3ZWIlMkZ1c2VydmlldyUyRnRpY2tldEluY2lkZW50U2VydmljZSUyRnRpY2tldEluY2lkZW50U2VydmljZSUyRl8lMkZ3ZWxjb21l; a10e07c589b0b6a4b246720bbb392af5=22f20facc49747af47078ecbca20e9ce",
			},
		});
		return {
			data: response.data,
		};
	} catch (error) {
		console.error("Error updating milestone:", error);
		return { error: error.response?.data || error.message || "Unknown error" };
	}
};
