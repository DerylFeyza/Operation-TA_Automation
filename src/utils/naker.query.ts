import { mysqlpool as mysql } from "../lib/mysql";

export async function getUsers() {
	const [rows] = await mysql.query(`SELECT * FROM (SELECT
me.nik,
me.name,
e.ta_area AS witel,
f.ta_area AS teritory,
g.ta_area AS regional,
me.no_gsm,
me.email,
me.no_ktp,
up.id_telegram,
om.position_name
FROM naker.master_employee me
JOIN naker.employee_mapping em
ON me.nik = em.nik AND me.status_naker IN (1,4)
JOIN naker.master_om om 
ON om.object_id = em.object_id
JOIN naker.area_ta d
ON om.psa = d.ta_area
JOIN naker.area_ta e
ON d.parent = e.ta_area
JOIN naker.area_ta f
ON e.parent = f.ta_area
JOIN naker.area_ta g
ON f.parent = g.ta_area
JOIN naker.status_naker h
ON me.status_naker = h.id_status_naker
LEFT JOIN notif_hcm.user_push_notif_telegram up ON up.nik = me.nik
WHERE me.status_naker IN (1,4) AND om.level_idx='10'
UNION ALL
SELECT mem.nik, mem.name,
a.ta_area AS witel,
b.ta_area AS teritory,
c.ta_area AS regional,
mem.no_telp AS no_gsm,
mem.email,
mem.no_ktp,
up.id_telegram,
tpm.nama_posisi_mitra AS position_name
FROM naker.master_employee_mitra mem
JOIN
naker.t_posisi_mitra tpm ON mem.position_name = tpm.id_posisi_mitra
LEFT JOIN naker.area_ta a 
          ON mem.witel = a.ta_area 
        LEFT JOIN naker.area_ta b 
          ON a.parent = b.ta_area 
        LEFT JOIN naker.area_ta c 
          ON b.parent = c.ta_area 
          LEFT JOIN notif_hcm.user_push_notif_telegram up ON up.nik = mem.nik
WHERE mem.status_naker IN (1,4)) AS teknisi WHERE teknisi.nik IN ('16005145',
'16070091',
'16070092',
'16005146',
'16041088',
'16022973',
'16050889',
'16995393',
'16992994'
)`);
	console.log(rows);
	return rows;
}
