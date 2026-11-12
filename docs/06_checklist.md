# 구현 체크리스트 — Charapedia

> 구현 진행 시 완료된 항목에 `[x]` 표시를 한다.

## Phase 1. 프로젝트 기반 및 인증
- [ ] Express 서버 설정 (CORS, JSON 파싱)
- [ ] PostgreSQL 커넥션 풀 설정
- [ ] JWT 인증 미들웨어 (`authenticate`, `optionalAuth`)
- [ ] 회원가입 API (이메일 중복 확인, bcrypt 해싱)
- [ ] 로그인 API
- [ ] 내 정보 조회 API (`/api/auth/me`)
- [ ] 프론트 `useAuth` 훅 (로그인/회원가입/로그아웃, 토큰 복원)
- [ ] 로그인/회원가입 페이지 UI

## Phase 2. 작품 및 캐릭터
- [ ] 작품 목록/등록 API
- [ ] 캐릭터 목록 API (작품 필터, 검색, 페이지네이션)
- [ ] 캐릭터 상세 API (isLiked, created_by_me, reviews 포함)
- [ ] 캐릭터 등록/수정/삭제 API (권한 체크)
- [ ] 캐릭터 목록 페이지 UI
- [ ] 캐릭터 상세 페이지 UI
- [ ] 캐릭터 등록/수정 폼 UI

## Phase 3. 좋아요
- [ ] 좋아요 토글 API (UNIQUE 제약으로 중복 방지)
- [ ] 좋아요 버튼 UI (즉시 반영)

## Phase 4. 리뷰
- [ ] 리뷰 작성/목록/삭제 API
- [ ] 리뷰 작성 폼 + 목록 UI

## Phase 5. 랭킹
- [ ] 랭킹 조회 API (좋아요 순 정렬, 작품 필터)
- [ ] 랭킹 페이지 UI

## Phase 6. 신고
- [ ] 신고 접수 API (중복 신고 방지)
- [ ] 신고 모달 UI (사유 선택 + 상세 입력)
- [ ] 관리자 신고 목록 API
- [ ] 신고 처리(삭제) API — CASCADE 삭제 확인
- [ ] 신고 처리(반려) API
- [ ] 관리자 대시보드 — 신고 목록 UI

## Phase 7. 마이페이지
- [x] 프로필 조회/닉네임 수정 API
- [x] 프로필 사진 업로드/삭제 API (multer, 2MB 제한, 형식·파일 시그니처 검사)
- [x] 내 좋아요/등록/리뷰 목록 API
- [x] 마이페이지 UI (프로필 + 탭 전환)
- [x] 회원탈퇴 시 업로드한 사진 파일 정리

## Phase 8. 관리자 — 사용자/통계
- [ ] 사용자 목록 API
- [ ] 플랫폼 통계 API
- [ ] requireAdmin 미들웨어
- [ ] 관리자 대시보드 — 사용자/통계 UI

## 매 Phase 공통
- [ ] TypeScript 타입 에러 0건
- [ ] API 에러 처리 (try-catch, 적절한 HTTP 상태 코드)
