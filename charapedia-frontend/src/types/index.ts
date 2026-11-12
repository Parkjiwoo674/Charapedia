export interface User {
  id: number;
  username: string;
  nickname: string;
  role: "user" | "admin";
  avatar_url?: string | null;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface Work {
  id: number;
  title: string;
  author?: string;
}

export interface CharacterSummary {
  id: number;
  name: string;
  image_url?: string;
  work_title: string;
  like_count: number;
}

export interface Review {
  id: number;
  content: string;
  created_at: string;
  nickname: string;
  mine: boolean;
}

export interface CharacterDetail extends CharacterSummary {
  description?: string;
  quote?: string;
  work_id: number;
  created_by: number | null;
  isLiked: boolean;
  isReported: boolean;
  created_by_me: boolean;
  reviews: Review[];
}

export type ReportReason = "spam" | "copyright" | "abuse" | "other";

export interface ReportEntry {
  reason: ReportReason;
  detail: string | null;
  reporter_nickname: string;
  created_at: string;
}

export interface ReportGroup {
  character_id: number;
  character_name: string;
  work_title: string;
  report_count: number;
  latest_reported_at: string;
  reports: ReportEntry[];
}

export interface AdminUser {
  id: number;
  username: string;
  nickname: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalCharacters: number;
  totalWorks: number;
  totalReports: number;
  pendingReports: number;
}

export interface MyReview {
  id: number;
  content: string;
  created_at: string;
  character_id: number;
  character_name: string;
}
