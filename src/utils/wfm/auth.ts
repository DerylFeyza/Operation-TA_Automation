import { client, connectTelegram } from "../../lib/telegram/telegramClient";

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
