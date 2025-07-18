const express = require("express");
import dotenv from "dotenv";
dotenv.config();
import OracleDB from "oracledb";

import { automate } from "./action/automate";
import { getUsers } from "./utils/naker.query";
import { getAksesSCMT } from "./utils/operation.query";
import type { Request, Response } from "express";

const app = express();
const PORT = 3000;

app.get("/automate", async (req: Request, res: Response) => {
	const result = await getUsers();
	res.send(result);
});

app.get("/akses-scmt", async (req: Request, res: Response) => {
	const result = await getAksesSCMT();
	res.send(result);
});

app.get("/test", (req: Request, res: Response) => {
	console.log("Client Version:", OracleDB.oracleClientVersionString);
	res.send("Automation process started");
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
