import type { ReportReason } from "./types";

export const REASON_LABELS: Record<ReportReason, string> = {
  spam: "도배/스팸",
  copyright: "저작권 침해",
  abuse: "욕설·혐오 표현",
  other: "기타",
};
