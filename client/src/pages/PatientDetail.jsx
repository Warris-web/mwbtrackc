import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

const Back = () => (
  <Link className="pd-back" to="/">
    <Icon size={16}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
    Back to patients
  </Link>
);

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [denied, setDenied] = useState(null); // { error, reason }
  const [wasOverride, setWasOverride] = useState(false);
  const [justification, setJustification] = useState("");
  const [justificationError, setJustificationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load(override = false, justificationText = "") {
    setDenied(null);
    setJustificationError("");
    const params = override
      ? `?override=true&justification=${encodeURIComponent(justificationText)}`
      : "";
    return api(`/patients/${id}${params}`)
      .then((data) => {
        setPatient(data.patient);
        setWasOverride(data.wasOverride);
      })
      .catch((err) => {
        if (override && err.status === 400) {
          // Missing/empty justification - stay on the override prompt, don't
          // fall back to the generic denied screen.
          setJustificationError(err.message);
        } else {
          setDenied({ error: err.message, reason: err.reason });
        }
      });
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function submitOverride(e) {
    e.preventDefault();
    setSubmitting(true);
    load(true, justification).finally(() => setSubmitting(false));
  }

  if (denied) {
    return (
      <div className="pd-page pd-narrow">
        <style>{css}</style>
        <Back />

        <header className="pd-denied-head">
          <span className="pd-lock" aria-hidden="true">
            <Icon size={26}>
              <rect x="5" y="11" width="14" height="10" rx="2.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </Icon>
          </span>
          <div>
            <h1 className="pd-title pd-title-red">Access denied</h1>
            <p className="pd-reason" role="alert">{denied.reason}</p>
          </div>
        </header>

        <p className="pd-logged">
          <Icon size={16}>
            <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
            <path d="M9 12l2.2 2.2L15.5 10" />
          </Icon>
          This denial has already been written to the tamper-evident access log.
        </p>

        <form className="pd-override" onSubmit={submitOverride}>
          <label htmlFor="pd-justification">Emergency override - state why you need this record now:</label>
          <textarea
            id="pd-justification"
            className="pd-textarea"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="e.g. Patient collapsed in Ward B corridor, need allergy history immediately"
            rows={3}
            aria-invalid={!!justificationError}
            aria-describedby={justificationError ? "pd-just-error" : undefined}
          />
          {justificationError && (
            <p className="pd-field-error" id="pd-just-error" role="alert">
              <Icon size={16}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5M12 16.2v.1" />
              </Icon>
              {justificationError}
            </p>
          )}
          <button type="submit" className="pd-danger" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Confirming…" : "Confirm emergency override"}
          </button>
          <p className="pd-fineprint">
            No justification, no access - overriding without stating a reason is not permitted. This action, and what
            you write above, is permanently and visibly logged, and repeated overrides by the same staff member are
            flagged for the administrator to review.
          </p>
        </form>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="pd-page pd-narrow" role="status" aria-live="polite">
        <style>{css}</style>
        <span className="pd-sr">Loading…</span>
        <div className="pd-card" aria-hidden="true">
          <div className="pd-card-head">
            <span className="pd-skel pd-skel-avatar" />
            <div className="pd-skel-stack">
              <span className="pd-skel" style={{ width: 200, height: 22 }} />
              <span className="pd-skel" style={{ width: 150 }} />
            </div>
          </div>
          <div className="pd-grid">
            <span className="pd-skel" style={{ height: 64, width: "100%" }} />
            <span className="pd-skel" style={{ height: 64, width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-page pd-narrow">
      <style>{css}</style>
      <Back />

      {wasOverride && (
        <div className="pd-banner" role="status">
          <Icon size={20}>
            <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
            <path d="M12 10v4.5M12 17.2v.1" />
          </Icon>
          <p>
            This record was opened via <strong>emergency override</strong>. That action is permanently logged.
          </p>
        </div>
      )}

      <article className="pd-card">
        <header className="pd-card-head">
          <span className={`pd-avatar pd-tone-${tone(patient.name)}`} aria-hidden="true">
            {initials(patient.name)}
          </span>
          <div>
            <h1 className="pd-title">{patient.name}</h1>
            <div className="pd-meta">
              <span className="pd-pill">Ward {patient.ward}</span>
              <span className="pd-dob">
                <Icon size={15}>
                  <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                  <path d="M3.5 10h17M8 3v4M16 3v4" />
                </Icon>
                DOB: {new Date(patient.dob).toLocaleDateString()}
              </span>
            </div>
          </div>
        </header>

        <dl className="pd-grid">
          <div className="pd-item">
            <dt>Diagnosis</dt>
            <dd className={patient.diagnosis ? undefined : "pd-empty"}>{patient.diagnosis || "-"}</dd>
          </div>
          <div className="pd-item">
            <dt>Medication</dt>
            <dd className={patient.medication ? undefined : "pd-empty"}>{patient.medication || "-"}</dd>
          </div>
          {patient.sensitiveNotes !== undefined && (
            <div className="pd-item pd-item-wide pd-sensitive">
              <dt>
                <Icon size={15}>
                  <rect x="5" y="11" width="14" height="10" rx="2.5" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </Icon>
                Sensitive notes
              </dt>
              <dd className={patient.sensitiveNotes ? undefined : "pd-empty"}>{patient.sensitiveNotes || "-"}</dd>
            </div>
          )}
        </dl>
      </article>
    </div>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600&display=swap");

.pd-page {
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
  --red: #b42318;
  --red-hover: #9a1d13;
  --red-bg: #fef0ee;
  --red-line: #f6c9c3;

  max-width: 760px;
  margin: 0 auto;
  padding: 28px 16px 48px;
  font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--text);
  box-sizing: border-box;
}
.pd-page *, .pd-page *::before, .pd-page *::after { box-sizing: border-box; }
.pd-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.pd-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 18px -4px;
  padding: 4px 8px 4px 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--brand);
  text-decoration: none;
  border-radius: 8px;
}
.pd-back:hover { color: var(--brand-hover); background: var(--brand-tint); }
.pd-back:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }

.pd-title {
  margin: 0;
  font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif;
  font-weight: 700;
  font-size: 30px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.pd-title-red { color: var(--red); }

/* patient record */
.pd-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(13, 30, 42, 0.04), 0 14px 32px -20px rgba(13, 30, 42, 0.3);
}
.pd-card-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 22px;
  border-bottom: 1px solid var(--line-soft);
}
.pd-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  font-size: 20px;
  font-weight: 600;
  border-radius: 50%;
}
.pd-tone-0 { color: #0a6870; background: #e0f2f3; }
.pd-tone-1 { color: #8a6100; background: #fff3d1; }
.pd-tone-2 { color: #2b4c9b; background: #e4ecfa; }
.pd-tone-3 { color: #a1263f; background: #fce7ea; }
.pd-tone-4 { color: #5b3aa0; background: #ede7f8; }

.pd-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-top: 10px; }
.pd-pill {
  display: inline-block;
  padding: 4px 11px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  background: var(--hivis);
  border-radius: 999px;
}
.pd-dob { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--muted); }

.pd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 0; padding: 22px 24px 24px; }
.pd-item { margin: 0; padding: 14px 16px; background: var(--field); border: 1px solid var(--line-soft); border-radius: 14px; }
.pd-item-wide { grid-column: 1 / -1; }
.pd-item dt {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.pd-item dd { margin: 0; font-size: 16px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.pd-item dd.pd-empty { color: #93a1ab; }
.pd-sensitive { background: #fff; border: 1.5px dashed var(--line); border-left: 4px solid var(--ink); }
.pd-sensitive dt { color: var(--ink); }

.pd-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 16px;
  color: var(--red);
  background: var(--red-bg);
  border: 1px solid var(--red-line);
  border-left: 5px solid var(--red);
  border-radius: 14px;
}
.pd-banner svg { flex: none; margin-top: 1px; }
.pd-banner p { margin: 0; font-size: 14.5px; line-height: 1.5; }

/* denied state */
.pd-denied-head { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
.pd-lock {
  flex: none;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  color: var(--red);
  background: var(--red-bg);
  border: 1px solid var(--red-line);
  border-radius: 16px;
}
.pd-reason { margin: 8px 0 0; max-width: 60ch; font-size: 16px; line-height: 1.55; }
.pd-logged {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 22px;
  font-size: 13.5px;
  color: var(--muted);
}
.pd-logged svg { flex: none; color: var(--brand); }

.pd-override {
  display: grid;
  gap: 12px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--red-line);
  border-left: 5px solid var(--red);
  border-radius: 16px;
  box-shadow: 0 12px 28px -20px rgba(180, 35, 24, 0.5);
}
.pd-override label { font-size: 15px; font-weight: 600; line-height: 1.4; }
.pd-textarea {
  width: 100%;
  min-height: 92px;
  padding: 12px 14px;
  font: inherit;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text);
  background: var(--field);
  border: 1.5px solid var(--line);
  border-radius: 12px;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.pd-textarea::placeholder { color: #93a1ab; }
.pd-textarea:hover { border-color: #b9c7d0; }
.pd-textarea:focus-visible { background: #fff; border-color: var(--red); box-shadow: 0 0 0 4px rgba(180, 35, 24, 0.16); }
.pd-textarea[aria-invalid="true"] { border-color: var(--red); }

.pd-field-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: -2px 0 0;
  font-size: 13.5px;
  line-height: 1.4;
  color: var(--red);
}
.pd-field-error svg { flex: none; margin-top: 1px; }

.pd-danger {
  height: 48px;
  padding: 0 20px;
  font: inherit;
  font-size: 15.5px;
  font-weight: 600;
  color: #fff;
  background: var(--red);
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.pd-danger:hover:not(:disabled) { background: var(--red-hover); }
.pd-danger:active:not(:disabled) { transform: translateY(1px); }
.pd-danger:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }
.pd-danger:disabled { opacity: 0.7; cursor: progress; }

.pd-fineprint {
  margin: 0;
  padding-top: 14px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--muted);
  border-top: 1.5px dashed var(--line);
}

/* loading */
.pd-skel {
  display: block;
  height: 14px;
  max-width: 100%;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef2f5 25%, #e2e9ee 50%, #eef2f5 75%);
  background-size: 200% 100%;
  animation: pd-shimmer 1.4s ease-in-out infinite;
}
.pd-skel-avatar { flex: none; width: 60px; height: 60px; border-radius: 50%; }
.pd-skel-stack { display: grid; gap: 10px; }
@keyframes pd-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (max-width: 560px) {
  .pd-page { padding-top: 20px; }
  .pd-title { font-size: 25px; }
  .pd-card-head { padding: 20px 18px; }
  .pd-grid { grid-template-columns: 1fr; padding: 18px; }
  .pd-override { padding: 16px; }
  .pd-danger { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .pd-skel { animation: none; }
  .pd-textarea, .pd-danger { transition: none; }
}
`;