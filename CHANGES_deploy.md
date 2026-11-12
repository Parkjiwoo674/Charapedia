# 배포 준비 변경 사항

## 바뀐 파일
- `charapedia-backend/src/utils/mailer.js` — BREVO_API_KEY가 있으면 Brevo HTTPS API로, 없으면 기존처럼 Gmail SMTP로 발송 (Railway는 SMTP 차단)
- `charapedia-backend/.env.example` — BREVO_API_KEY, MAIL_FROM 안내 추가
- `charapedia-backend/package.json` — Node 18 이상 명시 (fetch 사용)

## 새 파일
- `charapedia-backend/schema_deploy.sql` — CREATE DATABASE/USE를 뺀 배포용 스키마
- `charapedia-frontend/vercel.json` — 새로고침 시 404 방지
- `charapedia-frontend/.gitignore`
- `docs/09_deploy_guide.md` — 단계별 배포 가이드

## 로컬 개발은 그대로
BREVO_API_KEY를 .env에 넣지 않으면 지금처럼 Gmail(또는 MAIL_DRY_RUN=1)로 동작합니다.
