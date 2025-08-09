import { CellValue } from "exceljs";

export interface TeknisiType {
	nik: string;
	name: string;
	witel: string;
	regional: string;
	no_gsm: string;
	email: string;
	no_ktp: string;
	id_telegram: string;
	position_name: string;
	craft_akses: string;
}

export interface NIKLamaType {
	nik_baru: string;
	nik_lama: string;
}

export interface AksesMytechType {
	USER_ID: number;
	CODE: string;
	ACCOUNT_ID: string;
	NAME: string;
	EMAIL: string;
	CREATE_DTM: Date;
	STATUS_USER: string;
	MSISDN: string;
	APLIKASI: string;
	XS1: string;
}

export interface AksesSCMTType {
	TECHNICIAN_CODE: string;
	TECHNICIAN_NAME: string;
	TECHNICIAN_STATUS: string;
	CREATED_DATE: Date;
	WH_CODE: string | null;
	WH_DESCRIPTION: string | null;
	WITEL_CODE: string | null;
	WITEL_NAME: string | null;
	ONT: number;
	STB: number;
	OTHER: number;
	TOTAL_NTE: number;
	LAST_TRANSACTION: Date | null;
	TIME_STAMP: Date;
	TECHNICIAN_CODE_REF: string;
}

export interface AksesValidation {
	labor: string;
	mytech: string;
	scmt: string;
	nte: number;
	reject?: boolean;
	action?: string;
}

export interface sourceSheetType {
	nik: CellValue;
	sto: CellValue;
	ccan: CellValue;
	inv: CellValue;
	nde: CellValue;
	nikpengirim: CellValue;
	pengirim: CellValue;
	tglnde: CellValue;
	request: CellValue;
}
