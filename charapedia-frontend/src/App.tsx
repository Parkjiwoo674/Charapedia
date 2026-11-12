import { useState, FormEvent } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { Auth } from "./pages/Auth";
import { CharacterList } from "./pages/CharacterList";
import { CharacterForm } from "./pages/CharacterForm";
import { CharacterDetail } from "./pages/CharacterDetail";
import { Ranking } from "./pages/Ranking";
import { AdminDashboard } from "./pages/AdminDashboard";
import { MyPage } from "./pages/MyPage";
import { Avatar } from "./components/Avatar";

export default function App() {
  const { theme, setTheme, setCustomTheme } = useTheme();
  const auth = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleting(true);
    try {
      await auth.deleteAccount(deletePassword);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "탈퇴에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  if (auth.loading) {
    return (
      <>
        <ThemeSwitcher theme={theme} setTheme={setTheme} setCustomTheme={setCustomTheme} variant="floating" />
        <div className="loading-screen">불러오는 중...</div>
      </>
    );
  }

  if (!auth.user) {
    return (
      <>
        <ThemeSwitcher theme={theme} setTheme={setTheme} setCustomTheme={setCustomTheme} variant="floating" />
        <Auth auth={auth} />
      </>
    );
  }

  return (
    <BrowserRouter>
      <div className="home-page">
        <header>
          <div className="header-left">
            <Link to="/" className="logo-link">
              <h1 className="brand">Charapedia</h1>
            </Link>
            <nav className="header-nav">
              <Link to="/">도감</Link>
              <Link to="/ranking">랭킹</Link>
              <Link to="/mypage">마이페이지</Link>
              {auth.user.role === "admin" && <Link to="/admin">관리자</Link>}
            </nav>
          </div>
          <div>
            <Link to="/mypage" className="header-user">
              <Avatar src={auth.user.avatar_url} name={auth.user.nickname} size={28} />
              <span>
                {auth.user.nickname}님 환영합니다{auth.user.role === "admin" ? " (관리자)" : ""}
              </span>
            </Link>
            <ThemeSwitcher theme={theme} setTheme={setTheme} setCustomTheme={setCustomTheme} variant="inline" />
            <button onClick={auth.logout}>로그아웃</button>
            <button onClick={() => setShowDelete((v) => !v)}>회원탈퇴</button>
          </div>
        </header>

        {showDelete && (
          <div className="delete-panel">
            <form onSubmit={handleDelete}>
              <p>정말 탈퇴하시겠어요? 현재 비밀번호를 입력해주세요.</p>
              <input
                type="password"
                placeholder="현재 비밀번호"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
              {deleteError && <p className="auth-error">{deleteError}</p>}
              <button type="submit" disabled={deleting}>
                {deleting ? "처리 중..." : "탈퇴 확정"}
              </button>
            </form>
          </div>
        )}

        <Routes>
          <Route path="/" element={<CharacterList />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/mypage" element={<MyPage auth={auth} />} />
          <Route path="/admin" element={<AdminDashboard auth={auth} />} />
          <Route path="/characters/new" element={<CharacterForm />} />
          <Route path="/characters/:id" element={<CharacterDetail auth={auth} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}