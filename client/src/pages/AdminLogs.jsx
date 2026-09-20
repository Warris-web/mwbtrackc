import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const Icon = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ShieldCheck = (p) => (
  <Icon {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </Icon>
);
const Warn = (p) => (
  <Icon {...p}>
    <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </Icon>
);
const CheckCircle = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.2l2.4 2.4 4.6-4.8" />
  </Icon>
);
const XCircle = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </Icon>
);

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [overrideSummary, setOverrideSummary] = useState(null);

  function loadLogs() {
    api("/logs")
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function loadOverrideSummary() {
    api("/logs/override-summary").then(setOverrideSummary).catch(() => {});
  }

  useEffect(() => {
    loadLogs();
    loadOverrideSummary();
  }, []);

  async function handleVerify() {
    setVerifying(true);
    try {
      const result = await api("/logs/verify");
      setVerifyResult(result);
    } finally {
      setVerifying(false);
    }
  }

  async function handleTamper(logId) {
    await api(`/logs/_demo_tamper/${logId}`, { method: "POST" });
    loadLogs();
    setVerifyResult(null);
  }

  return (
    <div className="al-page">
      <style>{css}</style>

      <header className="al-head">
        <h1>Access log</h1>
        {!loading && (
          <span className="al-count">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </header>

      <aside className="al-notice">
        <ShieldCheck size={20} />
        <p>
          Every view/edit/login, allowed or denied, is written here and hash-chained to the entry before it. The
          "Tamper" button on the demo build directly edits a stored entry without recomputing its hash, the way an
          attacker with raw database access would. Then hit Verify.
        </p>
      </aside>

      {overrideSummary && overrideSummary.staff.length > 0 && (
        <section className="al-override" aria-labelledby="al-override-title">
          <div className="al-override-head">
            <Warn size={20} />
            <h2 id="al-override-title">Emergency override activity</h2>
            <span className="al-window">Last {overrideSummary.windowDays} days</span>
          </div>
          <p className="al-override-copy">
            Override exists so care is never blocked in an emergency - but the same door is the easiest one to abuse.
            Anyone at {overrideSummary.threshold}+ overrides in the window is flagged below for manual review, not
            automatically restricted.
          </p>
          <div className="al-scroll">
            <table className="al-table al-table-sm">
              <thead>
                <tr>
                  <th scope="col">Staff</th>
                  <th scope="col">Overrides</th>
                  <th scope="col">Last used</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {overrideSummary.staff.map((s) => (
                  <tr key={s._id || s.staffName} className={s.flagged ? "al-row-flagged" : undefined}>
                    <td>
                      <span className="al-staff">{s.staffName}</span> <span className="al-role">{s.role}</span>
                    </td>
                    <td className="al-num">{s.count}</td>
                    <td className="al-nowrap">{new Date(s.lastUsed).toLocaleString()}</td>
                    <td>
                      {s.flagged ? (
                        <span className="al-chip al-chip-red">
                          <Warn size={14} /> Flagged for review
                        </span>
                      ) : (
                        <span className="al-chip al-chip-neutral">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="al-verify-bar">
        <button className="al-verify" onClick={handleVerify} disabled={verifying} aria-busy={verifying}>
          <ShieldCheck size={18} />
          {verifying ? "Verifying…" : "Verify log integrity"}
        </button>
      </div>

      {verifyResult && (
        <div
          className={`al-result ${verifyResult.intact ? "al-result-ok" : "al-result-bad"}`}
          role={verifyResult.intact ? "status" : "alert"}
        >
          {verifyResult.intact ? <CheckCircle size={22} /> : <XCircle size={22} />}
          <div>
            {verifyResult.intact ? (
              <strong>
                Chain intact. {verifyResult.entriesChecked} entries checked, no tampering detected.
              </strong>
            ) : (
              <>
                <strong>Tampering detected</strong>
                <p>
                  Broken at entry index {verifyResult.brokenAtIndex} (id: {verifyResult.brokenEntryId}).
                  <br />
                  {verifyResult.reason}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="al-card">
        <div className="al-scroll">
          <table className="al-table al-table-log">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Staff</th>
                <th scope="col">Patient</th>
                <th scope="col">Action</th>
                <th scope="col">Allowed</th>
                <th scope="col">Override</th>
                <th scope="col">Justification</th>
                <th scope="col">Reason</th>
                <th scope="col">
                  <span className="al-sr">Demo actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} aria-hidden="true">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j}>
                        <span className="al-skel" style={{ width: j === 0 ? 120 : j === 6 || j === 7 ? 110 : 60 }} />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading &&
                logs.map((l) => (
                  <tr key={l._id} className={l.override ? "al-row-override" : undefined}>
                    <td className="al-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                    <td>
                      <span className="al-staff">{l.staffName}</span> <span className="al-role">{l.role}</span>
                    </td>
                    <td>{l.patientName || "-"}</td>
                    <td className="al-action">{l.action}</td>
                    <td>
                      <span className={`al-chip ${l.allowed ? "al-chip-green" : "al-chip-red"}`}>
                        <span className="al-dot" aria-hidden="true" />
                        {l.allowed ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      {l.override ? (
                        <span className="al-chip al-chip-amber">
                          <Warn size={14} /> Yes
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="al-text">{l.justification || ""}</td>
                    <td className="al-text">{l.reason}</td>
                    <td className="al-nowrap">
                      <button className="al-tamper" onClick={() => handleTamper(l._id)}>
                        Tamper (demo)
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && logs.length === 0 && (
          <div className="al-empty">
            <strong>No log entries yet</strong>
            <span>Views, edits and logins will be recorded here as they happen.</span>
          </div>
        )}
      </div>
    </div>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600&display=swap");

.al-page {
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
  --amber: #8a6100;
  --amber-bg: #fff8e1;
  --amber-line: #f0d27a;
  --amber-bar: #d9a300;

  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 16px 48px;
  font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--text);
  box-sizing: border-box;
}
.al-page *, .al-page *::before, .al-page *::after { box-sizing: border-box; }
.al-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.al-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.al-head h1 {
  margin: 0;
  font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif;
  font-weight: 700;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.al-count { margin-left: auto; font-size: 14px; color: var(--muted); }

.al-notice {
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
.al-notice svg { flex: none; margin-top: 1px; color: var(--brand); }
.al-notice p { margin: 0; font-size: 14px; line-height: 1.55; max-width: 78ch; }

/* override summary */
.al-override {
  margin-bottom: 20px;
  padding: 18px 18px 8px;
  background: var(--amber-bg);
  border: 1px solid var(--amber-line);
  border-left: 5px solid var(--amber-bar);
  border-radius: 14px;
}
.al-override-head { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px; color: var(--amber); }
.al-override-head h2 {
  margin: 0;
  font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text);
}
.al-window {
  padding: 3px 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--amber);
  background: #fff;
  border: 1px solid var(--amber-line);
  border-radius: 999px;
}
.al-override-copy { margin: 8px 0 12px; max-width: 78ch; font-size: 13.5px; line-height: 1.55; color: #5c4a10; }

/* tables */
.al-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(13, 30, 42, 0.04), 0 12px 28px -18px rgba(13, 30, 42, 0.25);
}
.al-scroll { overflow-x: auto; }
.al-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.al-table th {
  padding: 11px 14px;
  text-align: left;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
  background: var(--field);
  border-bottom: 1px solid var(--line);
}
.al-table td { padding: 12px 14px; vertical-align: top; line-height: 1.45; border-bottom: 1px solid var(--line-soft); }
.al-table tbody tr:last-child td { border-bottom: 0; }
.al-table-log { min-width: 1020px; }
.al-table-sm { min-width: 520px; }
.al-table-sm th { background: rgba(255, 255, 255, 0.6); border-bottom-color: var(--amber-line); }
.al-table-sm td { border-bottom-color: #f3e3ad; }
.al-table-log tbody tr:hover td { background: #fafcfd; }

.al-nowrap { white-space: nowrap; }
.al-num { font-variant-numeric: tabular-nums; font-weight: 600; }
.al-staff { font-weight: 600; }
.al-role { margin-left: 4px; font-size: 12.5px; color: var(--muted); }
.al-role::before { content: "("; }
.al-role::after { content: ")"; }
.al-action { font-weight: 500; }
.al-text { max-width: 260px; color: #33454f; }

.al-row-flagged td { background: var(--red-bg); border-bottom-color: var(--red-line); }
.al-table-log .al-row-override td { background: var(--amber-bg); }
.al-table-log .al-row-override td:first-child { box-shadow: inset 4px 0 0 var(--amber-bar); }
.al-table-log .al-row-override:hover td { background: #fff3cc; }

/* chips */
.al-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 999px;
}
.al-chip-green { color: var(--green); background: var(--green-bg); border-color: var(--green-line); }
.al-chip-red { color: var(--red); background: var(--red-bg); border-color: var(--red-line); }
.al-chip-amber { color: var(--amber); background: #fff; border-color: var(--amber-line); }
.al-chip-neutral { color: var(--muted); background: var(--field); border-color: var(--line); }
.al-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

/* verify */
.al-verify-bar { margin-bottom: 14px; }
.al-verify {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 20px;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--brand);
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 10px 20px -10px rgba(14, 124, 134, 0.9);
  transition: background 0.15s, transform 0.1s;
}
.al-verify:hover:not(:disabled) { background: var(--brand-hover); }
.al-verify:active:not(:disabled) { transform: translateY(1px); }
.al-verify:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }
.al-verify:disabled { opacity: 0.7; cursor: progress; }

.al-result {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 16px;
  font-size: 14.5px;
  line-height: 1.5;
  border: 1px solid;
  border-radius: 14px;
}
.al-result svg { flex: none; margin-top: 1px; }
.al-result p { margin: 4px 0 0; }
.al-result-ok { color: var(--green); background: var(--green-bg); border-color: var(--green-line); }
.al-result-bad { color: var(--red); background: var(--red-bg); border-color: var(--red-line); }

/* demo tamper */
.al-tamper {
  padding: 6px 12px;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--red);
  background: #fff;
  border: 1.5px dashed var(--red-line);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.al-tamper:hover { background: var(--red-bg); border-color: var(--red); }
.al-tamper:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }

.al-empty { display: grid; gap: 4px; padding: 40px 20px; text-align: center; font-size: 14px; color: var(--muted); }
.al-empty strong { font-size: 16px; color: var(--text); }

.al-skel {
  display: block;
  height: 14px;
  max-width: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2f5 25%, #e2e9ee 50%, #eef2f5 75%);
  background-size: 200% 100%;
  animation: al-shimmer 1.4s ease-in-out infinite;
}
@keyframes al-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (max-width: 520px) {
  .al-page { padding-top: 24px; }
  .al-head h1 { font-size: 27px; }
  .al-verify { width: 100%; justify-content: center; }
  .al-override { padding: 14px 14px 6px; }
}

@media (prefers-reduced-motion: reduce) {
  .al-skel { animation: none; }
  .al-verify, .al-tamper { transition: none; }
}
`;