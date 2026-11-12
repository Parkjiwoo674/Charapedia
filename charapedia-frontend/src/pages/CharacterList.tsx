import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { charactersApi, worksApi } from "../api";
import type { CharacterSummary, Work } from "../types";

export function CharacterList() {
  const [works, setWorks] = useState<Work[]>([]);
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [workId, setWorkId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    worksApi.list().then((res) => setWorks(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    charactersApi
      .list({ work_id: workId ? Number(workId) : undefined, search: search || undefined })
      .then((res) => setCharacters(res.data))
      .finally(() => setLoading(false));
  }, [workId, search]);

  return (
    <div className="page">
      <div className="page-header">
        <h2>캐릭터 도감</h2>
        <Link to="/characters/new" className="primary-btn">
          + 캐릭터 등록
        </Link>
      </div>

      <div className="filter-row">
        <select value={workId} onChange={(e) => setWorkId(e.target.value)}>
          <option value="">전체 작품</option>
          {works.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="캐릭터 이름 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="muted">불러오는 중...</p>
      ) : characters.length === 0 ? (
        <p className="muted">등록된 캐릭터가 없어요. 첫 캐릭터를 등록해보세요!</p>
      ) : (
        <div className="card-grid">
          {characters.map((c) => (
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
      )}
    </div>
  );
}