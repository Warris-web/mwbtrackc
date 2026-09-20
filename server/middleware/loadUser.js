const User = require("../models/User");

// Why this exists: the JWT issued at login bakes in role/ward/onDutyUntil at
// that moment. If an admin reassigns a nurse from Ward A to Ward C mid-shift,
// a JWT-only check would keep honoring the OLD ward until that nurse's token
// expires or they log in again - which defeats the entire point of "staff move
// between wards constantly" being something the system has to survive.
// So access-control routes use this middleware to re-fetch the user's current
// role/ward/duty from the database on every request. The JWT is only used to
// prove WHO is asking (see requireAuth); it is never trusted for WHAT they're
// currently allowed to do.
async function loadUser(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      // Covers a deactivated/deleted account: their old token still verifies
      // cryptographically, but they no longer exist as a staff member.
      return res.status(401).json({ error: "Staff account no longer exists." });
    }
    req.user = {
      id: user._id,
      name: user.name,
      role: user.role,
      ward: user.ward,
      onDutyUntil: user.onDutyUntil,
    };
    next();
  } catch (err) {
    return res.status(500).json({ error: "Failed to load staff record." });
  }
}

module.exports = loadUser;
