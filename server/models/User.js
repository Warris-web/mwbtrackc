const mongoose = require("mongoose");

// A staff member. onDutyUntil models "current duty" so access control can check
// not just role + ward, but whether this person is actually on shift right now.
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    staffCode: { type: String, required: true, unique: true }, // login identifier (like an employee ID)
    passwordHash: { type: String, required: true }, // stands in for "code + biometric" in the prototype
    role: {
      type: String,
      enum: ["nurse", "physician", "records_officer", "admin"],
      required: true,
    },
    ward: { type: String, required: true }, // e.g. "A", "B", "C". Admin can be "ALL".
    onDutyUntil: { type: Date, default: null }, // null/past = not currently on duty
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
