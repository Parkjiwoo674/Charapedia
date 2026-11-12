import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { charactersApi, worksApi } from "../api";
import type { Work } from "../types";

export function CharacterForm() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [workId, setWorkId] = useState("");
  const [newWorkMode, setNewWorkMode] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [newWorkAuthor, setNewWorkAuthor] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [quote, setQuote] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    worksApi.list().then((res) => setWorks(res.data));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("캐릭터 이름을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      let finalWorkId = Number(workId);

      if (newWorkMode) {
        if (!newWorkTitle.trim()) {
          setError("작품명을 입력해주세요.");
          setSubmitting(false);
          return;
        }
        const workRes = await worksApi.create(newWorkTitle, newWorkAuthor);
        finalWorkId = workRes.data.id;
      } else if (!workId) {
        setError("작품을 선택하거나 새 작품을 추가해주세요.");
        setSubmitting(false);
        return;
      }

      const res = await charactersApi.create({
        work_id: finalWorkId,
        name,
        description,
        image_url: imageUrl,
        quote,
      });
      navigate(`/characters/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h2>캐릭터 등록</h2>
      <form className="form-card" onSubmit={handleSubmit}>
        {!newWorkMode ? (
          <>
            <label>작품</label>
            <select value={workId} onChange={(e) => setWorkId(e.target.value)}>
              <option value="">작품 선택</option>
              {works.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
            <button type="button" className="link-btn" onClick={() => setNewWorkMode(true)}>
              + 새 작품 추가하기
            </button>
          </>
        ) : (
          <>
            <label>새 작품명</label>
            <input type="text" value={newWorkTitle} onChange={(e) => setNewWorkTitle(e.target.value)} placeholder="작품명" maxLength={200} />
            <input
              type="text"
              value={newWorkAuthor}
              onChange={(e) => setNewWorkAuthor(e.target.value)}
              placeholder="작가명 (선택)"
              maxLength={100}
            />
            <button type="button" className="link-btn" onClick={() => setNewWorkMode(false)}>
              기존 작품에서 선택하기
            </button>
          </>
        )}

        <label>캐릭터 이름</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="캐릭터 이름" maxLength={100} required />

        <label>특징 (한 줄에 하나씩 입력하세요)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={"예시:\n너구리 수인\n하트 더듬이와 푸른색 하트\n활은 양갈래 머리"}
          rows={5}
          maxLength={2000}
        />

        <label>이미지 URL</label>
        <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." maxLength={2000} />

        <label>명대사</label>
        <input type="text" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="명대사 (선택)" maxLength={500} />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </div>
  );
}