// 서버에서 입력값을 검사하는 도구들 (프론트의 maxLength는 우회할 수 있으므로 서버에서 반드시 다시 검사한다)

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_RE = /^[A-Za-z0-9_]{4,20}$/;
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const CODE_RE = /^\d{6}$/;

export const MAX_PASSWORD_LENGTH = 64;

// 문자열이 아니거나(배열/객체 등) 비어 있으면 "" 로 돌려준다 → 타입을 속인 요청이 500 에러를 만들지 못하게 함
export function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeEmail(value) {
  return asString(value).toLowerCase();
}

export function isValidEmail(email) {
  return email.length > 0 && email.length <= 100 && EMAIL_RE.test(email);
}

export function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
