import { useEffect, useState } from "react";
import { authApi, clearToken, getToken, setToken } from "../api";
import type { User } from "../types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function sendCode(email: string) {
    await authApi.sendCode(email);
  }

  async function signup(username: string, nickname: string, password: string, email: string, code: string) {
    const res = await authApi.signup(username, nickname, password, email, code);
    setToken(res.token);
    setUser(res.user);
  }

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  async function deleteAccount(password: string) {
    await authApi.deleteAccount(password);
    clearToken();
    setUser(null);
  }

  // 닉네임/프로필 사진이 바뀌었을 때 화면의 로그인 정보를 바로 갱신
  function updateUser(patch: Partial<User>) {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }

  return { user, loading, sendCode, signup, login, logout, deleteAccount, updateUser };
}