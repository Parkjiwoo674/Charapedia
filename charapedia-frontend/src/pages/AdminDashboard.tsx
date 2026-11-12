import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api";
import { REASON_LABELS } from "../constants";
import type { AdminStats, AdminUser, ReportGroup } from "../types";
import type { useAuth } from "../hooks/useAuth";

interface Props {
  auth: ReturnType<typeof useAuth>;
}

type Tab = "reports" | "users" | "stats";

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export function AdminDashboard({ auth }: Props) {
  const [tab, setTab] = useState<Tab>("reports");

  if (auth.user?.role !== "admin") {
    return (
      <div className="page">
        <p className="muted">관리자만 접근할 수 있는 페이지예요.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>관리자 대시보드</h2>
      </div>

      <div className="admin-tabs">
        <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")} type="button">
          신고 관리
        </button>
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")} type="button">
          사용자
        </button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")} type="button">
          통계
        </button>
      </div>

      {tab === "reports" && <ReportsPanel />}
      {tab === "users" && <UsersPanel />}
      {tab === "stats" && <StatsPanel />}
    </div>
  );
}

function ReportsPanel() {
  const [status, setStatus] = useState<"pending" | "dismissed">("pending");
  const [items, setItems] = useState<ReportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    adminApi
      .reports(status)
      .then((res) => setItems(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [status]);

  async function handleDelete(item: ReportGroup) {
    if (!confirm(`'${item.character_name}' 캐릭터를 삭제할까요? 좋아요/리뷰/신고 기록도 함께 삭제돼요.`)) return;
    try {
      await adminApi.deleteCharacter(item.character_id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  async function handleDismiss(item: ReportGroup) {
    if (!confirm(`'${item.character_name}' 신고를 반려할까요? (캐릭터는 유지돼요)`)) return;
    try {
      await adminApi.dismiss(item.character_id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "반려에 실패했습니다.");
    }
  }

  return (
    <div>
      <div className="filter-row">
        <select value={status} onChange={(e) => setStatus(e.target.value as "pending" | "dismissed")}>
          <option value="pending">처리 대기</option>
          <option value="dismissed">반려됨</option>
        </select>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <p className="muted">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="muted">{status === "pending" ? "처리할 신고가 없어요 🎉" : "반려된 신고가 없어요."}</p>
      ) : (
        <ul className="report-list">
          {items.map((item) => (
            <li key={item.character_id} className="report-card">
              <div className="report-card-head">
                <div>
                  <Link to={`/characters/${item.character_id}`} className="report-title">
                    {item.character_name}
                  </Link>
                  <span className="work-tag"> {item.work_title}</span>
                </div>
                <span className="report-count">신고 {item.report_count}건</span>
              </div>

              <ul className="report-entries">
                {item.reports.map((r, i) => (
                  <li key={i}>
                    <span className="reason-chip">{REASON_LABELS[r.reason]}</span>
                    <span className="report-detail">{r.detail || "(상세 내용 없음)"}</span>
                    <span className="muted">
                      {r.reporter_nickname} · {formatDate(r.created_at)}
                    </span>
                  </li>
                ))}
              </ul>

              {status === "pending" && (
                <div className="report-actions">
                  <button type="button" onClick={() => handleDismiss(item)}>
                    반려
                  </button>
                  <button type="button" className="danger-solid" onClick={() => handleDelete(item)}>
                    캐릭터 삭제
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .users()
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">불러오는 중...</p>;

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>아이디</th>
            <th>닉네임</th>
            <th>이메일</th>
            <th>권한</th>
            <th>가입일</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.nickname}</td>
              <td>{u.email}</td>
              <td>{u.role === "admin" ? "관리자" : "일반"}</td>
              <td>{formatDate(u.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatsPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminApi.stats().then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="muted">불러오는 중...</p>;

  const cards: { label: string; value: number; highlight?: boolean }[] = [
    { label: "전체 사용자", value: stats.totalUsers },
    { label: "등록된 작품", value: stats.totalWorks },
    { label: "등록된 캐릭터", value: stats.totalCharacters },
    { label: "누적 신고", value: stats.totalReports },
    { label: "처리 대기 신고", value: stats.pendingReports, highlight: stats.pendingReports > 0 },
  ];

  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <div key={c.label} className={`stat-card ${c.highlight ? "highlight" : ""}`}>
          <span className="muted">{c.label}</span>
          <strong>{c.value}</strong>
        </div>
      ))}
    </div>
  );
}
