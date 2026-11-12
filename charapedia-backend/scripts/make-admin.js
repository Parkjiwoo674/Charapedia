// 사용법 (charapedia-backend 폴더에서): node scripts/make-admin.js 내아이디
// 이미 가입한 계정을 관리자(admin)로 바꿉니다. MySQL Workbench 없이도 쓸 수 있어요.
import { query, pool } from "../src/config/db.js";

const username = process.argv[2];

if (!username) {
  console.log("사용법: node scripts/make-admin.js <아이디>");
  process.exit(1);
}

const found = await query("SELECT id, role FROM users WHERE username = ?", [username]);

if (found.rows.length === 0) {
  console.log(`'${username}' 아이디의 회원이 없어요. 먼저 사이트에서 회원가입부터 하세요.`);
} else if (found.rows[0].role === "admin") {
  console.log(`'${username}' 계정은 이미 관리자예요.`);
} else {
  await query("UPDATE users SET role = 'admin' WHERE username = ?", [username]);
  console.log(`'${username}' 계정을 관리자로 바꿨어요. 사이트에서 로그아웃 후 다시 로그인하세요.`);
}

await pool.end();