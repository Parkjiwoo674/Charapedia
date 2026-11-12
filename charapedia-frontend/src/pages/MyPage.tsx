import { useEffect, useRef, useState, FormEvent, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { userApi } from "../api";
import { Avatar } from "../components/Avatar";
import type { CharacterSummary, MyReview } from "../types";
import type { useAuth } from "../hooks/useAuth";

interface Props {
  auth: ReturnType<typeof useAuth>;
}

type Tab = "likes" | "characters" | "reviews";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 서버 제한(5MB)과 동일
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function CharacterCards({ items }: { items: CharacterSummary[] }) {
  return (
    <div className="card-grid">
      {items.map((c) => (
        <Link to={`/characters/${c.id}`} key={c.id} className="character-card">
          <div className="character-thumb">
            {c.image_url ? <img src={c.image_url} alt={c.name} /> : <span>이미지 없음</span>}
            <span className="like-ribbon">♥ {c.like_count}</span>
          </div>
          <div className="character-info">
            <span className="work-tag">{c.work_title}</span>
            <strong>{c.name}</strong>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function MyPage({ auth }: Props) {
  const user = auth.user;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 프로필
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [profileMsg, setProfileMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [savingNickname, setSavingNickname] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 탭
  const [tab, setTab] = useState<Tab>("likes");
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setListError(null);

    const request =
      tab === "reviews"
        ? userApi.reviews().then((res) => setReviews(res.data))
        : (tab === "likes" ? userApi.likes() : userApi.characters()).then((res) => setCharacters(res.data));

    request
      .catch((err) => setListError(err instanceof Error ? err.message : "불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [tab]);

  if (!user) return null;

  async function handleNicknameSave(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSavingNickname(true);
    try {
      const res = await userApi.updateProfile(nickname);
      auth.updateUser({ nickname: res.data.nickname });
      setNickname(res.data.nickname);
      setProfileMsg({ type: "ok", text: "닉네임을 변경했어요." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "닉네임 변경에 실패했습니다." });
    } finally {
      setSavingNickname(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 동작하도록 초기화
    if (!file) return;

    setProfileMsg(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setProfileMsg({ type: "error", text: "JPG, PNG, WEBP, GIF 이미지만 올릴 수 있어요." });
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setProfileMsg({ type: "error", text: "이미지는 2MB 이하만 올릴 수 있어요." });
      return;
    }

    setUploading(true);
    try {
      const res = await userApi.uploadAvatar(file);
      auth.updateUser({ avatar_url: res.data.avatar_url });
      setProfileMsg({ type: "ok", text: "프로필 사진을 변경했어요." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "사진 업로드에 실패했습니다." });
    } finally {
      setUploading(false);
    }
  }

  async function handleAvatarRemove() {
    if (!confirm("프로필 사진을 삭제할까요?")) return;
    setProfileMsg(null);
    try {
      await userApi.removeAvatar();
      auth.updateUser({ avatar_url: null });
      setProfileMsg({ type: "ok", text: "프로필 사진을 삭제했어요." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "사진 삭제에 실패했습니다." });
    }
  }

  const nicknameChanged = nickname.trim() !== user.nickname;

  return (
    <div className="page">
      <div className="page-header">
        <h2>마이페이지</h2>
      </div>

      <section className="profile-card">
        <div className="profile-avatar-col">
          <Avatar src={user.avatar_url} name={user.nickname} size={96} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFileChange}
          />
          <span className="profile-avatar-actions">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "업로드 중..." : "사진 변경"}
            </button>
            {user.avatar_url && (
              <button type="button" className="danger-btn" onClick={handleAvatarRemove} disabled={uploading}>
                삭제
              </button>
            )}
          </span>
        </div>

        <form className="profile-info" onSubmit={handleNicknameSave}>
          <span className="muted">아이디 · {user.username}</span>
          <label htmlFor="nickname">닉네임</label>
          <span className="profile-nickname-row">
            <input
              id="nickname"
              type="text"
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
            <button type="submit" disabled={savingNickname || !nicknameChanged || !nickname.trim()}>
              {savingNickname ? "저장 중..." : "저장"}
            </button>
          </span>
          {profileMsg && <p className={profileMsg.type === "error" ? "auth-error" : "auth-notice"}>{profileMsg.text}</p>}
          <span className="muted">프로필 사진은 JPG, PNG, WEBP, GIF · 5MB 이하</span>
        </form>
      </section>

      <div className="admin-tabs">
        <button className={tab === "likes" ? "active" : ""} onClick={() => setTab("likes")} type="button">
          좋아요한 캐릭터
        </button>
        <button className={tab === "characters" ? "active" : ""} onClick={() => setTab("characters")} type="button">
          내가 등록한 캐릭터
        </button>
        <button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")} type="button">
          내가 쓴 한줄평
        </button>
      </div>

      {listError && <p className="auth-error">{listError}</p>}

      {loading ? (
        <p className="muted">불러오는 중...</p>
      ) : tab === "reviews" ? (
        reviews.length === 0 ? (
          <p className="muted">아직 작성한 한줄평이 없어요.</p>
        ) : (
          <ul className="review-list">
            {reviews.map((r) => (
              <li key={r.id}>
                <div className="review-head">
                  <Link to={`/characters/${r.character_id}`}>
                    <strong>{r.character_name}</strong>
                  </Link>
                  <span className="muted">{new Date(r.created_at).toLocaleDateString("ko-KR")}</span>
                </div>
                <p>{r.content}</p>
              </li>
            ))}
          </ul>
        )
      ) : characters.length === 0 ? (
        <p className="muted">
          {tab === "likes" ? "아직 좋아요한 캐릭터가 없어요." : "아직 등록한 캐릭터가 없어요."}
        </p>
      ) : (
        <CharacterCards items={characters} />
      )}
    </div>
  );
}
