import React from "react";
import { Routes, Route, Navigate, Link, NavLink, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PatientDetail from "./pages/PatientDetail.jsx";
import AdminLogs from "./pages/AdminLogs.jsx";
import AdminStaff from "./pages/AdminStaff.jsx";
import { getToken, getUser, logout } from "./api.js";

function Protected({ children }) {
  // Require BOTH a token and a decoded user - a token with no matching user
  // (stale localStorage, or a token from before a server restart/secret change)
  // should send you back to login, not into a half-broken dashboard.
  if (!getToken() || !getUser()) {
    logout();
    return <Navigate to="/login" replace />;
  }
  return children;
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function App() {
  // Subscribing to the location makes App re-render on every navigation, so
  // getUser() is re-read right after login (saveSession -> navigate("/")).
  // Without this, App only rendered once and the header stayed hidden until a reload.
  const { pathname } = useLocation();
  const user = getUser();
  const isLogin = pathname === "/login";

  const routes = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/patients/:id" element={<Protected><PatientDetail /></Protected>} />
      <Route path="/admin/logs" element={<Protected><AdminLogs /></Protected>} />
      <Route path="/admin/staff" element={<Protected><AdminStaff /></Protected>} />
    </Routes>
  );

  // The login page is a full-bleed screen of its own: no header, no wrapper.
  if (isLogin) {
    return (
      <>
        <style>{css}</style>
        {routes}
      </>
    );
  }

  return (
    <div className="app-shell">
      <style>{css}</style>
      <a className="app-skip" href="#main">Skip to content</a>

      <header className="app-bar">
        <div className="app-bar-inner">
          <Link to="/" className="app-brand">
            <span className="app-mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                <path d="M9 12l2.2 2.2L15.5 10" />
              </svg>
            </span>
            <span className="app-brand-name">Clinic Safe Access</span>
          </Link>

          {user && (
            <div className="app-right">
              {user.role === "admin" && (
                <nav className="app-nav" aria-label="Admin">
                  <NavLink to="/admin/logs" className={({ isActive }) => "app-link" + (isActive ? " is-active" : "")}>
                    Access log
                  </NavLink>
                  <NavLink to="/admin/staff" className={({ isActive }) => "app-link" + (isActive ? " is-active" : "")}>
                    Staff &amp; wards
                  </NavLink>
                </nav>
              )}

              <div className="app-user">
                <span className="app-avatar" aria-hidden="true">{initials(user.name)}</span>
                <span className="app-user-text">
                  <span className="app-user-name">{user.name}</span>
                  <span className="app-user-meta">
                    {user.role}
                    {user.ward ? `, Ward ${user.ward}` : ""}
                  </span>
                </span>
              </div>

              <button
                className="app-logout"
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main id="main">{routes}</main>
    </div>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600&display=swap");

body { margin: 0; }

.app-shell {
  --ink: #0d1e2a;
  --brand: #0e7c86;
  --hivis: #ffc933;
  --hivis-dark: #e6ad12;

  min-height: 100vh;
  min-height: 100dvh;
  background: #eef3f6;
  font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #12232f;
}
.app-shell *, .app-shell *::before, .app-shell *::after { box-sizing: border-box; }

.app-skip {
  position: absolute;
  left: 12px;
  top: -60px;
  z-index: 10;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  background: var(--hivis);
  border-radius: 10px;
  text-decoration: none;
}
.app-skip:focus { top: 12px; }

.app-bar { background: var(--ink); color: #fff; }
.app-bar::after {
  content: "";
  display: block;
  height: 4px;
  background: repeating-linear-gradient(-45deg, var(--hivis) 0 9px, var(--hivis-dark) 9px 18px);
}
.app-bar-inner {
  max-width: 1240px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 20px;
}

.app-brand { display: inline-flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; border-radius: 10px; }
.app-brand:focus-visible { outline: 3px solid var(--hivis); outline-offset: 3px; }
.app-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #fff;
  background: linear-gradient(145deg, #12939e, var(--brand));
  border-radius: 11px;
}
.app-brand-name {
  font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.app-right { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; }
.app-nav { display: flex; align-items: center; gap: 4px; }
.app-link {
  padding: 8px 14px;
  font-size: 14.5px;
  font-weight: 600;
  color: #c3d1da;
  text-decoration: none;
  border-radius: 10px;
  box-shadow: inset 0 -3px 0 transparent;
  transition: background 0.15s, color 0.15s;
}
.app-link:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
.app-link.is-active { color: #fff; background: rgba(255, 255, 255, 0.1); box-shadow: inset 0 -3px 0 var(--hivis); }
.app-link:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }

.app-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 14px;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
}
.app-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 13px;
  font-weight: 600;
  color: #0a6870;
  background: #e0f2f3;
  border-radius: 50%;
}
.app-user-text { display: grid; line-height: 1.25; }
.app-user-name { font-size: 14px; font-weight: 600; }
.app-user-meta { font-size: 12.5px; color: #9fb3c0; text-transform: capitalize; }

.app-logout {
  height: 38px;
  padding: 0 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.app-logout:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.5); }
.app-logout:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }

@media (max-width: 720px) {
  .app-right { width: 100%; justify-content: space-between; }
  .app-nav { order: 3; width: 100%; overflow-x: auto; }
  .app-user { padding-left: 0; border-left: 0; }
}
@media (max-width: 420px) {
  .app-brand-name { font-size: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  .app-link, .app-logout { transition: none; }
}
`;