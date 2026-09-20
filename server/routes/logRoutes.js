const express = require("express");
const AccessLog = require("../models/AccessLog");
const { requireAuth, requireRole } = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");
const { verifyChain } = require("../utils/hashChain");

const router = express.Router();
router.use(requireAuth, loadUser);

// GET /api/logs - admin only, full trail, newest first.
router.get("/", requireRole("admin"), async (req, res) => {
  const logs = await AccessLog.find().sort({ _id: -1 }).limit(500);
  res.json(logs);
});

// GET /api/logs/verify - walks the hash chain and reports whether it's intact.
// This is what an admin (or an auditor, or a court) runs after any incident to
// answer "can we trust this log?" without needing to trust the server it lived on.
router.get("/verify", requireRole("admin"), async (req, res) => {
  const result = await verifyChain();
  res.json(result);
});

// GET /api/logs/override-summary - the brief explicitly warns that emergency
// override "is also an obvious way to abuse the system." Logging every override
// is necessary but not sufficient - an admin also needs to see WHO is overriding
// a lot, without having to read every row of the raw log. This aggregates
// overrides per staff member over a rolling window and flags anyone over a
// threshold, so abuse of the safety valve gets surfaced, not just recorded.
const OVERRIDE_WINDOW_DAYS = 7;
const OVERRIDE_FLAG_THRESHOLD = 3;

router.get("/override-summary", requireRole("admin"), async (req, res) => {
  const since = new Date(Date.now() - OVERRIDE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await AccessLog.aggregate([
    { $match: { override: true, timestamp: { $gte: since } } },
    {
      $group: {
        _id: "$staffId",
        staffName: { $first: "$staffName" },
        role: { $first: "$role" },
        count: { $sum: 1 },
        lastUsed: { $max: "$timestamp" },
        justifications: { $push: "$justification" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const summary = rows.map((r) => ({
    ...r,
    flagged: r.count >= OVERRIDE_FLAG_THRESHOLD,
  }));

  res.json({ windowDays: OVERRIDE_WINDOW_DAYS, threshold: OVERRIDE_FLAG_THRESHOLD, staff: summary });
});

// POST /api/logs/_demo_tamper/:id - THIS ROUTE EXISTS ONLY TO PROVE THE POINT
// IN A LIVE DEMO. It directly edits a log entry's stored fields the way an
// attacker with raw DB access would, WITHOUT recomputing its hash - exactly
// what a real attacker could not avoid doing. Remove this route (or gate it
// behind a build flag) before treating this as anything beyond a hackathon demo.
router.post("/_demo_tamper/:id", requireRole("admin"), async (req, res) => {
  const entry = await AccessLog.findById(req.params.id);
  if (!entry) return res.status(404).json({ error: "Log entry not found." });

  entry.allowed = true; // e.g. attacker flips a denied access to "allowed" after the fact
  entry.reason = "Tampered by demo route - hash was not recomputed.";
  await entry.save();

  res.json({ message: "Entry mutated without updating its hash. Now run /api/logs/verify." });
});

module.exports = router;
