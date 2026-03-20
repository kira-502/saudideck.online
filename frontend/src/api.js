// Thin fetch wrapper — all requests go to same origin (backend serves the SPA)
const BASE = "";

async function req(method, path, body) {
  const opts = {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  login: (username, password) => req("POST", "/login", { username, password }),
  logout: () => req("POST", "/logout"),
  me: () => req("GET", "/me"),
  stats: () => req("GET", "/dashboard/stats"),
  orders: (type, page = 1) => req("GET", `/orders/${type}?page=${page}`),
  users: () => req("GET", "/users"),
  auditLogs: (page = 1) => req("GET", `/audit-logs?page=${page}`),
  subscriptions: () => req("GET", "/subscriptions"),
  emailExtractions: () => req("GET", "/emails"),
  gamesLibrary: () => req("GET", "/games-library"),
};
