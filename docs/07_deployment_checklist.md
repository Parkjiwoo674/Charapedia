# 🚀 Charapedia 배포 전 체크리스트

## ❌ 반드시 확인할 것

### 1. .env 파일 Git 제외
```bash
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Remove .env from git"
```

**`.env.example` 예시**
```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=charapedia_db
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 2. 프론트엔드 API URL
- `charapedia-frontend/src/api/index.ts`에서 `http://localhost:4000` 하드코딩 여부 확인
- `import.meta.env.VITE_API_URL` 사용하도록 수정

### 3. DB 계정 보안
- root/기본 계정 대신 전용 DB 사용자 생성, 강력한 비밀번호 사용

---

## ⚠️ 중요 개선 사항

### 4. HTTPS
- Vercel/Render는 기본 HTTPS 자동 적용됨 — 별도 도메인 연결 시 SSL 확인

### 5. CORS 설정
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-domain.com']
    : ['http://localhost:5173'],
  credentials: true,
}));
```

### 6. Rate Limiting
```bash
npm install express-rate-limit
```
```javascript
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);
```

### 7. 신고/삭제 권한 재확인
- admin 권한 미들웨어가 모든 관리자 라우트에 적용되어 있는지 배포 전 재점검
- 캐릭터 삭제 시 CASCADE로 좋아요/리뷰/신고가 실제로 함께 삭제되는지 프로덕션 DB에서도 확인

---

### 배포 환경변수 (보안)
- `NODE_ENV=production` — 약한 `JWT_SECRET`이면 서버가 시작을 거부한다
- `JWT_SECRET` — 32자 이상 랜덤 문자열 (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `CLIENT_URL` — 배포된 프론트 주소 (여러 개면 쉼표로 구분, 예: `http://localhost:5173,https://내프론트.vercel.app`)
- `TRUST_PROXY=1` — Render/Railway처럼 프록시 뒤에서 돌 때. 없으면 모든 사용자가 같은 IP로 보여서 요청 제한이 한꺼번에 걸린다
- `MAIL_DRY_RUN`은 운영에서 비워둘 것 (켜져 있으면 서버가 시작을 거부한다)

### 프로필 사진(uploads 폴더) 주의
- 업로드된 사진은 백엔드 서버의 `uploads/avatars` 폴더에 저장된다.
- Render·Railway 같은 무료 호스팅은 재배포/재시작 때 디스크가 초기화될 수 있어, 배포 환경에서는 영구 디스크(볼륨)를 붙이거나 외부 저장소(Cloudinary 등)를 써야 사진이 유지된다.
- `uploads` 폴더는 `.gitignore`에 포함되어 있어 git에는 올라가지 않는다.

## 📋 배포 단계별 체크리스트

### Phase 1: 보안 강화
- [ ] `.env` 파일 Git에서 제거
- [ ] `.env.example` 생성
- [ ] 프로덕션용 JWT_SECRET 생성 (32자 이상)
- [ ] DB 비밀번호 변경, 전용 사용자 생성

### Phase 2: 환경 설정
- [ ] 프로덕션 DB 설정
- [ ] CORS origin 프로덕션 도메인으로 변경
- [ ] API URL 환경 변수로 변경

### Phase 3: 코드 개선
- [ ] Rate limiting 추가
- [ ] 에러 메시지에서 민감 정보 제거
- [ ] TypeScript 빌드 에러 확인

### Phase 4: 테스트
- [ ] 모든 API 엔드포인트 테스트 (05_test_plan.md 기준)
- [ ] 권한 체크 테스트 (일반 사용자/admin)
- [ ] 신고 → 삭제/반려 흐름 실제 테스트
- [ ] 모바일 반응형 테스트

### Phase 5: 배포
- [ ] 프론트엔드 빌드 (`npm run build`)
- [ ] 백엔드 배포 (Render/Railway)
- [ ] 프론트엔드 배포 (Vercel)
- [ ] 도메인 연결 및 HTTPS 확인
- [ ] 데이터베이스 백업 설정

---

## 🛠 권장 배포 방법

**Vercel (프론트엔드) + Render (백엔드)**
- 둘 다 무료 티어로 시작 가능, HTTPS 자동 적용
- 개인 과제 규모에 적합

---

## ✅ 최종 체크

```bash
# 백엔드
cd charapedia-backend
npm install
npm start

# 프론트엔드
cd charapedia-frontend
npm install
npm run build
npm run preview
```

**모든 체크리스트를 완료한 후 배포하세요!**
