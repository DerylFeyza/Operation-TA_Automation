import { executeQuery } from "../../lib/oracle";
import { AksesMytechType } from "../../types/teknisi";

export async function getAksesSCMT(laborList: string[] = []) {
	try {
		const binds: Record<string, string> = {};
		const placeholders = laborList
			.map((id, index) => {
				const key = `id${index}`;
				binds[key] = id;
				return `:${key}`;
			})
			.join(",");

		const sql = `SELECT * FROM teknisi_scmt@scmt_dblink WHERE TECHNICIAN_CODE IN (${placeholders})`;
		const result = await executeQuery(sql, laborList);
		return result;
	} catch (error) {
		throw error;
	}
}

export async function getAksesTele(
	idTeleList: string[] = []
): Promise<AksesMytechType[]> {
	const binds: Record<string, string> = {};
	const placeholders = idTeleList
		.map((id, index) => {
			const key = `id${index}`;
			binds[key] = id;
			return `:${key}`;
		})
		.join(",");
	const sql = `SELECT user_id,CODE,account_id,NAME,email,
create_dtm,(CASE WHEN (user_status_id=2) THEN 'non aktif' WHEN (user_status_id=3) THEN 'aktif' WHEN (user_status_id=5) THEN 'suspend' END) AS status_user,msisdn,
(CASE WHEN (user_type_id=9) THEN 'my tech' WHEN (user_type_id=5) THEN 'my sol' WHEN (user_type_id=6) THEN 'my squat' END) AS aplikasi,XS1
FROM myindihome_tech.mid_users@solveropo_dblink WHERE xs1 IN (${placeholders})`;
	const result = await executeQuery(sql, idTeleList);
	return result;
}

export async function getAksesMyTech(
	laborList: string[] = []
): Promise<AksesMytechType[]> {
	const binds: Record<string, string> = {};
	const placeholders = laborList
		.map((id, index) => {
			const key = `id${index}`;
			binds[key] = id;
			return `:${key}`;
		})
		.join(",");
	const sql = `SELECT user_id,CODE,account_id,NAME,email,
create_dtm,(CASE WHEN (user_status_id=2) THEN 'non aktif' WHEN (user_status_id=3) THEN 'aktif' WHEN (user_status_id=5) THEN 'suspend' END) AS status_user,msisdn,
(CASE WHEN (user_type_id=9) THEN 'my tech' WHEN (user_type_id=5) THEN 'my sol' WHEN (user_type_id=6) THEN 'my squat' END) AS aplikasi,XS1
FROM myindihome_tech.mid_users@solveropo_dblink WHERE account_id IN (${placeholders})`;
	const result = await executeQuery(sql, laborList);
	return result;
}
