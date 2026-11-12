import { query } from "../config/db.js";
import { removeAvatarFile } from "../middleware/upload.js";

const MAX_NICKNAME_LENGTH = 20;

export async function getProfile(req, res) {
  const result = await query("SELECT id, username, nickname, role, avatar_url FROM users WHERE id = ?", [req.user.id]);
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
  }
  res.json({ success: true, data: user });
}

export async function updateProfile(req, res) {
  const nickname = (req.body.nickname || "").trim();

  if (!nickname) {
    return res.status(400).json({ success: false, message: "닉네임을 입력해주세요." });
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return res.status(400).json({ success: false, message: `닉네임은 ${MAX_NICKNAME_LENGTH}자 이내로 입력해주세요.` });
  }

  await query("UPDATE users SET nickname = ? WHERE id = ?", [nickname, req.user.id]);
  res.json({ success: true, data: { nickname } });
}

// 프로필 사진 업로드 (파일 검증은 uploadAvatar 미들웨어에서 끝난 상태)
export async function setAvatar(req, res) {
  const old = await query("SELECT avatar_url FROM users WHERE id = ?", [req.user.id]);
  const newUrl = `/uploads/avatars/${req.file.filename}`;

  await query("UPDATE users SET avatar_url = ? WHERE id = ?", [newUrl, req.user.id]);
  removeAvatarFile(old.rows[0]?.avatar_url); // 이전 사진 파일은 정리

  res.json({ success: true, data: { avatar_url: newUrl } });
}

export async function deleteAvatar(req, res) {
  const old = await query("SELECT avatar_url FROM users WHERE id = ?", [req.user.id]);

  await query("UPDATE users SET avatar_url = NULL WHERE id = ?", [req.user.id]);
  removeAvatarFile(old.rows[0]?.avatar_url);

  res.json({ success: true, data: { avatar_url: null } });
}

// 내가 좋아요한 캐릭터
export async function listMyLikes(req, res) {
  const result = await query(
    `SELECT c.id, c.name, c.image_url, w.title AS work_title,
            (SELECT COUNT(*) FROM likes l2 WHERE l2.character_id = c.id) AS like_count
     FROM likes l
     JOIN characters c ON c.id = l.character_id
     JOIN works w ON w.id = c.work_id
     WHERE l.user_id = ?
     ORDER BY l.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: result.rows });
}

// 내가 등록한 캐릭터
export async function listMyCharacters(req, res) {
  const result = await query(
    `SELECT c.id, c.name, c.image_url, w.title AS work_title,
            (SELECT COUNT(*) FROM likes l WHERE l.character_id = c.id) AS like_count
     FROM characters c
     JOIN works w ON w.id = c.work_id
     WHERE c.created_by = ?
     ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: result.rows });
}

// 내가 쓴 리뷰
export async function listMyReviews(req, res) {
  const result = await query(
    `SELECT r.id, r.content, r.created_at, c.id AS character_id, c.name AS character_name
     FROM reviews r
     JOIN characters c ON c.id = r.character_id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: result.rows });
}
