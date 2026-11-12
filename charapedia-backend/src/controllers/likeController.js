import { query } from "../config/db.js";

// 좋아요 토글: 이미 눌렀으면 취소, 아니면 추가
export async function toggleLike(req, res) {
  const { id } = req.params;

  const character = await query("SELECT id FROM characters WHERE id = ?", [id]);
  if (character.rows.length === 0) {
    return res.status(404).json({ success: false, message: "캐릭터를 찾을 수 없습니다." });
  }

  const existing = await query("SELECT id FROM likes WHERE user_id = ? AND character_id = ?", [req.user.id, id]);

  let liked;
  if (existing.rows.length > 0) {
    await query("DELETE FROM likes WHERE user_id = ? AND character_id = ?", [req.user.id, id]);
    liked = false;
  } else {
    await query("INSERT INTO likes (user_id, character_id) VALUES (?, ?)", [req.user.id, id]);
    liked = true;
  }

  const count = await query("SELECT COUNT(*) AS like_count FROM likes WHERE character_id = ?", [id]);
  res.json({ success: true, data: { liked, like_count: Number(count.rows[0].like_count) } });
}
