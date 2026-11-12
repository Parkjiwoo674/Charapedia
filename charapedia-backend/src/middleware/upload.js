import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

// 업로드 파일이 저장되는 위치: charapedia-backend/uploads/avatars
export const UPLOAD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
export const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

class UploadError extends Error {}

const upload = multer({
  storage: multer.diskStorage({
    // 폴더가 중간에 사라졌어도(재배포·실수로 삭제 등) 업로드 때마다 다시 만들어 둔다
    destination: (req, file, cb) => {
      fs.mkdirSync(AVATAR_DIR, { recursive: true });
      cb(null, AVATAR_DIR);
    },
    // 원본 파일명은 쓰지 않고 랜덤 이름으로 저장 (경로 조작/덮어쓰기 방지)
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(new UploadError("JPG, PNG, WEBP, GIF 이미지만 올릴 수 있어요."));
    }
    cb(null, true);
  },
});

// 확장자/Content-Type은 속일 수 있으므로 파일 맨 앞 바이트(시그니처)로 한 번 더 확인
function hasValidSignature(filePath) {
  const fd = fs.openSync(filePath, "r");
  const buf = Buffer.alloc(12);
  try {
    fs.readSync(fd, buf, 0, 12, 0);
  } finally {
    fs.closeSync(fd);
  }
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isGif = buf.subarray(0, 4).toString("ascii") === "GIF8";
  const isWebp = buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  return isJpeg || isPng || isGif || isWebp;
}

// 라우트에서 쓰는 미들웨어: 업로드 오류를 500이 아니라 400 + 한글 메시지로 돌려준다
export function uploadAvatar(req, res, next) {
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "이미지는 2MB 이하만 올릴 수 있어요." });
      }
      if (err instanceof UploadError) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: "업로드 요청이 올바르지 않아요." });
      }
      return next(err);
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "업로드할 이미지를 선택해주세요." });
    }

    if (!hasValidSignature(req.file.path)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: "올바른 이미지 파일이 아니에요." });
    }

    next();
  });
}

// DB에 저장된 avatar_url("/uploads/avatars/xxx.png")에 해당하는 실제 파일 삭제
// basename만 사용하므로 "../" 같은 경로 조작 값이 들어 있어도 avatars 폴더 밖은 건드리지 않는다
export function removeAvatarFile(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) return;
  const filePath = path.join(AVATAR_DIR, path.basename(avatarUrl));
  fs.unlink(filePath, () => {});
}
