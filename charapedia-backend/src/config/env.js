// 서버 시작 전에 환경변수가 안전한지 확인한다
export function checkEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const secret = process.env.JWT_SECRET || "";
  const weakSecret = secret.length < 32 || secret.includes("change_this");

  if (weakSecret) {
    if (isProd) {
      console.error("[보안] JWT_SECRET이 없거나 너무 약해요(32자 이상의 랜덤 문자열 필요). 서버를 시작하지 않아요.");
      process.exit(1);
    }
    console.warn("[경고] JWT_SECRET이 약해요. 배포 전에 32자 이상의 랜덤 문자열로 바꾸세요.");
  }

  if (isProd && process.env.MAIL_DRY_RUN === "1") {
    console.error("[보안] MAIL_DRY_RUN은 개발/테스트용이라 운영(production)에서는 쓸 수 없어요.");
    process.exit(1);
  }
}
