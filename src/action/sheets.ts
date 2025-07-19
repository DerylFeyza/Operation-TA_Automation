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
		"request wh code",
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
