import mysql from "mysql2/promise";

export const mysqlpool = mysql.createPool({
	host: process.env.NAKER_HOST,
	user: process.env.NAKER_USER,
	password: process.env.NAKER_PASSWORD,
	database: process.env.NAKER_DATABASE,
	port: 3306,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});
