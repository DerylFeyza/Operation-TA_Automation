import axios from "axios";
const IDMT_BASE = process.env.IDMT_BASE;
export const trackUser = async (labor: string, cookie: string) => {
	try {
		const api = `${IDMT_BASE}technician/get-technician`;
		const formData = new FormData();
		formData.append("personCode", labor);
		const response = await axios.post(api, formData, {
			headers: {
				Cookie: `idmt=${cookie}`,
			},
		});
		const data = response.data.data;
		const formattedResponse = {
			labor: data.person.code || "-",
			name: data.person.name || "-",
			IDMT:
				Array.isArray(data.accounts.IDMT) && data.accounts.IDMT.length === 0
					? "-"
					: data.accounts.IDMT?.status || "-",
			WFM:
				Array.isArray(data.accounts.WFM) && data.accounts.WFM.length === 0
					? "-"
					: data.accounts.WFM?.status || "-",
			Paradise:
				Array.isArray(data.accounts.Paradise) &&
				data.accounts.Paradise.length === 0
					? "-"
					: data.accounts.Paradise?.status || "-",
			MyTechConsumer:
				Array.isArray(data.accounts["MyTech-Consumer"]) &&
				data.accounts["MyTech-Consumer"].length === 0
					? "-"
					: data.accounts["MyTech-Consumer"]?.status || "-",
			MyTechEBIS:
				Array.isArray(data.accounts["MyTech-EBIS"]) &&
				data.accounts["MyTech-EBIS"].length === 0
					? "-"
					: data.accounts["MyTech-EBIS"]?.status || "-",
			MyTechWHOLESALE:
				Array.isArray(data.accounts["MyTech-WHOLESALE"]) &&
				data.accounts["MyTech-WHOLESALE"].length === 0
					? "-"
					: data.accounts["MyTech-WHOLESALE"]?.status || "-",
			NEW_SCMT:
				Array.isArray(data.accounts.NEW_SCMT) &&
				data.accounts.NEW_SCMT.length === 0
					? "-"
					: data.accounts.NEW_SCMT?.status || "-",
		};
		console.log("Formatted Response for labor:", labor);
		console.log(formattedResponse);
		return formattedResponse;
	} catch (error) {
		// console.error("Error tracking user:", error);
		return { error: error.response?.data || error.message || "Unknown error" };
	}
};
