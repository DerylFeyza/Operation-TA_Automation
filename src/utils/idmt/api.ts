import axios from "axios";
const IDMT_BASE = process.env.IDMT_BASE;
export const trackUser = async (labor: string, cookie: string) => {
	try {
		const api = `${IDMT_BASE}idmt/technician/get-technician`;
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

export const checkApprovalExist = async (labor: string, cookie: string) => {
	try {
		const api = `${IDMT_BASE}idmt/approval/list`;
		const formData = new FormData();
		formData.append("columns[0][data]", "id");
		formData.append("columns[0][name]", "p.id");
		formData.append("columns[2][data]", "code");
		formData.append("columns[2][name]", "p.code");
		formData.append("columns[2][searchable]", "true");
		formData.append("draw", "5");
		formData.append("order[0][column]", "0");

		formData.append("search[value]", labor);

		const response = await axios.post(api, formData, {
			headers: {
				Cookie: `idmt=${cookie}`,
			},
		});

		const id = response.data.data[0]?.id || "-";
		const formattedResponse = {
			labor: labor,
			id: id,
		};
		return formattedResponse;
	} catch (error) {
		console.error("Error checking approval existence:", error);
		return { error: error.response?.data || error.message || "Unknown error" };
	}
};

export const checkPersonId = async (labor: string, cookie: string) => {
	try {
		const api = `${IDMT_BASE}idmt/technician/list`;
		const formData = new FormData();
		formData.append("columns[0][data]", "id");
		formData.append("columns[0][name]", "p.id");
		formData.append("columns[2][data]", "code");
		formData.append("columns[2][name]", "p.code");
		formData.append("columns[2][searchable]", "true");
		formData.append("draw", "5");
		formData.append("order[0][column]", "0");
		formData.append("search[value]", labor);
		const response = await axios.post(api, formData, {
			headers: {
				Cookie: `idmt=${cookie}`,
			},
		});
		const id = response.data.data[0]?.id || "-";
		return {
			labor: labor,
			personId: id,
		};
	} catch (error) {
		console.error("Error checking person ID:", error);
		return { error: error.response?.data || error.message || "Unknown error" };
	}
};

export const getTechnicianWarehouse = async (
	labor: string,
	personId: string,
	cookie: string
) => {
	try {
		if (personId === "-") {
			return { labor: labor, personId: "-", warehouse: "-" };
		}
		const api = `${IDMT_BASE}person/attribute/load-saved-attribute`;
		const formData = new FormData();
		formData.append("person_id", personId);
		const response = await axios.post(api, formData, {
			headers: {
				Cookie: `idmt=${cookie}`,
			},
		});
		const whAttribute = response.data.data.find(
			(item: any) => item.attr_code === "WH"
		);
		const whValue = whAttribute ? whAttribute.attr_value : null;
		const formattedResponse = {
			labor: labor,
			personId: personId,
			warehouse_IDMT: whValue,
		};
		return formattedResponse;
	} catch (error) {
		console.error("Error checking technician warehouse:", error);
		return { error: error.response?.data || error.message || "Unknown error" };
	}
};

export const approveTeknisi = async (
	labor: string,
	personId: string,
	cookie: string
) => {
	try {
		if (personId === "-") {
			return { labor: labor, personId: "-", data: "-" };
		}
		const api = `${IDMT_BASE}idmt/approval/approve`;
		const formData = new FormData();
		formData.append("personId", personId);

		const response = await axios.post(api, formData, {
			headers: {
				Cookie: `idmt=${cookie}`,
			},
		});
		return {
			labor: labor,
			personId: personId,
			data: response.data,
		};
	} catch (error) {
		console.error("Error approving technician:", error);
		return { error: error.response?.data || error.message || "Unknown error" };
	}
};
