import React, { useEffect, useState } from "react";
import { api } from "../api.js";

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

const Icon = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({}); // { userId: { ward, dutyHours } }
  const [message, setMessage] = useState("");

  function load() {
    api("/users")
      .then(setStaff)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function updateEdit(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleReassign(id) {
    setMessage("");
    const { ward, dutyHours } = edits[id] || {};
    if (!ward) {
      setMessage("Pick a ward before reassigning.");
      return;
    }
    try {
      await api(`/users/${id}/reassign`, { method: "PATCH", body: { ward, dutyHours: dutyHours ? Number(dutyHours) : undefined } });
      setMessage(`Reassigned successfully. Takes effect on their very next request - no re-login needed.`);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function dutyStatus(onDutyUntil) {
    if (!onDutyUntil) return "Off duty";
    const until = new Date(onDutyUntil);
    return until > new Date() ? `On duty until ${until.toLocaleTimeString()}` : "Off duty (shift ended)";
  }

  function isOnDuty(onDutyUntil) {
    return !!onDutyUntil && new Date(onDutyUntil) > new Date();
  }

  const success = message.includes("successfully");

  return (
    <div className="st-page">
      <style>{css}</style>

      <header className="st-head">
        <h1>Staff &amp; ward assignments</h1>
        {!loading && (
          <span className="st-count">
            {staff.length} {staff.length === 1 ? "person" : "people"}
          </span>
        )}
      </header>

      <aside className="st-notice">
        <Icon size={20}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.8v.1" />
        </Icon>
        <p>
          Models a real shift change: reassigning a staff member's ward and duty window here takes effect on their
          very next request, because access-control routes re-read this record fresh every time rather than trusting
          whatever ward was baked into their login token.
        </p>
      </aside>

      {message && (
        <p className={`st-message ${success ? "st-message-ok" : "st-message-bad"}`} role={success ? "status" : "alert"}>
          {success ? (
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M8.5 12.2l2.4 2.4 4.6-4.8" />
            </Icon>
          ) : (
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5M12 16.2v.1" />
            </Icon>
          )}
          <span>{message}</span>
        </p>
      )}

      <div className="st-card">
        <div className="st-scroll">
          <table className="st-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Current ward</th>
                <th scope="col">Duty status</th>
                <th scope="col">Reassign to ward</th>
                <th scope="col">Duty length (hrs)</th>
                <th scope="col">
                  <span className="st-sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i} aria-hidden="true">
                    <td>
                      <div className="st-person">
                        <span className="st-skel st-skel-avatar" />
                        <span className="st-skel" style={{ width: 130 }} />
                      </div>
                    </td>
                    {[70, 50, 140, 80, 80, 90].map((w, j) => (
                      <td key={j}>
                        <span className="st-skel" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading &&
                staff.map((s) => {
                  const dirty = !!(edits[s._id]?.ward || edits[s._id]?.dutyHours);
                  const on = isOnDuty(s.onDutyUntil);
                  return (
                    <tr key={s._id} className={dirty ? "st-row-dirty" : undefined}>
                      <td>
                        <div className="st-person">
                          <span className={`st-avatar st-tone-${tone(s.name)}`} aria-hidden="true">
                            {initials(s.name)}
                          </span>
                          <div>
                            <div className="st-name">{s.name}</div>
                            <div className="st-code">{s.staffCode}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="st-role">{s.role}</span>
                      </td>
                      <td>
                        <span className="st-pill">{s.ward}</span>
                      </td>
                      <td>
                        <span className={`st-duty ${on ? "st-duty-on" : "st-duty-off"}`}>
                          <span className="st-dot" aria-hidden="true" />
                          {dutyStatus(s.onDutyUntil)}
                        </span>
                      </td>
                      <td>
                        <input
                          className="st-input"
                          aria-label={`Reassign ${s.name} to ward`}
                          placeholder={s.ward}
                          value={edits[s._id]?.ward || ""}
                          onChange={(e) => updateEdit(s._id, "ward", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="st-input"
                          type="number"
                          inputMode="numeric"
                          aria-label={`Duty length in hours for ${s.name}`}
                          placeholder="8"
                          value={edits[s._id]?.dutyHours || ""}
                          onChange={(e) => updateEdit(s._id, "dutyHours", e.target.value)}
                        />
                      </td>
                      <td className="st-action-col">
                        <button className="st-btn" onClick={() => handleReassign(s._id)}>
                          Reassign<span className="st-sr"> {s.name}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading && staff.length === 0 && (
          <div className="st-empty">
            <strong>No staff to show</strong>
            <span>Staff accounts will appear here so you can manage wards and duty windows.</span>
          </div>
        )}
      </div>
    </div>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600&display=swap");

.st-page {
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
  --green: #12703a;
  --green-bg: #e6f6ec;
  --green-line: #a9dcbb;
  --red: #b42318;
  --red-bg: #fef0ee;
  --red-line: #f6c9c3;

  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 16px 48px;
  font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--text);
  box-sizing: border-box;
}
.st-page *, .st-page *::before, .st-page *::after { box-sizing: border-box; }
.st-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.st-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.st-head h1 {
  margin: 0;
  font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif;
  font-weight: 700;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.st-count { margin-left: auto; font-size: 14px; color: var(--muted); white-space: nowrap; }

.st-notice {
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
.st-notice svg { flex: none; margin-top: 1px; color: var(--brand); }
.st-notice p { margin: 0; max-width: 78ch; font-size: 14px; line-height: 1.55; }

.st-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 16px;
  padding: 11px 14px;
  font-size: 14px;
  line-height: 1.45;
  border: 1px solid;
  border-radius: 12px;
}
.st-message svg { flex: none; margin-top: 1px; }
.st-message-ok { color: var(--green); background: var(--green-bg); border-color: var(--green-line); }
.st-message-bad { color: var(--red); background: var(--red-bg); border-color: var(--red-line); }

.st-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(13, 30, 42, 0.04), 0 12px 28px -18px rgba(13, 30, 42, 0.25);
}
.st-scroll { overflow-x: auto; }
.st-table { width: 100%; min-width: 940px; border-collapse: collapse; font-size: 14px; }
.st-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
  background: var(--field);
  border-bottom: 1px solid var(--line);
}
.st-table td { padding: 13px 16px; vertical-align: middle; border-bottom: 1px solid var(--line-soft); }
.st-table tbody tr:last-child td { border-bottom: 0; }
.st-table tbody tr:hover td { background: #fafcfd; }
.st-table tbody tr.st-row-dirty td { background: #f2fafb; }
.st-table tbody tr.st-row-dirty td:first-child { box-shadow: inset 4px 0 0 var(--brand); }
.st-action-col { width: 1%; text-align: right; white-space: nowrap; }

.st-person { display: flex; align-items: center; gap: 12px; }
.st-name { font-size: 15px; font-weight: 600; }
.st-code { margin-top: 1px; font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.st-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 50%;
}
.st-tone-0 { color: #0a6870; background: #e0f2f3; }
.st-tone-1 { color: #8a6100; background: #fff3d1; }
.st-tone-2 { color: #2b4c9b; background: #e4ecfa; }
.st-tone-3 { color: #a1263f; background: #fce7ea; }
.st-tone-4 { color: #5b3aa0; background: #ede7f8; }

.st-role {
  display: inline-block;
  padding: 3px 10px;
  font-size: 12.5px;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--muted);
  background: var(--field);
  border: 1px solid var(--line);
  border-radius: 999px;
}
.st-pill {
  display: inline-block;
  padding: 4px 11px;
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-hover);
  background: var(--brand-tint);
  border: 1px solid var(--brand-line);
  border-radius: 999px;
}

.st-duty { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 500; }
.st-dot { flex: none; width: 9px; height: 9px; border-radius: 50%; background: currentColor; }
.st-duty-on { color: var(--green); }
.st-duty-on .st-dot { box-shadow: 0 0 0 3px var(--green-bg); }
.st-duty-off { color: var(--muted); }

.st-input {
  width: 92px;
  height: 40px;
  padding: 0 12px;
  font: inherit;
  font-size: 14.5px;
  color: var(--text);
  background: var(--field);
  border: 1.5px solid var(--line);
  border-radius: 10px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.st-input::placeholder { color: #93a1ab; }
.st-input:hover { border-color: #b9c7d0; }
.st-input:focus-visible {
  background: #fff;
  border-color: var(--brand);
  box-shadow: 0 0 0 4px rgba(14, 124, 134, 0.18);
}

.st-btn {
  height: 40px;
  padding: 0 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--brand);
  background: #fff;
  border: 1.5px solid var(--brand-line);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.st-btn:hover { color: #fff; background: var(--brand); border-color: var(--brand); }
.st-btn:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }

.st-empty { display: grid; gap: 4px; padding: 40px 20px; text-align: center; font-size: 14px; color: var(--muted); }
.st-empty strong { font-size: 16px; color: var(--text); }

.st-skel {
  display: block;
  height: 14px;
  max-width: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2f5 25%, #e2e9ee 50%, #eef2f5 75%);
  background-size: 200% 100%;
  animation: st-shimmer 1.4s ease-in-out infinite;
}
.st-skel-avatar { width: 38px; height: 38px; flex: none; border-radius: 50%; }
@keyframes st-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (max-width: 520px) {
  .st-page { padding-top: 24px; }
  .st-head h1 { font-size: 26px; }
}

@media (prefers-reduced-motion: reduce) {
  .st-skel { animation: none; }
  .st-input, .st-btn { transition: none; }
}
`;