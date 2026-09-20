const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export function getToken() {
  return localStorage.getItem("token");
}

export function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 401 here means the token itself is bad (expired, or signed with a
    // secret the server no longer has - e.g. after a restart during the demo).
    // That's different from a 403 access-control denial, which is a real,
    // intentional result we want to show on screen, not treat as a login problem.
    if (res.status === 401) {
      logout();
      window.location.href = "/login";
    }
    const err = new Error(data.error || "Request failed");
    err.reason = data.reason;
    err.status = res.status;
    throw err;
  }
  return data;
}
