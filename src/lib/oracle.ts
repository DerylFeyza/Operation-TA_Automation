const oracledb = require("oracledb");

try {
	oracledb.initOracleClient({ libDir: "C:\\oracle\\instantclient_19_27" });
	console.log("Oracle client initialized successfully");
} catch (err) {
	console.error("Oracle client initialization failed:", err);
}

const dbConfig = {
	user: process.env.ORACLE_USER,
	password: process.env.ORACLE_PASSWORD,
	connectString: process.env.ORACLE_CONNECTION_STRING,
};

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export async function executeQuery(sql: string, binds: any[] = []) {
	let connection;

	try {
		connection = await oracledb.getConnection(dbConfig);
		const result = await connection.execute(sql, binds);
		return result.rows;
	} catch (error) {
		console.error("Oracle Database Error:", error);
		throw error;
	} finally {
		if (connection) {
			try {
				await connection.close();
			} catch (error) {
				console.error("Error closing connection:", error);
			}
		}
	}
}

// Test connection function
export async function testConnection() {
	let connection;

	try {
		connection = await oracledb.getConnection(dbConfig);
		console.log("Oracle Database connected successfully");
		return true;
	} catch (error) {
		console.error("Oracle connection failed:", error);
		return false;
	} finally {
		if (connection) {
			await connection.close();
		}
	}
}
