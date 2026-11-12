import { query } from "../config/db.js";

const STATUSES = ["pending", "resolved", "dismissed"];

// 신고 목록: 캐릭터별로 묶어서 신고 횟수/사유를 보여준다
export async function listReports(req, res) {
  const status = STATUSES.includes(req.query.status) ? req.query.status : "pending";

  const grouped = await query(
    `SELECT c.id AS character_id, c.name AS character_name, w.title AS work_title,
            COUNT(r.id) AS report_count, MAX(r.created_at) AS latest_reported_at
     FROM reports r
     JOIN characters c ON c.id = r.character_id
     JOIN works w ON w.id = c.work_id
     WHERE r.status = ?
     GROUP BY c.id, c.name, w.title
     ORDER BY report_count DESC, latest_reported_at DESC`,
    [status]
  );

  const items = grouped.rows;
  if (items.length === 0) {
    return res.json({ success: true, data: [] });
  }

  // 각 캐릭터에 접수된 신고 내역(사유/상세/신고자)을 한 번에 조회
  const ids = items.map((i) => i.character_id);
  const placeholders = ids.map(() => "?").join(",");
  const details = await query(
    `SELECT r.character_id, r.reason, r.detail, r.created_at, u.nickname AS reporter_nickname
     FROM reports r JOIN users u ON u.id = r.reporter_id
     WHERE r.status = ? AND r.character_id IN (${placeholders})
     ORDER BY r.created_at DESC`,
    [status, ...ids]
  );

  const byCharacter = new Map();
  for (const d of details.rows) {
    if (!byCharacter.has(d.character_id)) byCharacter.set(d.character_id, []);
    byCharacter.get(d.character_id).push({
      reason: d.reason,
      detail: d.detail,
      reporter_nickname: d.reporter_nickname,
      created_at: d.created_at,
    });
  }

  const data = items.map((i) => ({
    ...i,
    report_count: Number(i.report_count),
    reports: byCharacter.get(i.character_id) || [],
  }));

  res.json({ success: true, data });
}

// 신고 처리 (삭제): 캐릭터를 삭제하면 좋아요/리뷰/신고가 CASCADE로 함께 정리된다
export async function deleteReportedCharacter(req, res) {
  const { id } = req.params;

  const character = await query("SELECT id FROM characters WHERE id = ?", [id]);
  if (character.rows.length === 0) {
    return res.status(404).json({ success: false, message: "캐릭터를 찾을 수 없습니다." });
  }

  await query("DELETE FROM characters WHERE id = ?", [id]);
  res.json({ success: true, message: "캐릭터가 삭제되고 관련 신고가 처리되었습니다." });
}

// 신고 처리 (반려): 캐릭터는 유지하고 대기 중인 신고를 dismissed로 변경
export async function dismissReports(req, res) {
  const { character_id } = req.body;
  if (!character_id) {
    return res.status(400).json({ success: false, message: "character_id가 필요합니다." });
  }

  const result = await query("UPDATE reports SET status = 'dismissed' WHERE character_id = ? AND status = 'pending'", [
    character_id,
  ]);
  if (result.rows.affectedRows === 0) {
    return res.status(404).json({ success: false, message: "처리할 신고가 없습니다." });
  }

  res.json({ success: true, message: "신고가 반려되었습니다." });
}

export async function listUsers(req, res) {
  const result = await query(
    "SELECT id, username, nickname, email, role, created_at FROM users ORDER BY created_at DESC"
  );
  res.json({ success: true, data: result.rows });
}

export async function getStats(req, res) {
  const [users, characters, works, reports, pending] = await Promise.all([
    query("SELECT COUNT(*) AS n FROM users"),
    query("SELECT COUNT(*) AS n FROM characters"),
    query("SELECT COUNT(*) AS n FROM works"),
    query("SELECT COUNT(*) AS n FROM reports"),
    query("SELECT COUNT(*) AS n FROM reports WHERE status = 'pending'"),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers: Number(users.rows[0].n),
      totalCharacters: Number(characters.rows[0].n),
      totalWorks: Number(works.rows[0].n),
      totalReports: Number(reports.rows[0].n),
      pendingReports: Number(pending.rows[0].n),
    },
  });
}
