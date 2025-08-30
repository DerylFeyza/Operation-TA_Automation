import { client } from "./telegramClient";
import readline from "readline";
import dotenv from "dotenv";
dotenv.config();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function ask(q: string) {
	return new Promise<string>((resolve) => rl.question(q, resolve));
}

(async () => {
	await client.start({
		phoneNumber: async () => process.env.TELEGRAM_PHONE,
		password: async () => process.env.TELEGRAM_2FA_PASSWORD,
		phoneCode: async () => await ask("Code: "),
		onError: (err) => console.error(err),
	});

	console.log("✅ Connected!");
	console.log("Session:", client.session.save());
	rl.close();
})();
