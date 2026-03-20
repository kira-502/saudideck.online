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
  gameRequests: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req("GET", `/game-requests${q ? "?" + q : ""}`);
  },
  updateGameRequest: (id, data) => req("PATCH", `/game-requests/${id}`, data),
  steamSearch: (q) => req("GET", `/game-requests/steam-search?q=${encodeURIComponent(q)}`),
  linkSteam: (id, data) => req("PATCH", `/game-requests/${id}/steam`, data),
  deleteGameRequest: (id) => req("DELETE", `/game-requests/${id}`),
};
