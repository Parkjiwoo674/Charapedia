import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { removeAvatarFile } from "../middleware/upload.js";
import { sendVerificationEmail, sendPasswordResetEmail, generateCode } from "../utils/mailer.js";
import {
  asString,
  normalizeEmail,
  isValidEmail,
  USERNAME_RE,
  PASSWORD_RE,
  CODE_RE,
  MAX_PASSWORD_LENGTH,
} from "../utils/validators.js";

const CODE_TTL_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5; // 인증번호는 최대 5번까지만 입력해볼 수 있다
const MAX_NICKNAME_LENGTH = 20;

function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    role: row.role,
    avatar_url: row.avatar_url ?? null,
  };
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function bad(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// 비밀번호 규칙 검사. 통과하면 null, 아니면 에러 메시지
function passwordError(password) {
  if (typeof password !== "string" || !PASSWORD_RE.test(password)) {
    return "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.";
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `비밀번호는 ${MAX_PASSWORD_LENGTH}자 이내로 입력해주세요.`;
  }
  return null;
}

// 인증번호 확인 (회원가입 / 비밀번호 재설정 공용)
// 시도 횟수를 "먼저" 원자적으로 올린 뒤 비교하므로, 요청을 동시에 여러 개 보내도
// 비교 기회는 MAX_CODE_ATTEMPTS번을 넘지 못한다.
async function verifyCode(table, email, code) {
  const found = await query(`SELECT id, code, expires_at, attempts FROM ${table} WHERE email = ?`, [email]);
  const row = found.rows[0];

  if (!row) {
    return { ok: false, status: 400, message: "인증번호를 먼저 요청해주세요." };
  }
  if (new Date(row.expires_at) <= new Date()) {
    return { ok: false, status: 400, message: "인증번호가 만료되었습니다. 재발송해주세요." };
  }

  const bump = await query(`UPDATE ${table} SET attempts = attempts + 1 WHERE id = ? AND attempts < ?`, [
    row.id,
    MAX_CODE_ATTEMPTS,
  ]);
  if (bump.rows.affectedRows === 0) {
    return {
      ok: false,
      status: 429,
      message: "인증번호 입력 가능 횟수를 초과했어요. 인증번호를 다시 받아주세요.",
    };
  }

  if (!safeEqual(row.code, code)) {
    const left = MAX_CODE_ATTEMPTS - (row.attempts + 1);
    const message =
      left > 0
        ? `인증번호가 일치하지 않습니다. (남은 시도 ${left}회)`
        : "인증번호가 일치하지 않습니다. 입력 가능 횟수를 모두 사용했어요. 인증번호를 다시 받아주세요.";
    return { ok: false, status: 400, message };
  }

  return { ok: true };
}

// 같은 이메일로 다시 요청하면 새 번호로 덮어쓰고 시도 횟수도 0으로 되돌린다
async function saveCode(table, email, code) {
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  await query(
    `INSERT INTO ${table} (email, code, expires_at, attempts)
     VALUES (?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at), attempts = 0`,
    [email, code, expiresAt]
  );
}

const MAIL_FAILED = "인증 메일을 보내지 못했어요. 잠시 후 다시 시도해주세요.";

export async function sendCode(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!isValidEmail(email)) {
    return bad(res, "올바른 이메일 주소를 입력해주세요.");
  }

  const existingUser = await query("SELECT id FROM users WHERE email = ?", [email]);
  if (existingUser.rows.length > 0) {
    return bad(res, "이미 가입된 이메일입니다.", 409);
  }

  const code = generateCode();
  await saveCode("email_verifications", email, code);

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    console.error("인증 메일 발송 실패:", err.message);
    return bad(res, MAIL_FAILED, 502);
  }

  res.json({ success: true, message: "인증번호를 이메일로 발송했습니다." });
}

export async function signup(req, res) {
  const username = asString(req.body.username);
  const nickname = asString(req.body.nickname);
  const password = req.body.password;
  const email = normalizeEmail(req.body.email);
  const code = asString(req.body.code);

  if (!username || !nickname || typeof password !== "string" || !email || !code) {
    return bad(res, "모든 항목을 입력해주세요.");
  }
  if (!USERNAME_RE.test(username)) {
    return bad(res, "아이디는 영문, 숫자, 밑줄(_)만 사용해서 4~20자로 입력해주세요.");
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return bad(res, `닉네임은 ${MAX_NICKNAME_LENGTH}자 이내로 입력해주세요.`);
  }
  const pwError = passwordError(password);
  if (pwError) return bad(res, pwError);
  if (!isValidEmail(email)) {
    return bad(res, "올바른 이메일 주소를 입력해주세요.");
  }
  if (!CODE_RE.test(code)) {
    return bad(res, "인증번호는 숫자 6자리예요.");
  }

  const verified = await verifyCode("email_verifications", email, code);
  if (!verified.ok) return bad(res, verified.message, verified.status);

  const dupUsername = await query("SELECT id FROM users WHERE username = ?", [username]);
  if (dupUsername.rows.length > 0) {
    return bad(res, "이미 사용 중인 아이디입니다.", 409);
  }
  const dupEmail = await query("SELECT id FROM users WHERE email = ?", [email]);
  if (dupEmail.rows.length > 0) {
    return bad(res, "이미 가입된 이메일입니다.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const insertResult = await query(
    "INSERT INTO users (username, nickname, email, password_hash) VALUES (?, ?, ?, ?)",
    [username, nickname, email, passwordHash]
  );
  const newUserId = insertResult.rows.insertId;

  await query("DELETE FROM email_verifications WHERE email = ?", [email]);

  const user = { id: newUserId, username, nickname, role: "user", avatar_url: null };
  const token = signToken(user);
  res.status(201).json({ success: true, token, user: toPublicUser(user) });
}

export async function login(req, res) {
  const username = asString(req.body.username);
  const password = req.body.password;

  if (!username || typeof password !== "string" || !password) {
    return bad(res, "아이디와 비밀번호를 입력해주세요.");
  }
  if (username.length > 50 || password.length > 128) {
    return bad(res, "아이디 또는 비밀번호가 일치하지 않습니다.", 401);
  }

  const result = await query("SELECT * FROM users WHERE username = ?", [username]);
  const user = result.rows[0];
  if (!user) {
    return bad(res, "아이디 또는 비밀번호가 일치하지 않습니다.", 401);
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    return bad(res, "아이디 또는 비밀번호가 일치하지 않습니다.", 401);
  }

  const token = signToken(user);
  res.json({ success: true, token, user: toPublicUser(user) });
}

export async function me(req, res) {
  const result = await query("SELECT id, username, nickname, role, avatar_url FROM users WHERE id = ?", [req.user.id]);
  const user = result.rows[0];
  if (!user) {
    return bad(res, "사용자를 찾을 수 없습니다.", 404);
  }
  res.json({ success: true, data: user });
}

// ── 비밀번호 재설정 ──

export async function forgotPassword(req, res) {
  const username = asString(req.body.username);
  const email = normalizeEmail(req.body.email);

  if (!username || !email) {
    return bad(res, "아이디와 이메일을 입력해주세요.");
  }
  if (!isValidEmail(email)) {
    return bad(res, "올바른 이메일 주소를 입력해주세요.");
  }

  const result = await query("SELECT id FROM users WHERE username = ? AND email = ?", [username, email]);
  if (result.rows.length === 0) {
    return bad(res, "아이디와 이메일이 일치하는 계정을 찾을 수 없습니다.", 404);
  }

  const code = generateCode();
  await saveCode("password_resets", email, code);

  try {
    await sendPasswordResetEmail(email, code);
  } catch (err) {
    console.error("비밀번호 재설정 메일 발송 실패:", err.message);
    return bad(res, MAIL_FAILED, 502);
  }

  res.json({ success: true, message: "인증번호를 이메일로 발송했습니다." });
}

export async function resetPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  const code = asString(req.body.code);
  const newPassword = req.body.newPassword;

  if (!email || !code || typeof newPassword !== "string") {
    return bad(res, "모든 항목을 입력해주세요.");
  }
  const pwError = passwordError(newPassword);
  if (pwError) return bad(res, pwError);
  if (!CODE_RE.test(code)) {
    return bad(res, "인증번호는 숫자 6자리예요.");
  }

  const verified = await verifyCode("password_resets", email, code);
  if (!verified.ok) return bad(res, verified.message, verified.status);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await query("UPDATE users SET password_hash = ? WHERE email = ?", [passwordHash, email]);
  await query("DELETE FROM password_resets WHERE email = ?", [email]);

  res.json({ success: true, message: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요." });
}

// ── 회원탈퇴 ──

export async function deleteAccount(req, res) {
  const password = req.body.password;
  if (typeof password !== "string" || !password) {
    return bad(res, "비밀번호를 입력해주세요.");
  }

  const result = await query("SELECT * FROM users WHERE id = ?", [req.user.id]);
  const user = result.rows[0];
  if (!user) {
    return bad(res, "사용자를 찾을 수 없습니다.", 404);
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    return bad(res, "비밀번호가 일치하지 않습니다.", 401);
  }

  await query("DELETE FROM users WHERE id = ?", [req.user.id]);
  removeAvatarFile(user.avatar_url); // 업로드했던 프로필 사진 파일도 함께 삭제
  res.json({ success: true, message: "회원 탈퇴가 완료되었습니다." });
}
