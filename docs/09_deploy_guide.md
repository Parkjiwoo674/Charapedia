# 배포 가이드 (Vercel 프론트 + Railway 백엔드/MySQL + Brevo 메일)

순서대로 하면 됩니다. 값은 `<...>` 자리에 본인 것을 넣으세요.

## 0. 미리 준비
- GitHub 계정, Railway 계정, Vercel 계정, Brevo 계정 (모두 GitHub/구글로 가입 가능)
- Charapedia 폴더를 GitHub 저장소에 올리기
  - `.env`, `node_modules`, `uploads`가 올라가지 않는지 확인 (백엔드/프론트 `.gitignore`에 들어 있음)
  - 올린 뒤 GitHub 웹에서 `.env` 파일이 **없는지** 직접 확인

## 1. Brevo 설정 (인증 메일용) — 약 5분
1. brevo.com 가입 (무료, 하루 300통)
2. Settings → Senders → 보내는 사람으로 쓸 이메일(본인 Gmail 가능) 추가 → 메일로 온 인증 링크 클릭
3. Settings → API Keys → Generate → 키 복사 (`xkeysib-...`) — **한 번만 보여주니 메모**
4. 가입 직후 계정 승인/활성화 안내가 뜨면 그 절차를 먼저 끝내기

## 2. Railway — MySQL
1. New Project → Provision MySQL (서비스 이름은 기본값 `MySQL` 그대로 두기)
2. MySQL 서비스 → Variables에서 `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` 확인
3. 테이블 만들기: MySQL 서비스 → Connect의 **Public Network** 접속 정보(host, port)로
   MySQL Workbench에서 접속 → `charapedia-backend/schema_deploy.sql` 전체 실행
   (`schema.sql`이 아니라 **schema_deploy.sql**. DB 이름이 charapedia_db가 아니라 railway라서 다름)
4. `SHOW TABLES;` 로 테이블 8개 확인: users, email_verifications, password_resets, works, characters, likes, reviews, reports

## 3. Railway — 백엔드
1. 같은 프로젝트에서 New → GitHub Repo → 저장소 선택
2. Settings → Root Directory: `charapedia-backend`
3. Variables에 아래 입력 (DB 값은 참조 변수로)
```
NODE_ENV=production
TRUST_PROXY=1
JWT_SECRET=<32자 이상 랜덤 문자열>
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
BREVO_API_KEY=<1단계에서 복사한 키>
MAIL_FROM=<1단계에서 인증한 이메일>
CLIENT_URL=http://localhost:5173
```
   - JWT_SECRET 만들기: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `MAIL_DRY_RUN`은 넣지 않기 (운영에서는 서버가 시작을 거부함)
   - `GMAIL_*` 값은 넣지 않아도 됨
4. Volume 추가 (프로필 사진 보존): 서비스 우클릭/Settings → Volume → Mount Path: `/app/uploads`
5. Settings → Networking → Generate Domain → 나온 주소 복사 (예: `https://xxxx.up.railway.app`)
6. 확인: 브라우저에서 `https://xxxx.up.railway.app/api/health` → `{"success":true,"message":"OK"}`

## 4. Vercel — 프론트
1. Add New → Project → 같은 GitHub 저장소 선택
2. Root Directory: `charapedia-frontend` (Framework: Vite 자동 인식)
3. Environment Variables: `VITE_API_URL` = `https://xxxx.up.railway.app/api`  (끝에 `/api` 필수)
4. Deploy → 나온 주소 복사 (예: `https://charapedia.vercel.app`)

## 5. 마무리 (CORS)
- Railway 백엔드 Variables의 `CLIENT_URL`을 Vercel 주소로 바꾸기 (여러 개면 쉼표로)
  `CLIENT_URL=https://charapedia.vercel.app`
- 백엔드 재배포 (변수 저장하면 자동)

## 6. 관리자 계정
1. 배포된 사이트에서 가입 (인증 메일 오는지 확인)
2. Workbench로 Railway DB에 접속해서 실행:
   `UPDATE users SET role='admin' WHERE username='<내아이디>';`
3. 로그아웃 후 다시 로그인

## 7. 점검 (시연 전)
- [ ] 가입 → 인증 메일 도착 → 로그인
- [ ] 캐릭터 등록 / 좋아요 / 한줄평 / 랭킹
- [ ] 프로필 사진 업로드 → 새로고침해도 유지
- [ ] 다른 계정으로 신고 → 관리자 처리
- [ ] 페이지 새로고침(F5) 했을 때 404가 안 나는지 (vercel.json)

## 막혔을 때
| 증상 | 확인 |
|---|---|
| 사이트에서 API 오류 / CORS 오류 | Railway `CLIENT_URL`이 Vercel 주소와 정확히 같은지(끝에 `/` 없이), 재배포했는지 |
| 인증번호 메일이 안 옴 | Railway 로그에서 "Brevo 메일 발송 실패" 메시지 확인. 401이면 API 키, 400이면 `MAIL_FROM` 인증 여부 |
| 서버가 바로 꺼짐 | Railway 로그 확인. JWT_SECRET 32자 미만, MAIL_DRY_RUN=1 이 원인일 수 있음 |
| 로그인이 갑자기 막힘 | `TRUST_PROXY=1` 빠졌는지 (없으면 모든 사용자가 같은 IP로 보여 요청 제한이 한꺼번에 걸림) |
| 사진이 재배포 후 사라짐 | Volume 마운트 경로가 `/app/uploads`인지 |
