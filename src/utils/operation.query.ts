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

export async function getAksesTele(idTeleList: string[] = []) {
	const placeholders = idTeleList.map(() => "?").join(",");
	const sql = `SELECT user_id,CODE,account_id,NAME,email,
create_dtm,(CASE WHEN (user_status_id=2) THEN 'non aktif' WHEN (user_status_id=3) THEN 'aktif' WHEN (user_status_id=5) THEN 'suspend' END) AS status_user,msisdn,
(CASE WHEN (user_type_id=9) THEN 'my tech' WHEN (user_type_id=5) THEN 'my sol' WHEN (user_type_id=6) THEN 'my squat' END) AS aplikasi,XS1
FROM myindihome_tech.mid_users@solveropo_dblink WHERE xs1 IN (${placeholders})`;
	const result = await executeQuery(sql, idTeleList);
	console.log("SQL Query:", result);
	return result;
}
