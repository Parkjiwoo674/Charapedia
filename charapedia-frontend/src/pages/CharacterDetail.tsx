import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams} from "react-router-dom";
import { charactersApi, reviewsApi, reportsApi } from "../api";
import { REASON_LABELS } from "../constants";
import type { CharacterDetail as CharacterDetailType, ReportReason } from "../types";
import type { useAuth } from "../hooks/useAuth";

interface Props {
  auth: ReturnType<typeof useAuth>;
}

export function CharacterDetail({ auth }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<CharacterDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [quote, setQuote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 리뷰
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // 신고
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDetail, setReportDetail] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    charactersApi
      .get(Number(id))
      .then((res) => {
        setCharacter(res.data);
        setName(res.data.name);
        setDescription(res.data.description || "");
        setImageUrl(res.data.image_url || "");
        setQuote(res.data.quote || "");
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!character) return;
    setError(null);
    setSaving(true);
    try {
      await charactersApi.update(character.id, { name, description, image_url: imageUrl, quote });
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!character) return;
    if (!confirm("정말 삭제하시겠어요?")) return;
    try {
      await charactersApi.remove(character.id);
      navigate("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  async function handleLike() {
    if (!character) return;
    try {
      const res = await charactersApi.toggleLike(character.id);
      setCharacter({ ...character, isLiked: res.data.liked, like_count: res.data.like_count });
    } catch (err) {
      alert(err instanceof Error ? err.message : "좋아요 처리에 실패했습니다.");
    }
  }

  async function handleReviewSubmit(e: FormEvent) {
    e.preventDefault();
    if (!character) return;
    setReviewError(null);
    setReviewSubmitting(true);
    try {
      const res = await reviewsApi.create(character.id, reviewText);
      const created = { ...res.data, mine: true };
      setCharacter({ ...character, reviews: [created, ...character.reviews] });
      setReviewText("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "리뷰 작성에 실패했습니다.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleReviewDelete(reviewId: number) {
    if (!character) return;
    if (!confirm("리뷰를 삭제하시겠어요?")) return;
    try {
      await reviewsApi.remove(character.id, reviewId);
      setCharacter({ ...character, reviews: character.reviews.filter((r) => r.id !== reviewId) });
    } catch (err) {
      alert(err instanceof Error ? err.message : "리뷰 삭제에 실패했습니다.");
    }
  }

  async function handleReportSubmit(e: FormEvent) {
    e.preventDefault();
    if (!character) return;
    setReportError(null);
    setReportSubmitting(true);
    try {
      const res = await reportsApi.create(character.id, reportReason, reportDetail);
      setCharacter({ ...character, isReported: true });
      setReportOpen(false);
      setReportDetail("");
      alert(res.message);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "신고에 실패했습니다.");
    } finally {
      setReportSubmitting(false);
    }
  }

  if (loading) return <div className="page">불러오는 중...</div>;
  if (!character) return <div className="page">캐릭터를 찾을 수 없어요.</div>;

  const canManage = character.created_by_me;
  const canDelete = character.created_by_me || auth.user?.role === "admin";
  const canReport = !character.created_by_me;

  return (
    <div className="page">
      {!editing ? (
        <div className="detail-card">
          <div className="detail-thumb">
            {character.image_url ? <img src={character.image_url} alt={character.name} /> : <span>이미지 없음</span>}
          </div>
          <div className="detail-body">
            <span className="work-tag">{character.work_title}</span>
            <h2>{character.name}</h2>
            {character.quote && <p className="quote">"{character.quote}"</p>}
            {character.description && (
              <ul className="feature-list">
                {character.description
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
              </ul>
            )}

            <div className="detail-meta">
              <button
                type="button"
                className={`like-btn ${character.isLiked ? "liked" : ""}`}
                onClick={handleLike}
                aria-pressed={character.isLiked}
              >
                ♥ {character.like_count}
              </button>
              {canReport &&
                (character.isReported ? (
                  <span className="report-done">신고 완료</span>
                ) : (
                  <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>
                    🚩 신고
                  </button>
                ))}
            </div>

            {(canManage || canDelete) && (
              <div className="detail-actions">
                {canManage && (
                  <button type="button" onClick={() => setEditing(true)}>
                    수정
                  </button>
                )}
                {canDelete && (
                  <button type="button" className="danger-btn" onClick={handleDelete}>
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <form className="form-card" onSubmit={handleUpdate}>
          <label>캐릭터 이름</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          <label>특징 (한 줄에 하나씩 입력하세요)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
          <label>이미지 URL</label>
          <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <label>명대사</label>
          <input type="text" value={quote} onChange={(e) => setQuote(e.target.value)} />
          {error && <p className="auth-error">{error}</p>}
          <div className="detail-actions">
            <button type="submit" disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </form>
      )}

       <div className="reviews-section" hidden={editing}>
        <h3>한줄평 ({character.reviews.length})</h3>

        <form className="review-form" onSubmit={handleReviewSubmit}>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="이 캐릭터에 대한 한줄평을 남겨보세요 (300자 이내)"
            maxLength={300}
            rows={2}
            required
          />
          <button type="submit" disabled={reviewSubmitting || !reviewText.trim()}>
            {reviewSubmitting ? "등록 중..." : "등록"}
          </button>
        </form>
        {reviewError && <p className="auth-error">{reviewError}</p>}

        {character.reviews.length === 0 ? (
          <p className="muted">아직 리뷰가 없어요. 첫 한줄평을 남겨보세요!</p>
        ) : (
          <ul className="review-list">
            {character.reviews.map((r) => (
              <li key={r.id}>
                <div className="review-head">
                  <strong>{r.nickname}</strong>
                  <span className="muted">{new Date(r.created_at).toLocaleDateString("ko-KR")}</span>
                  {r.mine && (
                    <button type="button" className="review-delete" onClick={() => handleReviewDelete(r.id)}>
                      삭제
                    </button>
                  )}
                </div>
                <p>{r.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {reportOpen && (
        <div className="modal-overlay" onClick={() => setReportOpen(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleReportSubmit}>
            <h3>캐릭터 신고</h3>
            <p className="muted">부적절한 게시물이라면 사유를 선택해주세요. 관리자가 검토 후 처리합니다.</p>

            <label>신고 사유</label>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value as ReportReason)}>
              {(Object.keys(REASON_LABELS) as ReportReason[]).map((r) => (
                <option key={r} value={r}>
                  {REASON_LABELS[r]}
                </option>
              ))}
            </select>

            <label>상세 내용 (선택)</label>
            <textarea
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="구체적인 사유를 적어주시면 검토에 도움이 돼요"
            />

            {reportError && <p className="auth-error">{reportError}</p>}

            <div className="modal-actions">
              <button type="button" onClick={() => setReportOpen(false)}>
                취소
              </button>
              <button type="submit" className="danger-solid" disabled={reportSubmitting}>
                {reportSubmitting ? "접수 중..." : "신고하기"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
