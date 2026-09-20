const mongoose = require("mongoose");

// This collection is meant to be append-only. There is deliberately no update/delete
// route anywhere in the app for it. Each entry stores the hash of the previous entry
// plus its own hash, so editing any past entry (even directly in the DB) breaks the
// chain from that point forward — that's what /api/logs/verify detects.
const AccessLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    staffName: String,
    role: String,
    ward: String,
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    patientName: String,
    action: { type: String, enum: ["view", "edit", "login_fail", "reassignment"] },
    allowed: { type: Boolean, required: true },
    override: { type: Boolean, default: false }, // true if emergency override was used
    justification: { type: String, default: "" }, // required staff-entered reason when override is used ("break-glass" reason)
    reason: String, // why it was allowed/denied, in plain language (system-generated)
    prevHash: { type: String, required: true },
    hash: { type: String, required: true },
  },
  { timestamps: false }
);

module.exports = mongoose.model("AccessLog", AccessLogSchema);
