# Phase 3~6 변경 사항 (좋아요 · 랭킹 · 리뷰 · 신고 · 관리자)

## 적용 방법
1. 이 zip을 기존 `Charapedia` 폴더에 덮어쓰기 (`.env`, `node_modules`는 들어있지 않으니 그대로 유지됨)
2. MySQL Workbench에서 `charapedia-backend/migration_phase3-6.sql` 실행 (이미 테이블이 있으면 아무것도 안 바뀜)
3. 가입해둔 계정 중 하나를 관리자로 올리기 (SQL 파일 맨 아래 UPDATE 문) → 로그아웃 후 재로그인
4. 백엔드 재시작 (`npm run dev`), 프론트는 그대로 `npm run dev`

## 새로 생긴 파일
백엔드
- `src/controllers/likeController.js` — 좋아요 토글
- `src/controllers/rankingController.js` — 좋아요 순 랭킹
- `src/controllers/reviewController.js` — 리뷰 목록/작성/삭제(본인만)
- `src/controllers/reportController.js` — 신고 접수(중복 신고 방지)
- `src/controllers/adminController.js` — 신고 목록/삭제/반려, 사용자 목록, 통계
- `src/routes/ranking.js`, `src/routes/admin.js`
- `migration_phase3-6.sql`

프론트
- `src/pages/Ranking.tsx`, `src/pages/AdminDashboard.tsx`
- `src/constants.ts` (신고 사유 한글 라벨)

## 수정된 파일
- `src/index.js` — ranking/admin 라우터 등록
- `src/routes/characters.js` — like / reviews / report 라우트 추가
- `src/controllers/characterController.js` — 상세 응답에 isReported, 리뷰별 mine 추가
- `src/api/index.ts`, `src/types/index.ts` — 새 API 함수와 타입
- `src/pages/CharacterDetail.tsx` — 좋아요 버튼, 리뷰 작성/삭제, 신고 모달
- `src/App.tsx` — 헤더 메뉴(도감/랭킹/관리자), 라우트 추가
- `src/index.css` — 맨 아래에 새 스타일 추가 (기존 스타일은 그대로)

## API (docs/04_api_spec.md 기준)
| 기능 | 엔드포인트 |
|---|---|
| 좋아요 토글 | POST /api/characters/:id/like |
| 랭킹 | GET /api/ranking?work_id= |
| 리뷰 | GET·POST /api/characters/:id/reviews, DELETE /api/characters/:id/reviews/:reviewId |
| 신고 | POST /api/characters/:id/report |
| 관리자 | GET /api/admin/reports?status=, DELETE /api/admin/characters/:id, POST /api/admin/reports/dismiss, GET /api/admin/users, GET /api/admin/stats |
