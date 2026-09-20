const crypto = require("crypto");
const AccessLog = require("../models/AccessLog");

const GENESIS_HASH = "0".repeat(64);

// Deterministically hash the fields that matter for integrity. Order matters -
// always build the string the same way, or verify() will disagree with append().
// justification is included so an admin can't quietly edit an override's stated
// reason after the fact without the tamper check catching it.
function computeHash({ timestamp, staffId, patientId, action, allowed, override, justification, reason, prevHash }) {
  const payload = [
    new Date(timestamp).toISOString(),
    String(staffId || ""),
    String(patientId || ""),
    action,
    allowed,
    override,
    justification || "",
    reason || "",
    prevHash,
  ].join("|");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// Appends one tamper-evident entry to the log. Always reads the true latest entry
// from the DB first, so entries chain correctly even under concurrent requests.
async function appendLogEntry(entryData) {
  const last = await AccessLog.findOne().sort({ _id: -1 });
  const prevHash = last ? last.hash : GENESIS_HASH;
  const timestamp = new Date();
  const hash = computeHash({ ...entryData, timestamp, prevHash });

  const entry = new AccessLog({
    ...entryData,
    timestamp,
    prevHash,
    hash,
  });
  await entry.save();
  return entry;
}

// Walks the whole chain in insertion order and recomputes each hash from stored
// fields. Returns the first entry where the stored hash no longer matches what
// the fields produce, or the first broken prevHash link - either means tampering.
async function verifyChain() {
  const entries = await AccessLog.find().sort({ _id: 1 });
  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const recomputed = computeHash({
      timestamp: e.timestamp,
      staffId: e.staffId,
      patientId: e.patientId,
      action: e.action,
      allowed: e.allowed,
      override: e.override,
      justification: e.justification,
      reason: e.reason,
      prevHash: e.prevHash,
    });

    if (e.prevHash !== expectedPrevHash) {
      return {
        intact: false,
        brokenAtIndex: i,
        brokenEntryId: e._id,
        reason: "prevHash does not match the hash of the entry before it - an entry may have been inserted, deleted, or reordered.",
      };
    }
    if (recomputed !== e.hash) {
      return {
        intact: false,
        brokenAtIndex: i,
        brokenEntryId: e._id,
        reason: "Stored hash does not match the entry's own data - this entry's fields were edited after the fact.",
      };
    }
    expectedPrevHash = e.hash;
  }

  return { intact: true, entriesChecked: entries.length };
}

module.exports = { appendLogEntry, verifyChain, GENESIS_HASH };
