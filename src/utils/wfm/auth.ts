import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { client, connectTelegram } from "../../lib/telegram/telegramClient";
import * as cheerio from "cheerio";
import axios from "axios";
const WFM_BASE = process.env.WFM_BASE;

const jar = new CookieJar();

export async function getWFMCookies() {
	const wfmClient = wrapper(
		axios.create({
			baseURL: WFM_BASE,
			jar,
			withCredentials: true, // must have to send cookies
		})
	);

	const csrfResponse = await wfmClient.get("");
	const $ = cheerio.load(csrfResponse.data);
	const csrfToken = $('meta[name="csrf-token"]').attr("content");
	const loginResponse = await wfmClient.post(
		"login",
		{
			username: process.env.WFM_USERNAME,
			password: process.env.WFM_PASSWORD,
			_token: csrfToken,
		},
		{
			headers: {
				Referer: WFM_BASE,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		}
	);

	return loginResponse.data;
}

export async function getLatestOtp(): Promise<string | null> {
	await connectTelegram();

	const entity = await client.getEntity("HCMTelkomAksesBot");
	const messages = await client.getMessages(entity, { limit: 1 });

	if (messages.length > 0) {
		const msg = messages[0].message || "";
		const otpMatch = msg.match(/\b\d{6}\b/);
		if (otpMatch) {
			return otpMatch[0];
		}
	}
	return null;
}
