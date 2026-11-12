# 배포 준비 변경 사항 (무료 조합: Vercel + Render + TiDB Cloud + Brevo)

## 바뀐 파일 (백엔드)
- `src/utils/mailer.js` — BREVO_API_KEY가 있으면 Brevo HTTPS API로, 없으면 기존처럼 Gmail SMTP로 발송
- `src/config/db.js` — DB_SSL=true 일 때 TLS 접속 (TiDB Cloud는 TLS 필수). 로컬은 그대로
- `src/config/ensureSchema.js` — `avatar_files` 테이블 자동 생성
- `src/controllers/userController.js` — 프로필 사진을 디스크 + DB에 함께 저장/삭제
- `src/index.js` — 디스크에 사진이 없으면(서버 재시작 후) DB에서 꺼내 보여주는 경로 추가
- `.env.example`, `package.json`(Node 18+)

## 새 파일
- `charapedia-backend/schema_deploy.sql` — CREATE DATABASE/USE를 뺀 배포용 스키마
- `charapedia-frontend/vercel.json` — 새로고침 404 방지
- `charapedia-frontend/.gitignore`
- `docs/09_deploy_guide.md` — 단계별 가이드

## 로컬 개발은 그대로
DB_SSL, BREVO_API_KEY를 .env에 넣지 않으면 지금처럼 로컬 MySQL + Gmail(또는 MAIL_DRY_RUN=1)로 동작합니다.
