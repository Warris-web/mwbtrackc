const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");
const loadUser = require("../middleware/loadUser");
const { appendLogEntry } = require("../utils/hashChain");

const router = express.Router();
router.use(requireAuth, loadUser);

// GET /api/users - admin only. Staff roster with current ward + duty status,
// so an admin can see at a glance who's on duty where before reassigning anyone.
router.get("/", requireRole("admin"), async (req, res) => {
  const users = await User.find().select("name role ward onDutyUntil staffCode");
  res.json(users);
});

// PATCH /api/users/:id/reassign  { ward, dutyHours }
// This is the shift-change action: an admin (or, in a real deployment, a synced
// roster system) moves a staff member to a new ward and sets how long their
// duty window lasts. Because patientRoutes/logRoutes re-read the user record
// fresh on every request (see middleware/loadUser.js), this takes effect on
// that staff member's very next request - no re-login, no stale JWT, and no
// gap where they're still treated as belonging to their old ward.
router.patch("/:id/reassign", requireRole("admin"), async (req, res) => {
  const { ward, dutyHours } = req.body;
  if (!ward) return res.status(400).json({ error: "ward is required." });

  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: "Staff member not found." });

  const previousWard = target.ward;
  target.ward = ward;
  if (dutyHours !== undefined) {
    target.onDutyUntil = new Date(Date.now() + Number(dutyHours) * 60 * 60 * 1000);
  }
  await target.save();

  // This isn't a patient access, but it's exactly the kind of action a hospital
  // needs accountability for too - who moved whom, where, and when - so it goes
  // through the same tamper-evident chain as everything else.
  await appendLogEntry({
    staffId: req.user.id,
    staffName: req.user.name,
    role: req.user.role,
    ward: req.user.ward,
    patientId: null,
    patientName: null,
    action: "reassignment",
    allowed: true,
    override: false,
    reason: `${req.user.name} reassigned ${target.name} from Ward ${previousWard} to Ward ${ward}` +
      (dutyHours !== undefined ? `, on duty for ${dutyHours}h` : ""),
  });

  res.json({ user: { id: target._id, name: target.name, role: target.role, ward: target.ward, onDutyUntil: target.onDutyUntil } });
});

module.exports = router;
