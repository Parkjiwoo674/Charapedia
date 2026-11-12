import { query } from "../config/db.js";

const REASONS = ["spam", "copyright", "abuse", "other"];

// 캐릭터 신고 접수 (동일 사용자가 같은 캐릭터를 중복 신고할 수 없음)
export async function createReport(req, res) {
  const { id } = req.params;
  const { reason, detail } = req.body;

  if (!REASONS.includes(reason)) {
    return res.status(400).json({ success: false, message: "신고 사유를 올바르게 선택해주세요." });
  }
  if (detail && detail.length > 500) {
    return res.status(400).json({ success: false, message: "상세 사유는 500자 이내로 작성해주세요." });
  }

  const character = await query("SELECT id, created_by FROM characters WHERE id = ?", [id]);
  if (character.rows.length === 0) {
    return res.status(404).json({ success: false, message: "캐릭터를 찾을 수 없습니다." });
  }
  if (character.rows[0].created_by === req.user.id) {
    return res.status(400).json({ success: false, message: "본인이 등록한 캐릭터는 신고할 수 없습니다." });
  }

  const existing = await query("SELECT id FROM reports WHERE reporter_id = ? AND character_id = ?", [
    req.user.id,
    id,
  ]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ success: false, message: "이미 신고한 캐릭터입니다." });
  }

  await query("INSERT INTO reports (reporter_id, character_id, reason, detail) VALUES (?, ?, ?, ?)", [
    req.user.id,
    id,
    reason,
    detail ? detail.trim() : null,
  ]);

  res.status(201).json({ success: true, message: "신고가 접수되었습니다." });
}
