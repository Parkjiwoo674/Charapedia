import { query } from "../config/db.js";

const MAX_REVIEW_LENGTH = 300;

export async function listReviews(req, res) {
  const { id } = req.params;
  const result = await query(
    `SELECT r.id, r.user_id, r.content, r.created_at, u.nickname
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.character_id = ? ORDER BY r.created_at DESC`,
    [id]
  );
  res.json({ success: true, data: result.rows });
}

export async function createReview(req, res) {
  const { id } = req.params;
  const content = (req.body.content || "").trim();

  if (!content) {
    return res.status(400).json({ success: false, message: "리뷰 내용을 입력해주세요." });
  }
  if (content.length > MAX_REVIEW_LENGTH) {
    return res.status(400).json({ success: false, message: `리뷰는 ${MAX_REVIEW_LENGTH}자 이내로 작성해주세요.` });
  }

  const character = await query("SELECT id FROM characters WHERE id = ?", [id]);
  if (character.rows.length === 0) {
    return res.status(404).json({ success: false, message: "캐릭터를 찾을 수 없습니다." });
  }

  const insert = await query("INSERT INTO reviews (user_id, character_id, content) VALUES (?, ?, ?)", [
    req.user.id,
    id,
    content,
  ]);

  const created = await query(
    `SELECT r.id, r.user_id, r.content, r.created_at, u.nickname
     FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    [insert.rows.insertId]
  );
  res.status(201).json({ success: true, data: created.rows[0] });
}

// 본인이 작성한 리뷰만 삭제 가능
export async function deleteReview(req, res) {
  const { id, reviewId } = req.params;

  const result = await query("SELECT * FROM reviews WHERE id = ? AND character_id = ?", [reviewId, id]);
  const review = result.rows[0];
  if (!review) {
    return res.status(404).json({ success: false, message: "리뷰를 찾을 수 없습니다." });
  }
  if (review.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: "본인이 작성한 리뷰만 삭제할 수 있습니다." });
  }

  await query("DELETE FROM reviews WHERE id = ?", [reviewId]);
  res.json({ success: true, message: "리뷰가 삭제되었습니다." });
}
