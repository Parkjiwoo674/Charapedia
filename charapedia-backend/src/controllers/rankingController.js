import { query } from "../config/db.js";

// 좋아요 수 기준 인기 캐릭터 랭킹 (작품별 필터 가능)
export async function getRanking(req, res) {
  const { work_id } = req.query;
  const params = [];
  let whereClause = "";

  if (work_id) {
    whereClause = "WHERE c.work_id = ?";
    params.push(work_id);
  }

  const result = await query(
    `SELECT c.id, c.name, c.image_url, w.title AS work_title,
            (SELECT COUNT(*) FROM likes l WHERE l.character_id = c.id) AS like_count
     FROM characters c
     JOIN works w ON w.id = c.work_id
     ${whereClause}
     ORDER BY like_count DESC, c.created_at DESC
     LIMIT 50`,
    params
  );

  res.json({ success: true, data: result.rows });
}
