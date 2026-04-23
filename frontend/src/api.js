// Thin fetch wrapper — all requests go to same origin (backend serves the SPA)
const BASE = "/api";

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
  changePassword: (current_password, new_password) =>
    req("POST", "/change-password", { current_password, new_password }),
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
  restoreGameRequest: (id) => req("POST", `/game-requests/${id}/restore`),
  permanentDeleteGameRequest: (id) => req("DELETE", `/game-requests/${id}/permanent`),
  refreshAllPrices: () => req("POST", "/game-requests/refresh-prices"),
  notifyInfo: (id) => req("GET", `/game-requests/${id}/notify-info`),
  uploadContacts: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/game-requests/upload-contacts", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || res.statusText);
    }
    return res.json();
  },
  campaignSubscribers: () => req("GET", "/campaign/subscribers"),
  campaignSend: (data) => req("POST", "/campaign/send", data),
  aedRate: () => req("GET", "/devices/rate"),
  deviceRecords: (model) => req("GET", `/devices/records${model ? "?model=" + encodeURIComponent(model) : ""}`),
  saveDeviceRecord: (data) => req("POST", "/devices/records", data),
  deleteDeviceRecord: (id) => req("DELETE", `/devices/records/${id}`),
  gameCodes: (status) => req("GET", `/game-codes${status ? "?status=" + status : ""}`),
  addGameCode: (data) => req("POST", "/game-codes", data),
  markCodeSent: (id, data) => req("PATCH", `/game-codes/${id}/send`, data),
  deleteGameCode: (id) => req("DELETE", `/game-codes/${id}`),
};
