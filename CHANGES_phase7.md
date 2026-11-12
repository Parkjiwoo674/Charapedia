# Phase 7 변경 사항 (마이페이지 · 프로필 사진 업로드)

## 적용 방법
1. 이 zip을 기존 `Charapedia` 폴더에 덮어쓰기 (`.env`, `node_modules`, `uploads`는 들어있지 않아 그대로 유지됨)
2. **백엔드에서 `npm install` 한 번 실행** (파일 업로드용 `multer` 패키지가 새로 추가됨)
3. 백엔드 재시작 (`npm run dev`). 시작할 때 `charapedia-backend/uploads/avatars` 폴더가 자동으로 만들어짐
4. DB 변경 없음 (`users.avatar_url` 컬럼은 이미 있었음)

## 새로 생긴 파일
백엔드
- `src/middleware/upload.js` — 업로드 처리 (2MB 제한, JPG/PNG/WEBP/GIF만, 파일 내용 시그니처 확인, 랜덤 파일명)
- `src/controllers/userController.js` — 닉네임 수정, 사진 업로드/삭제, 내 좋아요/등록/리뷰 목록
- `src/routes/user.js`

프론트
- `src/pages/MyPage.tsx`
- `src/components/Avatar.tsx` — 사진이 없으면 닉네임 첫 글자를 원 안에 표시

## 수정된 파일
- `src/index.js` — `/api/user` 라우터, `/uploads` 정적 제공
- `src/controllers/authController.js` — 로그인/내정보 응답에 avatar_url 포함, 회원탈퇴 시 사진 파일 삭제
- `package.json` — multer 추가, `.gitignore` — uploads 제외
- `src/api/index.ts`, `src/types/index.ts`, `src/hooks/useAuth.ts` — 새 API/타입/`updateUser`
- `src/App.tsx` — 헤더에 프로필 사진+닉네임(클릭 시 마이페이지), 메뉴/라우트 추가
- `src/index.css` — 맨 아래에 스타일 추가
- `docs/04_api_spec.md`, `06_checklist.md`, `07_deployment_checklist.md`

## API
| 기능 | 엔드포인트 |
|---|---|
| 내 정보 | GET /api/user/profile |
| 닉네임 수정 | PUT /api/user/profile |
| 사진 업로드 | POST /api/user/avatar (multipart, 필드명 avatar) |
| 사진 삭제 | DELETE /api/user/avatar |
| 좋아요한 캐릭터 / 내가 등록한 캐릭터 / 내가 쓴 리뷰 | GET /api/user/likes · /characters · /reviews |
