import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveSession } from "../api.js";

const DEMO_CODES = ["N001", "P001", "R001", "A001", "N002"];
const DEMO_PASSWORD = "password123";

export default function Login() {
  const [staffCode, setStaffCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api("/auth/login", { method: "POST", body: { staffCode, password } });
      saveSession(token, user);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  function fillDemo(code) {
    setStaffCode(code);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  return (
    <div className="lg-page">
      <style>{css}</style>
      <div className="lg-rings" aria-hidden="true" />

      <main className="lg-stage">
        <div className="lg-swing">
          <div className="lg-strap" aria-hidden="true" />

          <section className="lg-badge" aria-labelledby="lg-title">
            <div className="lg-slot" aria-hidden="true" />

            <header className="lg-head">
              <span className="lg-mark" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2.2 2.2L15.5 10" />
                </svg>
              </span>
              <h1 id="lg-title">Staff login</h1>
              <p>Enter your staff code and password to start your shift.</p>
            </header>

            <form className="lg-form" onSubmit={handleSubmit} noValidate>
              <div className="lg-field">
                <label htmlFor="lg-code">Staff code</label>
                <input
                  id="lg-code"
                  className="lg-input lg-code"
                  placeholder="e.g. N001"
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoFocus
                />
              </div>

              <div className="lg-field">
                <label htmlFor="lg-pass">Password</label>
                <div className="lg-pass-wrap">
                  <input
                    id="lg-pass"
                    className="lg-input"
                    placeholder="Your password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c5 0 8.5 4 9.5 6a13 13 0 0 1-2.6 3.4M6.5 7.6C4.5 9 3.1 10.9 2.5 12c1 2 4.5 6 9.5 6 1.5 0 2.9-.4 4.1-1" />
                        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="lg-error" role="alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.5v5M12 16.2v.1" />
                  </svg>
                  <span>{error}</span>
                </p>
              )}

              <button type="submit" className="lg-submit" disabled={loading} aria-busy={loading}>
                {loading ? "Logging in…" : "Log in"}
              </button>
            </form>

            <footer className="lg-demo">
              <p>
                Prototype stand-in for "code + face/voice scan." Tap a code to fill it in. Password is{" "}
                <code>{DEMO_PASSWORD}</code>.
              </p>
              <div className="lg-chips">
                {DEMO_CODES.map((c) => (
                  <button key={c} type="button" className="lg-chip" onClick={() => fillDemo(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=DM+Sans:wght@400;500;600&display=swap");

.lg-page {
  --ink: #0d1e2a;
  --ink-deep: #07141c;
  --card: #ffffff;
  --text: #12232f;
  --muted: #5a6b77;
  --line: #d5dee4;
  --field: #f4f7f9;
  --brand: #0e7c86;
  --brand-hover: #0a6870;
  --hivis: #ffc933;
  --hivis-dark: #e6ad12;
  --danger: #b42318;
  --danger-bg: #fef0ee;

  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 0 16px 32px;
  overflow: hidden;
  background: radial-gradient(120% 90% at 50% 30%, var(--ink) 0%, var(--ink-deep) 100%);
  font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--text);
  box-sizing: border-box;
}
.lg-page *, .lg-page *::before, .lg-page *::after { box-sizing: border-box; }

/* scan rings behind the badge */
.lg-rings {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-radial-gradient(circle at 50% 46%, transparent 0 54px, rgba(255, 255, 255, 0.07) 54px 55px);
  -webkit-mask-image: radial-gradient(circle at 50% 46%, #000 0%, transparent 68%);
  mask-image: radial-gradient(circle at 50% 46%, #000 0%, transparent 68%);
}

.lg-stage { position: relative; width: min(392px, 100%); padding-top: 0; }

/* lanyard + card: the one animated moment */
.lg-swing {
  transform-origin: 50% 0;
  animation: lg-hang 1.5s cubic-bezier(0.22, 0.9, 0.3, 1) both;
}
@keyframes lg-hang {
  0%   { transform: translateY(-40px) rotate(-3.5deg); }
  40%  { transform: translateY(0) rotate(2.4deg); }
  65%  { transform: rotate(-1.2deg); }
  85%  { transform: rotate(0.5deg); }
  100% { transform: rotate(0); }
}

.lg-strap {
  position: relative;
  width: 40px;
  height: 56px;
  margin: 0 auto -18px;
  z-index: 0;
  background: repeating-linear-gradient(-45deg, var(--hivis) 0 9px, var(--hivis-dark) 9px 18px);
  border-radius: 0 0 3px 3px;
}
.lg-strap::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: 100vh;
  background: inherit;
}

.lg-badge {
  position: relative;
  z-index: 1;
  background: var(--card);
  border-radius: 22px;
  padding: 44px 28px 24px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset, 0 30px 60px -20px rgba(0, 0, 0, 0.55), 0 8px 18px rgba(0, 0, 0, 0.25);
}
.lg-slot {
  position: absolute;
  top: 14px;
  left: 50%;
  width: 58px;
  height: 10px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: var(--ink);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 2px 3px rgba(0, 0, 0, 0.5);
}

.lg-head { text-align: center; margin-bottom: 24px; }
.lg-mark {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 14px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(145deg, #12939e, var(--brand));
  box-shadow: 0 8px 18px -8px rgba(14, 124, 134, 0.8);
}
.lg-head h1 {
  margin: 0 0 6px;
  font-family: "Bricolage Grotesque", "DM Sans", system-ui, sans-serif;
  font-weight: 700;
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.lg-head p { margin: 0 auto; max-width: 30ch; font-size: 14.5px; line-height: 1.5; color: var(--muted); }

.lg-form { display: grid; gap: 16px; }
.lg-field { display: grid; gap: 6px; }
.lg-field label { font-size: 13.5px; font-weight: 600; }

.lg-input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  font: inherit;
  font-size: 16px;
  color: var(--text);
  background: var(--field);
  border: 1.5px solid var(--line);
  border-radius: 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.lg-input::placeholder { color: #93a1ab; }
.lg-input:hover { border-color: #b9c7d0; }
.lg-input:focus-visible {
  background: #fff;
  border-color: var(--brand);
  box-shadow: 0 0 0 4px rgba(14, 124, 134, 0.18);
}
.lg-input.lg-code { font-weight: 600; letter-spacing: 0.06em; font-variant-numeric: tabular-nums; }
.lg-input.lg-code::placeholder { font-weight: 400; letter-spacing: 0; }

.lg-pass-wrap { position: relative; }
.lg-pass-wrap .lg-input { padding-right: 48px; }
.lg-eye {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 9px;
  cursor: pointer;
}
.lg-eye:hover { color: var(--text); background: rgba(18, 35, 47, 0.06); }
.lg-eye:focus-visible { outline: 2px solid var(--brand); outline-offset: 0; }

.lg-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--danger);
  background: var(--danger-bg);
  border: 1px solid #f6c9c3;
  border-radius: 10px;
}
.lg-error svg { flex: none; margin-top: 1px; }

.lg-submit {
  height: 50px;
  margin-top: 2px;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: var(--brand);
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 10px 20px -10px rgba(14, 124, 134, 0.9);
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
}
.lg-submit:hover:not(:disabled) { background: var(--brand-hover); }
.lg-submit:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }
.lg-submit:focus-visible { outline: 3px solid var(--hivis); outline-offset: 2px; }
.lg-submit:disabled { opacity: 0.7; cursor: progress; }

.lg-demo {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1.5px dashed var(--line);
}
.lg-demo p { margin: 0 0 12px; font-size: 13px; line-height: 1.55; color: var(--muted); }
.lg-demo code {
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  color: var(--text);
  background: var(--field);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.lg-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.lg-chip {
  padding: 6px 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--brand);
  background: #e7f4f5;
  border: 1px solid #c4e2e5;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.lg-chip:hover { color: #fff; background: var(--brand); border-color: var(--brand); }
.lg-chip:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

@media (max-width: 420px) {
  .lg-badge { padding: 42px 20px 20px; border-radius: 18px; }
  .lg-head h1 { font-size: 25px; }
}

@media (prefers-reduced-motion: reduce) {
  .lg-swing { animation: none; }
  .lg-input, .lg-submit, .lg-chip { transition: none; }
}
`;