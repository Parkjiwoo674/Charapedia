import rateLimit from "express-rate-limit";

// 같은 IP에서 짧은 시간에 너무 많이 요청하면 429로 막는다.
// (학교처럼 한 IP를 여럿이 쓰는 환경에서 정상 사용자가 막히지 않도록 한도는 넉넉하게 잡았다)
function limiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message }),
  });
}

const MIN = 60 * 1000;

// 전체 API
export const globalLimiter = limiter({
  windowMs: 15 * MIN,
  limit: 1000,
  message: "요청이 너무 많아요. 잠시 후 다시 시도해주세요.",
});

// 로그인 (비밀번호 무작위 대입 방지)
export const loginLimiter = limiter({
  windowMs: 15 * MIN,
  limit: 30,
  message: "로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해주세요.",
});

// 인증 메일 발송 (메일 폭탄/발송 한도 소진 방지) — 회원가입·비밀번호 찾기가 같이 쓴다
export const mailLimiter = limiter({
  windowMs: 10 * MIN,
  limit: 10,
  message: "인증번호 요청이 너무 많아요. 10분 뒤에 다시 시도해주세요.",
});

// 인증번호 확인 단계 (회원가입 / 비밀번호 재설정)
// 인증번호를 무작위로 찍어보는 공격은 '이메일당 5번' 제한(authController)이 막으므로, 여기는 느슨하게 둔다
export const codeLimiter = limiter({
  windowMs: 15 * MIN,
  limit: 60,
  message: "시도가 너무 많아요. 15분 뒤에 다시 시도해주세요.",
});
