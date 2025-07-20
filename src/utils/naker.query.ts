import { mysqlpool as mysql } from "../lib/mysql";
import { TeknisiType, NIKLamaType } from "../types/teknisi";

export async function getTeknisi(
	nikList: string[] = []
): Promise<TeknisiType[]> {
	const placeholders = nikList.map(() => "?").join(",");
	const [rows] = await mysql.query(
		`SELECT * FROM (SELECT
me.nik,
me.name,
ati.witel_idmt AS witel,
ati.regional_idmt AS regional,
me.no_gsm,
me.email,
me.no_ktp,
up.id_telegram,
om.position_name,
mut.craft_akses
FROM naker.master_employee me
JOIN naker.employee_mapping em
ON me.nik = em.nik AND me.status_naker IN (1,4)
JOIN naker.master_om om
ON om.object_id = em.object_id
JOIN naker.area_ta d
ON om.psa = d.ta_area
JOIN naker.area_ta e
ON d.parent = e.ta_area
JOIN naker.status_naker h
ON me.status_naker = h.id_status_naker
LEFT JOIN notif_hcm.user_push_notif_telegram up ON up.nik = me.nik
LEFT JOIN eva_only.matrix_user_teknisi mut ON mut.position_name = om.position_name
LEFT JOIN eva_only.area_ta_idmt ati ON ati.witel_hrmista = e.ta_area
WHERE me.status_naker IN (1,4) AND om.level_idx='10'
UNION ALL
SELECT mem.nik, mem.name,
ati.witel_idmt AS witel,
ati.regional_idmt AS regional,
mem.no_telp AS no_gsm,
mem.email,
mem.no_ktp,
up.id_telegram,
tpm.nama_posisi_mitra AS position_name,
mut.craft_akses
FROM naker.master_employee_mitra mem
JOIN naker.t_posisi_mitra tpm ON mem.position_name = tpm.id_posisi_mitra
LEFT JOIN naker.area_ta a ON mem.witel = a.ta_area
LEFT JOIN notif_hcm.user_push_notif_telegram up ON up.nik = mem.nik
LEFT JOIN eva_only.matrix_user_teknisi mut ON tpm.nama_posisi_mitra = mut.position_name
LEFT JOIN eva_only.area_ta_idmt ati ON ati.witel_hrmista = a.ta_area
WHERE mem.status_naker IN (1,4)
UNION ALL
SELECT
me.nik,
me.name,
NULL AS witel,
NULL AS regional,
NULL AS no_gsm,
NULL AS email,
NULL AS no_ktp,
NULL AS id_telegram,
sn.status_naker AS position_name,
NULL AS craft_akses
FROM naker.master_employee me
JOIN naker.status_naker sn ON me.status_naker = sn.id_status_naker
WHERE me.status_naker NOT IN (1,4)
UNION ALL
SELECT
mem.nik,
mem.name,
NULL AS witel,
NULL AS regional,
NULL AS no_gsm,
NULL AS email,
NULL AS no_ktp,
NULL AS id_telegram,
sn.status_naker AS position_name,
NULL AS craft_akses
FROM naker.master_employee_mitra mem
JOIN naker.status_naker sn ON mem.status_naker = sn.id_status_naker
WHERE mem.status_naker NOT IN (1,4)
UNION ALL
SELECT
me.nik,
me.name,
NULL AS witel,
NULL AS regional,
NULL AS no_gsm,
NULL AS email,
NULL AS no_ktp,
NULL AS id_telegram,
'BUKAN TEKNISI' AS position_name,
NULL AS craft_akses
FROM naker.master_employee me
JOIN naker.employee_mapping em ON me.nik = em.nik AND me.status_naker IN (1,4)
JOIN naker.master_om om ON om.object_id = em.object_id
JOIN naker.status_naker h ON me.status_naker = h.id_status_naker
WHERE me.status_naker IN (1,4) AND om.level_idx<>'10'
) AS teknisi WHERE teknisi.nik IN (${placeholders})`,
		nikList
	);

	console.log(rows);
	return rows as TeknisiType[];
}

export async function cekNIKLama(
	nikList: string[] = []
): Promise<NIKLamaType[]> {
	const placeholders = nikList.map(() => "?").join(",");
	const [rows] = await mysql.query(
		`select nik_baru,nik_lama from naker.history_nik hn where nik_baru in (${placeholders})`,
		nikList
	);
	return rows as NIKLamaType[];
}
