import { Platform } from "react-native";

import type {
  ApiAchievement,
  ApiLocation,
  ApiProfile,
  ApiTask,
  ApiUser,
  AuthResponse
} from "../types/api";

type JsonBody = Record<string, unknown>;

function trimSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return trimSlash(envUrl);
  if (Platform.OS === "android") return "http://10.0.2.2:8000";
  return "http://127.0.0.1:8000";
}

export const API_BASE_URL = getApiBaseUrl();

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const rawText = await response.text();
  const data = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    const message =
      typeof data?.detail === "string" ? data.detail : "Не удалось выполнить запрос к backend.";
    throw new Error(message);
  }

  return data as T;
}

export function loginUser(payload: { email: string; password: string }) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function registerUser(payload: {
  full_name: string;
  city: string;
  email: string;
  password: string;
}) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchMe(token: string) {
  return request<ApiUser>("/api/auth/me", { method: "GET" }, token);
}

export function fetchLocations(token: string) {
  return request<ApiLocation[]>("/api/locations", { method: "GET" }, token);
}

export function fetchTasks(token: string) {
  return request<ApiTask[]>("/api/tasks", { method: "GET" }, token);
}

export function fetchAchievements(token: string) {
  return request<ApiAchievement[]>("/api/achievements", { method: "GET" }, token);
}

export function fetchProfile(token: string) {
  return request<ApiProfile>("/api/profile", { method: "GET" }, token);
}
