const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    ward: { type: String, required: true }, // which ward this patient is currently under
    diagnosis: { type: String, default: "" },
    medication: { type: String, default: "" },
    sensitiveNotes: { type: String, default: "" }, // e.g. psych/HIV history - extra-guarded field
    assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // staff actively treating this patient
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", PatientSchema);
