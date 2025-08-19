import { Request, Response, NextFunction } from "express";
export interface AuthenticatedIDMTRequest extends Request {
	adminCookie?: string;
	superAdminCookie?: string;
}

export const requireAdminCookie = (
	req: AuthenticatedIDMTRequest,
	res: Response,
	next: NextFunction
) => {
	const adminCookie = req.cookies.idmt_admin;

	if (!adminCookie) {
		return res.status(401).json({ error: "Admin cookie is required" });
	}

	req.adminCookie = adminCookie;
	next();
};

export const requireSuperAdminCookie = (
	req: AuthenticatedIDMTRequest,
	res: Response,
	next: NextFunction
) => {
	const superAdminCookie = req.cookies.idmt_superadmin;

	if (!superAdminCookie) {
		return res.status(401).json({ error: "Super admin cookie is required" });
	}

	req.superAdminCookie = superAdminCookie;
	next();
};
