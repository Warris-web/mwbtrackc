import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getUser } from "../api.js";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function tone(name = "") {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return sum % 5;
}

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    api("/patients")
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="db-page">
      <style>{css}</style>

      <header className="db-head">
        <h1>Patients</h1>
        {user?.role !== "admin" && user?.ward && <span className="db-ward">Ward {user.ward}</span>}
        {!loading && !error && (
          <span className="db-count">
            {patients.length} {patients.length === 1 ? "patient" : "patients"}
          </span>
        )}
      </header>

      <aside className="db-notice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
          <path d="M9 12l2.2 2.2L15.5 10" />
        </svg>
        <p>
          This list is already scoped server-side to your ward. Opening a patient from another ward requires going
          there directly and will be denied and logged (unless you use the emergency override).
        </p>
      </aside>

      {error && (
        <p className="db-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.2v.1" />
          </svg>
          <span>{error}</span>
        </p>
      )}

      <div className="db-card">
        <div className="db-scroll">
          <table className="db-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Ward</th>
                <th scope="col" className="db-action-col">
                  <span className="db-sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i} aria-hidden="true">
                    <td>
                      <div className="db-person">
                        <span className="db-skel db-skel-avatar" />
                        <span className="db-skel db-skel-line" />
                      </div>
                    </td>
                    <td><span className="db-skel db-skel-pill" /></td>
                    <td className="db-action-col"><span className="db-skel db-skel-btn" /></td>
                  </tr>
                ))}

              {!loading && patients.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="db-person">
                      <span className={`db-avatar db-tone-${tone(p.name)}`} aria-hidden="true">{initials(p.name)}</span>
                      <span className="db-name">{p.name}</span>
                    </div>
                  </td>
                  <td><span className="db-pill">{p.ward}</span></td>
                  <td className="db-action-col">
                    <Link className="db-open" to={`/patients/${p._id}`}>
                      Open<span className="db-sr"> {p.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && patients.length === 0 && (
          <div className="db-empty">
            <strong>No patients to show</strong>
            <span>Patients assigned to your ward will appear here.</span>
          </div>
        )}
      </div>

      <p className="db-demo">
        Want to see the abuse case? Copy a patient ID from a ward that isn't yours, then visit{" "}
        <code>/patients/&lt;id&gt;</code> directly.
      </p>
    </div>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600&display=swap");

.db-page {
  --ink: #0d1e2a;
  --text: #12232f;
  --muted: #5a6b77;
  --line: #d5dee4;
  --line-soft: #e6edf1;
  --field: #f4f7f9;
  --brand: #0e7c86;
  --brand-hover: #0a6870;
  --brand-tint: #e7f4f5;
  --brand-line: #c4e2e5;
  --hivis: #ffc933;
  --danger: #b42318;
  --danger-bg: #fef0ee;

  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px 48px;
  font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--text);
  box-sizing: border-box;
}
.db-page *, .db-page *::before, .db-page *::after { box-sizing: border-box; }
.db-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.db-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; margin-bottom: 16px; }
.db-head h1 {
  margin: 0;
  font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif;
  font-weight: 700;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.db-ward {
  padding: 5px 12px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  background: var(--hivis);
  border-radius: 999px;
}
.db-count { margin-left: auto; font-size: 14px; color: var(--muted); }

.db-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 16px;
  color: #0a4f56;
  background: var(--brand-tint);
  border: 1px solid var(--brand-line);
  border-radius: 14px;
}
.db-notice svg { flex: none; margin-top: 1px; color: var(--brand); }
.db-notice p { margin: 0; font-size: 14px; line-height: 1.55; max-width: 72ch; }

.db-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 16px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--danger);
  background: var(--danger-bg);
  border: 1px solid #f6c9c3;
  border-radius: 10px;
}
.db-error svg { flex: none; margin-top: 1px; }

.db-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(13, 30, 42, 0.04), 0 12px 28px -18px rgba(13, 30, 42, 0.25);
}
.db-scroll { overflow-x: auto; }
.db-table { width: 100%; border-collapse: collapse; }
.db-table th {
  padding: 12px 20px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  background: var(--field);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.db-table td { padding: 14px 20px; vertical-align: middle; border-bottom: 1px solid var(--line-soft); }
.db-table tbody tr:last-child td { border-bottom: 0; }
.db-table tbody tr:hover td { background: #fafcfd; }
.db-action-col { width: 1%; text-align: right !important; white-space: nowrap; }

.db-person { display: flex; align-items: center; gap: 12px; }
.db-name { font-size: 15.5px; font-weight: 600; }
.db-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 50%;
}
.db-tone-0 { color: #0a6870; background: #e0f2f3; }
.db-tone-1 { color: #8a6100; background: #fff3d1; }
.db-tone-2 { color: #2b4c9b; background: #e4ecfa; }
.db-tone-3 { color: #a1263f; background: #fce7ea; }
.db-tone-4 { color: #5b3aa0; background: #ede7f8; }

.db-pill {
  display: inline-block;
  padding: 4px 11px;
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-hover);
  background: var(--brand-tint);
  border: 1px solid var(--brand-line);
  border-radius: 999px;
}

.db-open {
  display: inline-block;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--brand);
  text-decoration: none;
  background: #fff;
  border: 1.5px solid var(--brand-line);
  border-radius: 10px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.db-open:hover { color: #fff; background: var(--brand); border-color: var(--brand); }
.db-open:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }

.db-empty {
  display: grid;
  gap: 4px;
  padding: 40px 20px;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}
.db-empty strong { font-size: 16px; color: var(--text); }

.db-skel {
  display: block;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef2f5 25%, #e2e9ee 50%, #eef2f5 75%);
  background-size: 200% 100%;
  animation: db-shimmer 1.4s ease-in-out infinite;
}
.db-skel-avatar { width: 38px; height: 38px; border-radius: 50%; }
.db-skel-line { width: 160px; height: 14px; }
.db-skel-pill { width: 64px; height: 24px; border-radius: 999px; }
.db-skel-btn { width: 68px; height: 36px; margin-left: auto; border-radius: 10px; }
@keyframes db-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

.db-demo {
  margin: 24px 0 0;
  padding-top: 16px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--muted);
  border-top: 1.5px dashed var(--line);
}
.db-demo code {
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  color: var(--text);
  background: var(--field);
  border: 1px solid var(--line);
  border-radius: 6px;
}

@media (max-width: 520px) {
  .db-page { padding-top: 24px; }
  .db-head h1 { font-size: 27px; }
  .db-count { margin-left: 0; width: 100%; }
  .db-table th, .db-table td { padding-left: 14px; padding-right: 14px; }
  .db-skel-line { width: 110px; }
}

@media (prefers-reduced-motion: reduce) {
  .db-skel { animation: none; }
  .db-open { transition: none; }
}
`;