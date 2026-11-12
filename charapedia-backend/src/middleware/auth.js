import jwt from "jsonwebtoken";

// 로그인 필수 라우트에 사용 — 토큰 없거나 잘못되면 401
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "토큰이 유효하지 않거나 만료되었습니다." });
  }
}

// 로그인 여부에 따라 다른 응답이 필요한 라우트(캐릭터 상세 등)에 사용 — 토큰 없어도 통과
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

// admin 전용 라우트에 authenticate 다음으로 붙여서 사용
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "관리자만 접근할 수 있습니다." });
  }
  next();
}