import { query } from "../config/db.js";
import { asString, isHttpUrl } from "../utils/validators.js";

const LIMITS = { name: 100, description: 2000, quote: 500, imageUrl: 2000 };

// 캐릭터 입력값 검사. 값이 undefined면 "보내지 않은 항목"이라 건너뛴다. 문제가 있으면 에러 메시지를 돌려준다
function validateCharacterFields({ name, description, image_url, quote }) {
  if (name !== undefined) {
    const v = asString(name);
    if (!v) return "캐릭터 이름을 입력해주세요.";
    if (v.length > LIMITS.name) return `캐릭터 이름은 ${LIMITS.name}자 이내로 입력해주세요.`;
  }
  if (description !== undefined && asString(description).length > LIMITS.description) {
    return `특징은 ${LIMITS.description}자 이내로 입력해주세요.`;
  }
  if (quote !== undefined && asString(quote).length > LIMITS.quote) {
    return `명대사는 ${LIMITS.quote}자 이내로 입력해주세요.`;
  }
  if (image_url !== undefined) {
    const v = asString(image_url);
    if (v.length > LIMITS.imageUrl) return `이미지 주소는 ${LIMITS.imageUrl}자 이내로 입력해주세요.`;
    if (v && !isHttpUrl(v)) return "이미지 주소는 http:// 또는 https:// 로 시작하는 주소만 사용할 수 있어요.";
  }
  return null;
}

export async function listCharacters(req, res) {
  const { work_id, search, page = 1, limit = 12 } = req.query;
  const conditions = [];
  const params = [];

  if (work_id) {
    conditions.push("c.work_id = ?");
    params.push(work_id);
  }
  if (search) {
    conditions.push("c.name LIKE ?");
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // LIMIT/OFFSET은 반드시 정수로 검증한 뒤 문자열에 직접 넣는다 (mysql2 prepared statement가
  // LIMIT/OFFSET 플레이스홀더에서 종종 ER_WRONG_ARGUMENTS를 내는 알려진 이슈 회피용)
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;

  const dataResult = await query(
    `SELECT c.id, c.name, c.image_url, w.title AS work_title,
            (SELECT COUNT(*) FROM likes l WHERE l.character_id = c.id) AS like_count
     FROM characters c
     JOIN works w ON w.id = c.work_id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  const countResult = await query(`SELECT COUNT(*) AS total FROM characters c ${whereClause}`, params);

  res.json({
    success: true,
    data: dataResult.rows,
    pagination: { total: countResult.rows[0].total, page: safePage, limit: safeLimit },
  });
}

export async function getCharacter(req, res) {
  const { id } = req.params;

  const result = await query(
    `SELECT c.*, w.title AS work_title,
            (SELECT COUNT(*) FROM likes l WHERE l.character_id = c.id) AS like_count
     FROM characters c
     JOIN works w ON w.id = c.work_id
     WHERE c.id = ?`,
    [id]
  );
  const character = result.rows[0];
  if (!character) {
    return res.status(404).json({ success: false, message: "캐릭터를 찾을 수 없습니다." });
  }

  const reviewsResult = await query(
    `SELECT r.id, r.user_id, r.content, r.created_at, u.nickname
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.character_id = ? ORDER BY r.created_at DESC`,
    [id]
  );

  let isLiked = false;
  let isReported = false;
  if (req.user) {
    const likeResult = await query("SELECT id FROM likes WHERE user_id = ? AND character_id = ?", [
      req.user.id,
      id,
    ]);
    isLiked = likeResult.rows.length > 0;

    const reportResult = await query("SELECT id FROM reports WHERE reporter_id = ? AND character_id = ?", [
      req.user.id,
      id,
    ]);
    isReported = reportResult.rows.length > 0;
  }

  res.json({
    success: true,
    data: {
      ...character,
      like_count: Number(character.like_count),
      isLiked,
      isReported,
      created_by_me: req.user ? req.user.id === character.created_by : false,
      reviews: reviewsResult.rows.map((r) => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        nickname: r.nickname,
        mine: req.user ? req.user.id === r.user_id : false,
      })),
    },
  });
}

export async function createCharacter(req, res) {
  const workId = Number(req.body.work_id);
  if (!Number.isInteger(workId) || workId <= 0 || req.body.name === undefined) {
    return res.status(400).json({ success: false, message: "작품과 캐릭터 이름은 필수입니다." });
  }

  const fieldError = validateCharacterFields(req.body);
  if (fieldError) {
    return res.status(400).json({ success: false, message: fieldError });
  }

  const workResult = await query("SELECT id FROM works WHERE id = ?", [workId]);
  if (workResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: "존재하지 않는 작품입니다." });
  }

  const result = await query(
    `INSERT INTO characters (work_id, created_by, name, description, image_url, quote)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      workId,
      req.user.id,
      asString(req.body.name),
      asString(req.body.description) || null,
      asString(req.body.image_url) || null,
      asString(req.body.quote) || null,
    ]
  );

  res.status(201).json({ success: true, data: { id: result.rows.insertId } });
}

export async function updateCharacter(req, res) {
  const { id } = req.params;

  const fieldError = validateCharacterFields(req.body);
  if (fieldError) {
    return res.status(400).json({ success: false, message: fieldError });
  }

  const result = await query("SELECT * FROM characters WHERE id = ?", [id]);
  const character = result.rows[0];
  if (!character) {
    return res.status(404).json({ success: false, message: "캐릭터를 찾을 수 없습니다." });
  }
  if (character.created_by !== req.user.id) {
    return res.status(403).json({ success: false, message: "본인이 등록한 캐릭터만 수정할 수 있습니다." });
  }

  // 보내지 않은 항목은 기존 값 유지, 빈 문자열로 보낸 항목은 비움(null)
  const pick = (incoming, current) => (incoming === undefined ? current : asString(incoming) || null);

  await query("UPDATE characters SET name = ?, description = ?, image_url = ?, quote = ? WHERE id = ?", [
    req.body.name === undefined ? character.name : asString(req.body.name),
    pick(req.body.description, character.description),
    pick(req.body.image_url, character.image_url),
    pick(req.body.quote, character.quote),
    id,
  ]);

  res.json({ success: true, message: "캐릭터가 수정되었습니다." });
}

export async function deleteCharacter(req, res) {
  const { id } = req.params;

  const result = await query("SELECT * FROM characters WHERE id = ?", [id]);
  const character = result.rows[0];
  if (!character) {
    return res.status(404).json({ success: false, message: "캐릭터를 찾을 수 없습니다." });
  }

  const isOwner = character.created_by === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: "본인 또는 관리자만 삭제할 수 있습니다." });
  }

  await query("DELETE FROM characters WHERE id = ?", [id]);
  res.json({ success: true, message: "캐릭터가 삭제되었습니다." });
}