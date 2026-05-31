const API_URL = "https://nurse-lxh.onrender.com";
/** @param {string} path @param {RequestInit} [options] */
export async function api(path, options = {}) {
  const headers = { ...options.headers };
  if (
    options.body &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const authApi = {
  me: () => api("/api/auth/me"),
  login: (email, password) =>
    api("/api/auth/login", { method: "POST", body: { email, password } }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
};

export const scheduleApi = {
  month: (year, month) => api(`/api/schedule/${year}/${month}`),
  shift: (body) => api("/api/schedule/shift", { method: "POST", body }),
  bulk: (entries) =>
    api("/api/schedule/bulk", { method: "POST", body: { entries } }),
  daily: (year, month, day) =>
    api(`/api/schedule/daily?year=${year}&month=${month}&day=${day}`),
  summary: (year, month) =>
    api(`/api/schedule/summary?year=${year}&month=${month}`),
  shiftTypes: () => api("/api/schedule/shift-types"),
};

export const staffApi = {
  list: () => api("/api/staff"),
  add: (body) => api("/api/staff", { method: "POST", body }),
  remove: (id) => api(`/api/staff/${id}`, { method: "DELETE" }),
};

export const usersApi = {
  list: () => api("/api/users"),
  setRole: (id, role) =>
    api(`/api/users/${id}/role`, { method: "PATCH", body: { role } }),
  disable: (id) => api(`/api/users/${id}`, { method: "DELETE" }),
};
