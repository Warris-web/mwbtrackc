const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { appendLogEntry } = require("../utils/hashChain");

const router = express.Router();

// POST /api/auth/login  { staffCode, password }
// In the real product this is "personal code + face/voice scan". Here it's
// staffCode + password as a stand-in - swap in a biometric SDK later without
// touching anything downstream, since everything else only cares about the JWT.
router.post("/login", async (req, res) => {
  const { staffCode, password } = req.body;
  const user = await User.findOne({ staffCode });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    // Failed logins are logged too - repeated failures against one account is
    // exactly the kind of signal an admin should be able to see later.
    await appendLogEntry({
      staffId: null,
      staffName: staffCode,
      role: "unknown",
      ward: "unknown",
      patientId: null,
      patientName: null,
      action: "login_fail",
      allowed: false,
      override: false,
      reason: "Invalid staff code or password.",
    });
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      role: user.role,
      ward: user.ward,
      onDutyUntil: user.onDutyUntil,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, user: { id: user._id, name: user.name, role: user.role, ward: user.ward } });
});

module.exports = router;
