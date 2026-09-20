// This is the decision function judges will actually poke at. It answers one
// question: should THIS staff member see or edit THIS patient's record, right now?
//
// Rules, in order:
// 1. Admins can view (not edit clinical fields) anything - they administer the system, not treat patients.
// 2. Everyone else must currently be on duty (onDutyUntil in the future). Off-duty staff get nothing,
//    override included - "on duty" is the one thing an override cannot fake, since it's set by an
//    admin/roster, not the staff member themselves.
// 3. Ward must match the patient's ward. This is the "clerk in Ward B opening a Ward A patient" case.
// 4. Editing clinical fields (diagnosis/medication/sensitiveNotes) is physician-only.
// 5. If none of the above pass, the request is denied UNLESS `override: true` was explicitly
//    requested - emergency override always succeeds for on-duty clinical staff, but is logged
//    at a higher visibility than a normal allowed access (see routes/patientRoutes.js).
function checkPatientAccess(user, patient, { action, override }) {
  const now = new Date();
  const onDuty = user.role === "admin" || (user.onDutyUntil && new Date(user.onDutyUntil) > now);

  if (!onDuty) {
    return { allowed: false, reason: "Staff member is not currently on duty." };
  }

  if (action === "edit" && user.role !== "physician" && user.role !== "admin") {
    return { allowed: false, reason: "Only a physician may edit clinical fields." };
  }

  const sameWard = user.role === "admin" || user.ward === patient.ward;

  if (sameWard) {
    return { allowed: true, reason: "Role, ward and duty status all match." };
  }

  if (override) {
    return {
      allowed: true,
      reason: "Emergency override used - staff is on duty but outside the patient's ward.",
      override: true,
    };
  }

  return {
    allowed: false,
    reason: `Staff is assigned to Ward ${user.ward}, patient is in Ward ${patient.ward}. No override requested.`,
  };
}

module.exports = { checkPatientAccess };
