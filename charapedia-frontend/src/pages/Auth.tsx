import { useState, FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api";

interface AuthProps {
  auth: ReturnType<typeof useAuth>;
}

type Mode = "login" | "signup" | "forgot";

export function Auth({ auth }: AuthProps) {
  const [mode, setMode] = useState<Mode>("login");

  // 로그인
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 회원가입
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeSending, setCodeSending] = useState(false);

  // 비밀번호 찾기
  const [fpUsername, setFpUsername] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpNewPasswordConfirm, setFpNewPasswordConfirm] = useState("");
  const [fpCodeSent, setFpCodeSent] = useState(false);
  const [fpSending, setFpSending] = useState(false);
  const [fpDone, setFpDone] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetMessages() {
    setError(null);
    setNotice(null);
  }

  async function handleSendCode() {
    resetMessages();
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setCodeSending(true);
    try {
      await auth.sendCode(email);
      setCodeSent(true);
      setNotice("인증번호를 발송했습니다. 메일함을 확인해주세요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setCodeSending(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);
    try {
      await auth.login(loginUsername, loginPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    resetMessages();

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!codeSent) {
      setError("이메일 인증번호를 먼저 받아주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await auth.signup(username, nickname, password, email, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendResetCode() {
    resetMessages();
    if (!fpUsername || !fpEmail) {
      setError("아이디와 이메일을 입력해주세요.");
      return;
    }
    setFpSending(true);
    try {
      await authApi.forgotPassword(fpUsername, fpEmail);
      setFpCodeSent(true);
      setNotice("인증번호를 발송했습니다. 메일함을 확인해주세요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setFpSending(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    resetMessages();

    if (fpNewPassword !== fpNewPasswordConfirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.resetPassword(fpEmail, fpCode, fpNewPassword);
      setNotice(res.message);
      setFpDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 재설정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetMessages();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Charapedia</h1>
        <p className="tagline">웹소설 캐릭터 도감 · 팬 커뮤니티</p>

        {mode !== "forgot" && (
          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")} type="button">
              로그인
            </button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")} type="button">
              회원가입
            </button>
          </div>
        )}

        {mode === "login" && (
          <>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="아이디"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" disabled={submitting}>
                {submitting ? "처리 중..." : "로그인"}
              </button>
            </form>
            <button type="button" className="link-btn" onClick={() => switchMode("forgot")}>
              비밀번호를 잊으셨나요?
            </button>
          </>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="아이디 (영문·숫자·_ 4~20자)"
              value={username}
              maxLength={20}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="닉네임 (20자 이내)"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="비밀번호 (8자 이상, 영문+숫자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
            <div className="email-row">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                maxLength={100}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="button" onClick={handleSendCode} disabled={codeSending}>
                {codeSending ? "발송 중..." : "인증번호 받기"}
              </button>
            </div>
            <input type="text" placeholder="인증번호 입력" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />

            {error && <p className="auth-error">{error}</p>}
            {notice && <p className="auth-notice">{notice}</p>}

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "처리 중..." : "가입하기"}
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <>
            {!fpDone ? (
              <form onSubmit={handleResetPassword}>
                <input
                  type="text"
                  placeholder="아이디"
                  value={fpUsername}
                  onChange={(e) => setFpUsername(e.target.value)}
                  required
                />
                <div className="email-row">
                  <input
                    type="email"
                    placeholder="가입한 이메일"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    required
                  />
                  <button type="button" onClick={handleSendResetCode} disabled={fpSending}>
                    {fpSending ? "발송 중..." : "인증번호 받기"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="인증번호 입력"
                  value={fpCode}
                  onChange={(e) => setFpCode(e.target.value)}
                  maxLength={6}
                  required
                />
                <input
                  type="password"
                  placeholder="새 비밀번호 (8자 이상, 영문+숫자)"
                  value={fpNewPassword}
                  onChange={(e) => setFpNewPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={fpNewPasswordConfirm}
                  onChange={(e) => setFpNewPasswordConfirm(e.target.value)}
                  required
                />

                {error && <p className="auth-error">{error}</p>}
                {notice && <p className="auth-notice">{notice}</p>}

                <button type="submit" className="submit-btn" disabled={submitting || !fpCodeSent}>
                  {submitting ? "처리 중..." : "비밀번호 재설정"}
                </button>
              </form>
            ) : (
              <p className="auth-notice">비밀번호가 변경되었습니다. 로그인 화면으로 돌아가 새 비밀번호로 로그인해주세요.</p>
            )}
            <button type="button" className="link-btn" onClick={() => switchMode("login")}>
              로그인으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}