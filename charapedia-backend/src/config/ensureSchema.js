import { query } from "./db.js";

async function hasColumn(table, column) {
  const result = await query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(result.rows[0].n) > 0;
}

// 서버가 켜질 때 필요한 컬럼이 없으면 자동으로 추가한다 (기존 DB를 직접 고치지 않아도 되게)
export async function ensureSchema() {
  for (const table of ["email_verifications", "password_resets"]) {
    if (!(await hasColumn(table, "attempts"))) {
      await query(`ALTER TABLE ${table} ADD COLUMN attempts TINYINT UNSIGNED NOT NULL DEFAULT 0`);
      console.log(`[schema] ${table}.attempts 컬럼을 추가했어요.`);
    }
  }

  // 프로필 사진을 DB에도 보관한다 (Render 무료 서버는 재시작하면 디스크가 초기화되기 때문)
  await query(
    `CREATE TABLE IF NOT EXISTS avatar_files (
       user_id INT UNSIGNED NOT NULL PRIMARY KEY,
       filename VARCHAR(80) NOT NULL UNIQUE,
       mime VARCHAR(30) NOT NULL,
       data MEDIUMBLOB NOT NULL,
       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
     )`
  );
}
