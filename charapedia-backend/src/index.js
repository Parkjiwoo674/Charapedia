import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import worksRouter from "./routes/works.js";
import charactersRouter from "./routes/characters.js";
import rankingRouter from "./routes/ranking.js";
import adminRouter from "./routes/admin.js";
import userRouter from "./routes/user.js";
import { UPLOAD_ROOT } from "./middleware/upload.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { checkEnv } from "./config/env.js";
import { ensureSchema } from "./config/ensureSchema.js";

dotenv.config();
checkEnv();

const app = express();

// Render/Railway 같은 프록시 뒤에서는 TRUST_PROXY=1 이어야 사용자 IP를 제대로 구분한다
if (process.env.TRUST_PROXY) {
  const n = Number(process.env.TRUST_PROXY);
  app.set("trust proxy", Number.isNaN(n) ? process.env.TRUST_PROXY : n);
}

// 보안 헤더 (프론트와 주소가 달라도 /uploads 이미지를 불러올 수 있게 cross-origin 허용)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// 허용할 프론트 주소 목록 (쉼표로 여러 개 가능). 목록에 없는 사이트의 브라우저 요청은 거부된다
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));

// 업로드된 프로필 사진 제공 (브라우저가 파일 내용을 멋대로 해석하지 않도록 nosniff)
app.use(
  "/uploads",
  express.static(UPLOAD_ROOT, {
    index: false,
    dotfiles: "ignore",
    maxAge: "7d",
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

app.get("/api/health", (req, res) => res.json({ success: true, message: "OK" }));

app.use("/api", globalLimiter);
app.use("/api/auth", authRouter);
app.use("/api/works", worksRouter);
app.use("/api/characters", charactersRouter);
app.use("/api/ranking", rankingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "요청한 API가 존재하지 않습니다." });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "요청 형식이 올바르지 않습니다." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "요청 내용이 너무 커요." });
  }
  console.error(err);
  res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
});

try {
  await ensureSchema();
} catch (err) {
  console.error("DB 준비 중 오류:", err.message);
  process.exit(1);
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Charapedia API server running on http://localhost:${PORT}`);
});
