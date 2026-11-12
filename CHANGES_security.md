# 보안 점검 변경 사항 (인증·입력 검증·요청 제한·서버 설정)

## 적용 방법
1. 이 zip은 **바뀐 파일만** 들어 있어요. 기존 `Charapedia` 폴더에 그대로 덮어쓰기 하세요.
2. **`charapedia-backend`에서 `npm install`** (helmet, express-rate-limit 추가됨)
3. `.env`는 직접 확인:
   - `JWT_SECRET`이 32자 이상인지
   - (선택) `NODE_ENV`, `TRUST_PROXY`, `CLIENT_URL` — `.env.example` 참고
4. 백엔드 재시작. **DB는 직접 고칠 필요 없어요.** `email_verifications`, `password_resets`에 `attempts` 컬럼이 없으면 서버가 켜질 때 자동으로 추가해요.

## 새로 생긴 파일 (백엔드)
- `src/utils/validators.js` — 입력 검사 도구
- `src/middleware/rateLimit.js` — 요청 횟수 제한
- `src/config/env.js` — 시작 시 환경변수 점검
- `src/config/ensureSchema.js` — 필요한 컬럼 자동 추가
- `docs/08_security.md` — 보안 점검 결과 정리 (보고서/시연 설명용)

## 수정된 파일
백엔드: `src/index.js`, `src/routes/auth.js`, `src/controllers/authController.js`, `characterController.js`, `workController.js`, `src/utils/mailer.js`, `src/middleware/upload.js`, `package.json`, `schema.sql`, `.env.example`
프론트: `src/pages/Auth.tsx`, `src/pages/CharacterForm.tsx` (입력 칸 길이 제한·안내 문구만)
문서: `docs/07_deployment_checklist.md`

## 달라지는 동작 (알아두세요)
- 인증번호는 이메일당 **5번까지만** 입력 가능. 초과하면 인증번호를 다시 받아야 해요.
- 아이디는 **영문·숫자·밑줄 4~20자**, 닉네임은 20자, 비밀번호는 8~64자. (이미 가입한 사람은 영향 없음)
- 이미지 주소는 http:// 또는 https:// 만 가능.
- 로그인 30번/15분, 인증메일 10번/10분을 넘기면 잠시 막혀요. 시연 중 연타하지만 않으면 걸릴 일 없어요.
- 개발할 때 메일을 안 보내고 인증번호를 서버 콘솔에 찍고 싶으면 `.env`에 `MAIL_DRY_RUN=1` (배포에서는 쓰면 안 돼요).
