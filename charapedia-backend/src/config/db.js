import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // TiDB Cloud 같은 외부 DB는 암호화(TLS) 접속이 필수라서 DB_SSL=true 일 때만 켠다 (로컬 MySQL은 그대로)
  ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
});

// mysql2는 결과를 [rows, fields] 형태로 반환하므로
// pg 스타일(.rows)에 익숙하도록 감싸서 { rows } 형태로 통일한다.
export async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return { rows };
}