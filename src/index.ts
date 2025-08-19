import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import type { Request, Response } from "express";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (res: Response) => {
	res.send("NDE Format Automation API by deryl");
});

const validationRoute = require("./routes/validation.route");
app.use("/validation", validationRoute);
const technicianRoute = require("./routes/technician.route");
app.use("/technician", technicianRoute);

app.listen(process.env.PORT || 3003, () => {
	console.log(`Server running on http://localhost:${process.env.PORT || 3003}`);
});
