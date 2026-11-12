# API 명세서 — Charapedia

> Base URL: `http://localhost:4000/api`
> 인증이 필요한 API는 요청 헤더에 `Authorization: Bearer <token>` 포함

---

## 1. 인증 (`/auth`)

### POST /auth/signup — 회원가입
**Request Body**
```json
{ "nickname": "소설덕후", "email": "user@example.com", "password": "password123" }
```
**Response 201**
```json
{ "success": true, "token": "eyJhbGci...", "user": { "id": 2, "nickname": "소설덕후", "email": "user@example.com", "role": "user" } }
```

### POST /auth/login — 로그인
**Request Body**
```json
{ "email": "user@example.com", "password": "password123" }
```
**Response 200**: 위와 동일한 형태

### GET /auth/me — 내 정보 조회 🔒

---

## 2. 작품 (`/works`)

### GET /works — 작품 목록
### POST /works — 새 작품 등록 🔒
**Request Body**
```json
{ "title": "회귀자의 회사생활", "author": "김작가" }
```

---

## 3. 캐릭터 (`/characters`)

### GET /characters — 캐릭터 목록

| 파라미터 | 설명 |
|---------|------|
| work_id | 작품별 필터 |
| search | 이름 부분 일치 |
| page, limit | 페이지네이션 |

**Response 200**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "김이현", "work_title": "회귀자의 회사생활", "image_url": "...", "like_count": 12 }
  ],
  "pagination": { "total": 4, "page": 1, "limit": 12 }
}
```

### GET /characters/:id — 캐릭터 상세
```json
{
  "success": true,
  "data": {
    "id": 1, "name": "김이현", "work_title": "회귀자의 회사생활",
    "description": "...", "quote": "...", "like_count": 12,
    "isLiked": false, "created_by_me": false,
    "reviews": [{ "id": 1, "nickname": "회귀물러버", "content": "회귀 클리셰인데도 안 질려요", "created_at": "2026-05-01" }]
  }
}
```

### POST /characters — 캐릭터 등록 🔒
**Request Body**
```json
{ "work_id": 1, "name": "김이현", "description": "...", "image_url": "...", "quote": "..." }
```

### PUT /characters/:id — 캐릭터 수정 🔒 (본인만)
### DELETE /characters/:id — 캐릭터 삭제 🔒 (본인 또는 admin)

---

## 4. 좋아요 (`/characters/:id/like`) 🔒

### POST /characters/:id/like — 좋아요 토글
**Response 200**
```json
{ "success": true, "data": { "liked": true, "like_count": 13 } }
```

---

## 5. 리뷰 (`/characters/:id/reviews`)

### GET /characters/:id/reviews — 리뷰 목록
### POST /characters/:id/reviews — 리뷰 작성 🔒
**Request Body**
```json
{ "content": "루카 서사가 미쳤다" }
```
### DELETE /characters/:id/reviews/:reviewId — 리뷰 삭제 🔒 (본인만)

---

## 6. 랭킹 (`/ranking`)

### GET /ranking — 인기 캐릭터 랭킹
**Query**: `work_id` (선택)
**Response 200**
```json
{ "success": true, "data": [{ "id": 3, "name": "루카", "work_title": "던전을 나가는 방법", "like_count": 30 }] }
```

---

## 7. 신고 (`/characters/:id/report`) 🔒

### POST /characters/:id/report — 캐릭터 신고
**Request Body**
```json
{ "reason": "abuse", "detail": "혐오 표현이 포함되어 있어요" }
```
**Response 201**
```json
{ "success": true, "message": "신고가 접수되었습니다." }
```
**Response 409** (이미 신고한 경우)
```json
{ "success": false, "message": "이미 신고한 캐릭터입니다." }
```

---

## 8. 마이페이지 (`/user`) 🔒

### GET /user/profile — 내 프로필 조회
### PUT /user/profile — 닉네임 수정
```json
{ "nickname": "새닉네임" }
```
### POST /user/avatar — 프로필 사진 업로드
`multipart/form-data`, 필드명 `avatar` (JPG/PNG/WEBP/GIF, 최대 2MB)
```json
{ "success": true, "data": { "avatar_url": "/uploads/avatars/3f2a....png" } }
```
허용되지 않는 형식·용량 초과·이미지가 아닌 파일은 400. 이전 사진 파일은 자동 삭제된다.
### DELETE /user/avatar — 프로필 사진 삭제
### GET /user/likes — 내가 좋아요한 캐릭터 목록
### GET /user/characters — 내가 등록한 캐릭터 목록
### GET /user/reviews — 내가 쓴 리뷰 목록

---

## 9. 관리자 (`/admin`) 🔒 (admin 권한 필요)

### GET /admin/reports — 신고 목록
**Query**: `status` (pending / resolved / dismissed, 기본값 pending)
**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "character_id": 5, "character_name": "문제캐릭터", "work_title": "...",
      "report_count": 3,
      "reasons": ["abuse", "spam"],
      "latest_reported_at": "2026-05-10"
    }
  ]
}
```

### DELETE /admin/characters/:id — 신고 처리: 캐릭터 삭제
**Response 200**
```json
{ "success": true, "message": "캐릭터가 삭제되고 관련 신고가 처리되었습니다." }
```

### POST /admin/reports/dismiss — 신고 처리: 반려
**Request Body**
```json
{ "character_id": 5 }
```
**Response 200**
```json
{ "success": true, "message": "신고가 반려되었습니다." }
```

### GET /admin/users — 사용자 목록
### GET /admin/stats — 플랫폼 통계
```json
{ "success": true, "data": { "totalUsers": 50, "totalCharacters": 120, "totalReports": 8, "pendingReports": 3 } }
```

---

## 10. 공통 에러 응답

| 상태 코드 | 설명 |
|---------|------|
| 400 | 잘못된 요청 (필수 필드 누락, 유효성 실패) |
| 401 | 인증 토큰 없음 또는 만료 |
| 403 | 권한 없음 (타인 리소스 접근, admin 아님) |
| 404 | 리소스 없음 |
| 409 | 중복 (중복 좋아요, 중복 신고 등) |
| 500 | 서버 내부 오류 |

```json
{ "success": false, "message": "에러 메시지" }
```
