import type { Request, Response } from "express";
import { getLatestOtp } from "../utils/wfm/auth";

export const getLatestWFMOTP = async (req: Request, res: Response) => {
	try {
		const otp = await getLatestOtp();
		if (otp) {
			return res.json({ otp });
		}
		return res.status(404).send("OTP not found");
	} catch (error) {
		console.error(error);
		res.status(500).send("Error getting OTP");
	}
};
