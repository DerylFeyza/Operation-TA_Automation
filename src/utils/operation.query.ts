import { executeQuery } from "../lib/oracle";

export async function getAksesSCMT() {
	try {
		const sql = `SELECT * FROM teknisi_scmt@scmt_dblink WHERE TECHNICIAN_CODE IN ('20981032')`;
		const result = await executeQuery(sql);
		console.log("Oracle query result:", result);
		return result;
	} catch (error) {
		console.error("Error fetching Oracle users:", error);
		throw error;
	}
}
