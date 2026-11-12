# 배포 가이드 (무료 조합: Vercel 화면 + Render 서버 + TiDB Cloud DB + Brevo 메일)

값은 `<...>` 자리에 본인 것을 넣으세요. 무료 조건은 바뀔 수 있으니 가입 화면에서 확인하세요.

## 0. 미리 준비 (이미 한 것)
- GitHub에 코드 업로드 완료 (브랜치: main)
- Brevo 가입 + 보내는 이메일 인증 + API 키 메모 완료

## 1. TiDB Cloud — DB (MySQL 호환, 무료, 카드 불필요)
1. tidbcloud.com 가입 (GitHub/구글 로그인 가능)
2. 클러스터 만들기: **Starter(Serverless) 무료 플랜**, 리전은 가까운 곳(서울/도쿄)
3. 만들어지면 **Connect** 버튼 → 접속 정보 확인
   - Host (예: `gateway01.....tidbcloud.com`), Port (보통 `4000`), User (예: `abc123.root`)
   - **Generate Password**를 눌러 비밀번호 생성 → **한 번만 보여주니 메모**
   - Database 이름은 기본값 `test` 를 그대로 쓰면 됨
4. 테이블 만들기: TiDB 콘솔의 **SQL Editor**에서 `charapedia-backend/schema_deploy.sql` 내용을 전부 붙여넣고 실행
   (DB는 `test` 선택. 접속이 안 되면 MySQL Workbench에서 SSL 켜고 접속해도 됨)
5. `SHOW TABLES;` 로 테이블 8개 확인: users, email_verifications, password_resets, works, characters, likes, reviews, reports
   (`avatar_files` 테이블은 서버가 켜질 때 자동으로 만들어짐)

## 2. Render — 서버 (무료, 카드 불필요)
1. render.com 가입 (GitHub 로그인)
2. New → **Web Service** → GitHub 저장소 `Charapedia` 선택
3. 설정
   - Branch: `main`
   - Root Directory: `charapedia-backend`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free**
4. Environment Variables
```
NODE_ENV=production
TRUST_PROXY=1
JWT_SECRET=<32자 이상 랜덤 문자열>
DB_HOST=<TiDB host>
DB_PORT=4000
DB_USER=<TiDB user>
DB_PASSWORD=<TiDB password>
DB_NAME=test
DB_SSL=true
BREVO_API_KEY=<Brevo API 키>
MAIL_FROM=<Brevo에서 인증한 이메일>
CLIENT_URL=http://localhost:5173
```
   - JWT_SECRET 만들기: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `MAIL_DRY_RUN`은 넣지 않기 (운영에서는 서버가 시작을 거부함)
5. Create Web Service → 배포가 끝나면 주소 확인 (예: `https://charapedia-api.onrender.com`)
6. 확인: `https://<서버주소>/api/health` → `{"success":true,"message":"OK"}`
   (처음 열 때 30~60초 걸릴 수 있음)

## 3. Vercel — 화면 (무료)
1. vercel.com 가입 (GitHub 로그인)
2. Add New → Project → `Charapedia` 저장소 선택
3. Root Directory: `charapedia-frontend` (Vite 자동 인식)
4. Environment Variables: `VITE_API_URL` = `https://<서버주소>/api` (끝에 `/api` 필수)
5. Deploy → 나온 주소 복사 (예: `https://charapedia.vercel.app`)

## 4. 마무리 (CORS)
- Render 서버 Environment의 `CLIENT_URL`을 Vercel 주소로 바꾸기 (끝에 `/` 없이)
  `CLIENT_URL=https://charapedia.vercel.app`
- 저장하면 자동 재배포됨

## 5. 관리자 계정
1. 배포된 사이트에서 가입 (인증 메일 도착 확인)
2. TiDB SQL Editor에서 실행:
   `UPDATE users SET role='admin' WHERE username='<내아이디>';`
3. 로그아웃 후 다시 로그인

## 6. 시연 전 꼭 할 것 (Render 무료의 특징)
- 15분 동안 접속이 없으면 서버가 잠들고, 다시 켜질 때 30~60초 걸림
- **시연 5~10분 전에** 아래 주소를 브라우저로 열어서 서버를 깨워두기:
  `https://<서버주소>/api/health`
- 시연 중 오래 말하느라 접속이 끊기면 다시 느려질 수 있으니, 중간에 한 번씩 화면을 눌러주기

## 7. 점검
- [ ] 가입 → 인증 메일 도착 (스팸함도 확인) → 로그인
- [ ] 캐릭터 등록 / 좋아요 / 한줄평 / 랭킹
- [ ] 프로필 사진 업로드 → 새로고침해도 유지 → (서버가 잠들었다 깨어난 뒤에도 유지)
- [ ] 다른 계정으로 신고 → 관리자 처리
- [ ] 페이지 새로고침(F5) 시 404가 안 나는지

## 막혔을 때
| 증상 | 확인 |
|---|---|
| Render 로그에 DB 연결 오류 | DB_HOST/PORT/USER/PASSWORD, `DB_SSL=true` 여부, TiDB 접속 정보 |
| 사이트에서 CORS 오류 | `CLIENT_URL`이 Vercel 주소와 정확히 같은지(끝 `/` 없이), 재배포됐는지 |
| 인증번호 메일이 안 옴 | Render 로그의 "Brevo 메일 발송 실패" 확인. 401=API 키, 400=MAIL_FROM 인증 여부. 스팸함 확인 |
| 서버가 바로 꺼짐 | JWT_SECRET 32자 미만, MAIL_DRY_RUN=1 이 원인일 수 있음. Render 로그 확인 |
| 첫 접속이 한참 걸림 | 정상 (무료 서버가 자다가 깨는 중). `/api/health`로 미리 깨우기 |
| 로그인이 갑자기 막힘 | `TRUST_PROXY=1` 빠졌는지 |
