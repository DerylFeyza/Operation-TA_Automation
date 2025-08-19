export const initializeValidationSheet = async (workbook: any) => {
	const validationSheet = workbook.addWorksheet("validation");
	const validationHeaders = [
		"NIK",
		"Name",
		"Witel",
		"Regional",
		"No GSM",
		"Email",
		"No KTP",
		"ID Telegram",
		"Position Name",
		"Craft Akses",
		"sto id",
		"REQ WH SCMT",
		"REQ WH PARADISE",
		"NDE",
		"pengirim",
		"nama_pengirim",
		"tgl_nde",
		"laborcode",
		"REQUEST",
		"GROUP_REQ",
		"STATUS",
		"KETERANGAN",
		"QUERY",
		"TGL_PEMENUHAN",
		"MYTECH",
		"SCMT",
		"WH_CODE_USER",
		"NTE",
		"USER_REQUEST",
		"SCMT ACTIVATE FORMAT",
		"SCMT ADD WH FORMAT",
		"UNGGAH TEKNISI FORMAT",
		"DEACTIVATE FORMAT",
		"ACTIVATE FORMAT",
	];
	validationSheet.addRow(validationHeaders);
	return validationSheet;
};

export const initializeQuerySheet = async (workbook: any) => {
	const querySheet = workbook.addWorksheet("query");
	const queryheaders = [
		"NIK",
		"Name",
		"Witel",
		"Regional",
		"No GSM",
		"Email",
		"No KTP",
		"ID Telegram",
		"Position Name",
		"Craft Akses",
	];
	querySheet.addRow(queryheaders);
	return querySheet;
};

export const initializeNIKLamaSheet = async (workbook: any) => {
	const nikLama1Sheet = workbook.addWorksheet("niklama");
	const nikLama1Headers = ["nik 1", "nik 2"];
	nikLama1Sheet.addRow(nikLama1Headers);
	return nikLama1Sheet;
};

export const initializeMyTechSheet = async (workbook: any, sheet: string) => {
	const myTechSheet = workbook.addWorksheet(sheet);
	const myTechHeaders = [
		"USER_ID",
		"CODE",
		"ACCOUNT_ID",
		"NAME",
		"EMAIL",
		"CREATE_DTM",
		"STATUS_USER",
		"MSISDN",
		"APLIKASI",
		"ID_TELEGRAM",
	];
	myTechSheet.addRow(myTechHeaders);
	return myTechSheet;
};

export const initializeSCMTSheet = async (workbook: any) => {
	const scmtSheet = workbook.addWorksheet("scmt");
	const scmtHeaders = [
		"TECHNICIAN_CODE",
		"TECHNICIAN_NAME",
		"TECHNICIAN_STATUS",
		"CREATED_DATE",
		"WH_CODE",
		"WH_DESCRIPTION",
		"WITEL_CODE",
		"WITEL_NAME",
		"ONT",
		"STB",
		"OTHER",
		"TOTAL_NTE",
		"LAST_TRANSACTION",
		"TIME_STAMP",
		"TECHNICIAN_CODE_REF",
	];
	scmtSheet.addRow(scmtHeaders);
	return scmtSheet;
};
