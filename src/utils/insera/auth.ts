import { authenticator } from "otplib";
import * as url from "url";

export function getInseraOtp(): string {
	const parsed = new url.URL(process.env.INSERA_AUTHENTICATOR || "");
	const secret = parsed.searchParams.get("secret");

	if (!secret) {
		throw new Error("No secret found in OTP URI");
	}

	return authenticator.generate(secret);
}
