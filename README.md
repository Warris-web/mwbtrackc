# Clinic Safe Access — Track C Prototype

ICSC 2026 Universities Hackathon — Health & Medical Systems: *Safe Access to Patient Records*.

Synthetic data only. Nothing in this repo touches a real patient, hospital, or credential.

## What this demonstrates

| Track C requirement | Where it lives |
|---|---|
| Access depends on role, ward, and current duty | `server/middleware/accessControl.js` |
| Working emergency override, immediate and unhideable | `PatientDetail.jsx` "Emergency Override" flow — requires a typed justification, no reason = no access |
| Access log that stays trustworthy even if the system is compromised | `server/utils/hashChain.js` — append-only, hash-chained, `/api/logs/verify` |
| Override is also an abuse vector (judges call this out explicitly) | `/api/logs/override-summary` — flags any staff member with 3+ overrides in 7 days, shown at the top of the admin Access Log |
| "Staff move between wards and shifts constantly" | `server/routes/userRoutes.js` + `Staff & Wards` admin screen — an admin reassigns a staff member's ward/duty window, and it takes effect on that person's very next request (see `middleware/loadUser.js` for why this needed more than just editing a DB row) |
| Abuse case demonstrated | Clerk (Ward B) opening a Ward A patient — see demo script below |
| Offline / power-cut behavior | See "Offline answer" section below — honest, not code (we scoped code time toward the items above) |

## Setup

Requires Node.js and a local MongoDB (or a free Atlas cluster — just change `MONGO_URI`).

```bash
# Backend
cd server
cp .env.example .env      # edit JWT_SECRET if you like
npm install
npm run seed               # creates synthetic staff + patients, prints test logins
npm start                  # runs on http://localhost:5000

# Frontend, in a second terminal
cd client
npm install
npm run dev                 # runs on http://localhost:5173
```

Test accounts (all password `password123`, printed again by `npm run seed`):

| Code | Name | Role | Ward | Duty |
|---|---|---|---|---|
| N001 | Nurse Aisha | nurse | A | on duty |
| P001 | Dr. Bello | physician | A | on duty |
| R001 | Clerk Musa | records_officer | B | on duty |
| A001 | Admin Grace | admin | ALL | on duty |
| N002 | Nurse Kunle | nurse | B | **off duty** |

## Abuse-case demo script (for judges)

1. Log in as **N001** (Nurse Aisha, Ward A). Note a patient ID from the dashboard — say patient X (Ward A).
2. Log out, log in as **R001** (Clerk Musa, Ward B).
3. Visit `/patients/<X's id>` directly. → **Denied**, logged with `allowed: false` and the exact reason.
4. Click **Use Emergency Override**. You'll be asked to type a reason before it grants anything — submit without text and it's rejected. Type a reason (e.g. "Patient collapsed, need allergy history") → access granted immediately, the record shows a permanent "opened via emergency override" banner, and the log entry stores both `override: true` and your exact justification text.
5. Log in as **A001** (Admin Grace), open **Access Log**. Point out: the denial, the override with its justification, both visible and neither editable through the app. Repeat the override 2 more times (any patient) as R001 to cross the flag threshold, then reload the admin log — Clerk Musa now shows "⚠ Flagged for review" in the Override Activity panel at the top, without anyone manually watching for it.
6. Click **Tamper (demo)** on any log row, then **Verify Log Integrity**. → Chain reports broken at that exact entry, proving the log detects tampering even when it happens directly in the database, bypassing the app entirely.
7. Log in as **A001**, open **Staff & Wards**. Reassign Clerk Musa from Ward B to Ward A (duty length 8). Without logging Clerk Musa out or back in — just switch to their existing session — reload the same Ward A patient that was denied in step 3: it's now allowed. No re-login was needed, because the access check reads the staff record fresh on every request rather than trusting whatever ward was baked into the original login token. That's the direct answer to the brief's "staff move between wards and shifts constantly."
7. Bonus: log in as **N002** (off-duty nurse) and try to open any patient, including their own ward → denied for duty reasons, even with matching role and ward. Override still requires being on duty (see note in `accessControl.js` on why override can't bypass duty).

## Offline answer (for the 4-page write-up)

We scoped code time toward access control, override, and tamper-evidence, since those are unique to this track. Our honest position on offline behavior:

- **Reads**: the app would cache the current staff member's own ward-scoped patient list locally (already fetched, encrypted at rest on the device) so a nurse can still see their patients' basic info during an outage.
- **Writes**: edits made offline queue locally and sync once connectivity returns. Each queued write still gets hash-chained, but using the *device's local chain*, which is verified against and merged into the server's chain on reconnect — any conflict (two staff editing the same record offline) is flagged for a human, not auto-merged.
- **Where this breaks**: the emergency override log entry is the one thing we would *not* want delayed — an override used offline should escalate (SMS/USSD to an admin, if available) the moment connectivity returns, not silently wait in a queue. This is unimplemented in the prototype; we're flagging it as a known gap rather than pretending it's solved.

## What we deliberately left out and why

- Face/voice biometrics — the underlying product description uses them, but Track C's rubric doesn't ask for biometric auth specifically; a JWT with role/ward/duty claims lets us spend the 4 days on the access-control logic instead.
- OCR photo-to-record digitization — belongs to a different problem than "who gets to see what."
- Editing under override — we chose not to allow it (see `patientRoutes.js` comment); this is a deliberate trade-off to state plainly in the write-up, not an oversight.
# mwbtrackc
# mwbtrackc
