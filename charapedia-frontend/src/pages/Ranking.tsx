import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { rankingApi, worksApi } from "../api";
import type { CharacterSummary, Work } from "../types";

export function Ranking() {
  const [works, setWorks] = useState<Work[]>([]);
  const [workId, setWorkId] = useState("");
  const [items, setItems] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    worksApi.list().then((res) => setWorks(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    rankingApi
      .list(workId ? Number(workId) : undefined)
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, [workId]);

  return (
    <div className="page">
      <div className="page-header">
        <h2>인기 캐릭터 랭킹</h2>
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
      </div>

      {loading ? (
        <p className="muted">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="muted">아직 랭킹에 오른 캐릭터가 없어요.</p>
      ) : (
        <ol className="rank-list">
          {items.map((c, i) => (
            <li key={c.id} className={i < 3 ? `top-${i + 1}` : ""}>
              <Link to={`/characters/${c.id}`}>
                <span className="rank-num">{i + 1}</span>
                <div className="rank-thumb">
                  {c.image_url ? <img src={c.image_url} alt={c.name} /> : <span>-</span>}
                </div>
                <div className="rank-info">
                  <strong>{c.name}</strong>
                  <span className="work-tag">{c.work_title}</span>
                </div>
                <span className="like-badge">♥ {c.like_count}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
