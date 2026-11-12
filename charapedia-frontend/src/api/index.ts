import type {
  AuthResponse,
  User,
  Work,
  CharacterSummary,
  CharacterDetail,
  Review,
  ReportReason,
  ReportGroup,
  AdminUser,
  AdminStats,
  MyReview,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "charapedia_token";

// 업로드된 파일(프로필 사진 등)은 /api 가 아니라 서버 주소 바로 아래에서 제공된다
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function assetUrl(path?: string | null) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "요청 처리 중 오류가 발생했습니다.");
  }
  return data as T;
}

export const authApi = {
  sendCode: (email: string) =>
    request<{ success: boolean; message: string }>("/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  signup: (username: string, nickname: string, password: string, email: string, code: string) =>
    request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, nickname, password, email, code }),
    }),
  login: (username: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ success: boolean; data: User }>("/auth/me"),
  forgotPassword: (username: string, email: string) =>
    request<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ username, email }),
    }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    }),
  deleteAccount: (password: string) =>
    request<{ success: boolean; message: string }>("/auth/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
};

export const worksApi = {
  list: () => request<{ success: boolean; data: Work[] }>("/works"),
  create: (title: string, author: string) =>
    request<{ success: boolean; data: { id: number } }>("/works", {
      method: "POST",
      body: JSON.stringify({ title, author }),
    }),
};

export const charactersApi = {
  list: (params: { work_id?: number; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.work_id) qs.set("work_id", String(params.work_id));
    if (params.search) qs.set("search", params.search);
    const suffix = qs.toString();
    return request<{ success: boolean; data: CharacterSummary[] }>(`/characters${suffix ? `?${suffix}` : ""}`);
  },
  get: (id: number) => request<{ success: boolean; data: CharacterDetail }>(`/characters/${id}`),
  create: (payload: { work_id: number; name: string; description?: string; image_url?: string; quote?: string }) =>
    request<{ success: boolean; data: { id: number } }>("/characters", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: { name?: string; description?: string; image_url?: string; quote?: string }) =>
    request<{ success: boolean; message: string }>(`/characters/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) => request<{ success: boolean; message: string }>(`/characters/${id}`, { method: "DELETE" }),
  toggleLike: (id: number) =>
    request<{ success: boolean; data: { liked: boolean; like_count: number } }>(`/characters/${id}/like`, {
      method: "POST",
    }),
};

export const reviewsApi = {
  create: (characterId: number, content: string) =>
    request<{ success: boolean; data: Review & { user_id: number } }>(`/characters/${characterId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  remove: (characterId: number, reviewId: number) =>
    request<{ success: boolean; message: string }>(`/characters/${characterId}/reviews/${reviewId}`, {
      method: "DELETE",
    }),
};

export const reportsApi = {
  create: (characterId: number, reason: ReportReason, detail: string) =>
    request<{ success: boolean; message: string }>(`/characters/${characterId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, detail }),
    }),
};

export const rankingApi = {
  list: (workId?: number) =>
    request<{ success: boolean; data: CharacterSummary[] }>(`/ranking${workId ? `?work_id=${workId}` : ""}`),
};

export const adminApi = {
  reports: (status: "pending" | "dismissed" = "pending") =>
    request<{ success: boolean; data: ReportGroup[] }>(`/admin/reports?status=${status}`),
  deleteCharacter: (id: number) =>
    request<{ success: boolean; message: string }>(`/admin/characters/${id}`, { method: "DELETE" }),
  dismiss: (characterId: number) =>
    request<{ success: boolean; message: string }>("/admin/reports/dismiss", {
      method: "POST",
      body: JSON.stringify({ character_id: characterId }),
    }),
  users: () => request<{ success: boolean; data: AdminUser[] }>("/admin/users"),
  stats: () => request<{ success: boolean; data: AdminStats }>("/admin/stats"),
};
export const userApi = {
  updateProfile: (nickname: string) =>
    request<{ success: boolean; data: { nickname: string } }>("/user/profile", {
      method: "PUT",
      body: JSON.stringify({ nickname }),
    }),

  // 파일 업로드는 JSON이 아니라 FormData라서 Content-Type을 직접 지정하지 않는다(브라우저가 알아서 설정)
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    const token = getToken();
    const res = await fetch(`${API_URL}/user/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "사진 업로드에 실패했습니다.");
    }
    return data as { success: boolean; data: { avatar_url: string } };
  },

  removeAvatar: () => request<{ success: boolean; data: { avatar_url: null } }>("/user/avatar", { method: "DELETE" }),

  likes: () => request<{ success: boolean; data: CharacterSummary[] }>("/user/likes"),
  characters: () => request<{ success: boolean; data: CharacterSummary[] }>("/user/characters"),
  reviews: () => request<{ success: boolean; data: MyReview[] }>("/user/reviews"),
};
