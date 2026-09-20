// Synthetic data only, per hackathon rules. No real patient or staff data.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Patient = require("./models/Patient");
const AccessLog = require("./models/AccessLog");

const inFuture = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);
const inPast = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

async function seed() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Patient.deleteMany({}), AccessLog.deleteMany({})]);

  const passwordHash = await bcrypt.hash("password123", 10); // demo only - never do this in production

  const [nurseA, physicianA, clerkB, adminX, offDutyNurseB] = await User.create([
    { name: "Nurse Aisha", staffCode: "N001", passwordHash, role: "nurse", ward: "A", onDutyUntil: inFuture(8) },
    { name: "Dr. Bello", staffCode: "P001", passwordHash, role: "physician", ward: "A", onDutyUntil: inFuture(8) },
    { name: "Clerk Musa", staffCode: "R001", passwordHash, role: "records_officer", ward: "B", onDutyUntil: inFuture(8) },
    { name: "Admin Grace", staffCode: "A001", passwordHash, role: "admin", ward: "ALL", onDutyUntil: inFuture(8) },
    { name: "Nurse Kunle", staffCode: "N002", passwordHash, role: "nurse", ward: "B", onDutyUntil: inPast(2) }, // off duty - for testing denial
  ]);

  const patients = await Patient.create([
    { name: "Patient Chidi Obi", dob: "1990-02-11", ward: "A", diagnosis: "Malaria", medication: "Artemether", assignedStaff: [nurseA._id, physicianA._id] },
    { name: "Patient Fatima Yusuf", dob: "1985-07-23", ward: "A", diagnosis: "Hypertension", medication: "Amlodipine", sensitiveNotes: "History of depression - handle with care.", assignedStaff: [physicianA._id] },
    { name: "Patient Emeka Nwosu", dob: "2001-11-02", ward: "B", diagnosis: "Fractured wrist", medication: "Paracetamol" },
    { name: "Patient Ngozi Eze", dob: "1978-05-19", ward: "B", diagnosis: "Type 2 Diabetes", medication: "Metformin", sensitiveNotes: "HIV positive - confidential per clinic policy." },
    { name: "Patient Tunde Ade", dob: "1995-09-30", ward: "C", diagnosis: "Appendicitis (post-op)", medication: "Ciprofloxacin" },
  ]);

  console.log("Seeded users:");
  console.log("  N001 / password123  -> Nurse Aisha (Ward A, on duty)");
  console.log("  P001 / password123  -> Dr. Bello (Ward A, on duty)");
  console.log("  R001 / password123  -> Clerk Musa (Ward B, on duty)  <- use this to demo the abuse case");
  console.log("  A001 / password123  -> Admin Grace (ALL, on duty)");
  console.log("  N002 / password123  -> Nurse Kunle (Ward B, OFF duty) <- use this to demo duty denial");
  console.log(`Seeded ${patients.length} synthetic patients across wards A, B, C.`);
  console.log("\nAbuse-case demo: log in as R001 (Ward B) and GET /api/patients/" + patients[0]._id + " (Ward A patient) -> should be denied and logged.");

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
