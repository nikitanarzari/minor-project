const base = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getStoredToken() {
  return localStorage.getItem("evoting_jwt");
}

export function setStoredToken(t) {
  if (t) localStorage.setItem("evoting_jwt", t);
  else localStorage.removeItem("evoting_jwt");
}
