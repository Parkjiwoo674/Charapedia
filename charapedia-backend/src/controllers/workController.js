import { query } from "../config/db.js";
import { asString } from "../utils/validators.js";

export async function listWorks(req, res) {
  const result = await query("SELECT id, title, author FROM works ORDER BY title ASC");
  res.json({ success: true, data: result.rows });
}

export async function createWork(req, res) {
  const title = asString(req.body.title);
  const author = asString(req.body.author);

  if (!title) {
    return res.status(400).json({ success: false, message: "작품명을 입력해주세요." });
  }
  if (title.length > 200) {
    return res.status(400).json({ success: false, message: "작품명은 200자 이내로 입력해주세요." });
  }
  if (author.length > 100) {
    return res.status(400).json({ success: false, message: "작가명은 100자 이내로 입력해주세요." });
  }

  const existing = await query("SELECT id FROM works WHERE title = ?", [title]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ success: false, message: "이미 등록된 작품입니다." });
  }

  const result = await query("INSERT INTO works (title, author, created_by) VALUES (?, ?, ?)", [
    title,
    author || null,
    req.user.id,
  ]);
  res.status(201).json({ success: true, data: { id: result.rows.insertId, title, author: author || null } });
}
