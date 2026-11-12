import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// mysql2는 결과를 [rows, fields] 형태로 반환하므로
// pg 스타일(.rows)에 익숙하도록 감싸서 { rows } 형태로 통일한다.
export async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return { rows };
}