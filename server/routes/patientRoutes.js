const express = require("express");
const Patient = require("../models/Patient");
const { requireAuth } = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");
const { checkPatientAccess } = require("../middleware/accessControl");
const { appendLogEntry } = require("../utils/hashChain");

const router = express.Router();
// loadUser re-fetches role/ward/duty fresh on every request - see loadUser.js
// for why this matters more here than almost anywhere else in the app.
router.use(requireAuth, loadUser);

// GET /api/patients - list is pre-filtered to the staff member's ward.
// Admins see everything. This is the "staff only see what their role allows"
// requirement applied at the list level, not just the single-record level.
router.get("/", async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { ward: req.user.ward };
  const patients = await Patient.find(filter).select("-sensitiveNotes");
  res.json(patients);
});

// GET /api/patients/:id?override=true - single-record view, the one that
// actually runs the access-control decision and writes to the log either way.
router.get("/:id", async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const override = req.query.override === "true";
  const justification = (req.query.justification || "").trim();

  // Break-glass rule: override is instant, but never silent. No typed reason,
  // no access - this is the one piece of friction we deliberately keep on the
  // override path, precisely because the brief flags override as an abuse vector.
  if (override && !justification) {
    return res.status(400).json({ error: "Emergency override requires a written justification." });
  }

  const decision = checkPatientAccess(req.user, patient, { action: "view", override });

  await appendLogEntry({
    staffId: req.user.id,
    staffName: req.user.name,
    role: req.user.role,
    ward: req.user.ward,
    patientId: patient._id,
    patientName: patient.name,
    action: "view",
    allowed: decision.allowed,
    override: !!decision.override,
    justification: decision.override ? justification : "",
    reason: decision.reason,
  });

  if (!decision.allowed) {
    return res.status(403).json({ error: "Access denied.", reason: decision.reason });
  }

  // Sensitive notes are only ever returned to a physician/admin, override or not -
  // an override on ward gets you the record, it does not waive field-level sensitivity.
  const payload = patient.toObject();
  if (!["physician", "admin"].includes(req.user.role)) delete payload.sensitiveNotes;

  res.json({ patient: payload, accessNote: decision.reason, wasOverride: !!decision.override });
});

// PUT /api/patients/:id - edit clinical fields. Physician/admin only, same-ward
// only (override on edit is intentionally NOT allowed in this prototype - an
// emergency lets you SEE a record fast, editing it can wait for a real handoff
// or a second physician; note this trade-off explicitly in your write-up).
router.put("/:id", async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const decision = checkPatientAccess(req.user, patient, { action: "edit", override: false });

  await appendLogEntry({
    staffId: req.user.id,
    staffName: req.user.name,
    role: req.user.role,
    ward: req.user.ward,
    patientId: patient._id,
    patientName: patient.name,
    action: "edit",
    allowed: decision.allowed,
    override: false,
    reason: decision.reason,
  });

  if (!decision.allowed) {
    return res.status(403).json({ error: "Access denied.", reason: decision.reason });
  }

  const { diagnosis, medication, sensitiveNotes } = req.body;
  if (diagnosis !== undefined) patient.diagnosis = diagnosis;
  if (medication !== undefined) patient.medication = medication;
  if (sensitiveNotes !== undefined) patient.sensitiveNotes = sensitiveNotes;
  await patient.save();

  res.json({ patient });
});

module.exports = router;
