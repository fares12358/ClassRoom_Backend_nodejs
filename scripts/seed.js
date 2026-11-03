// Usage: npm run seed
// Idempotent: re-running updates the admin and skips data that already exists.
// Admin credentials come from .env: ADMIN_EMAIL / ADMIN_PASS.
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Admin from "../src/models/Admin.js";
import Plan from "../src/models/Plan.js";
import Class from "../src/models/Class.js";
import User from "../src/models/Users.js";

dotenv.config();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASS;
if (!process.env.MONGO_URI || !email || !password) {
  console.error("Missing MONGO_URI and admin credentials (ADMIN_EMAIL, ADMIN_PASS) in .env");
  process.exit(1);
}

const plans = [
  { title: "Basic", description: "Monthly access to all classes", price: 999, durationValue: 1, durationType: "month" },
  { title: "Standard", description: "Three months of access", price: 2499, durationValue: 3, durationType: "month" },
  { title: "Premium", description: "One year of access", price: 8999, durationValue: 1, durationType: "year" },
];

const classes = [
  { name: "Mathematics 101", description: "Algebra and geometry basics", status: "active", notes: ["Welcome to the class!", "Homework 1 is due next week."] },
  { name: "Physics 101", description: "Mechanics and motion", status: "active", notes: ["Bring a calculator to the first session."] },
];

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

// Admin (super-admin)
const hashed = await bcrypt.hash(password, 10);
const admin = await Admin.findOneAndUpdate(
  { email },
  { $set: { name: "Super Admin", password: hashed, role: "super-admin", status: "active" } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
console.log(`Admin ready: ${admin.email} (${admin.role})`);

// Plans
const planDocs = [];
for (const p of plans) {
  planDocs.push(await Plan.findOne({ title: p.title }) || await Plan.create(p));
}
console.log(`Plans ready: ${planDocs.map((p) => p.title).join(", ")}`);

// Classes
const classDocs = [];
for (const c of classes) {
  let doc = await Class.findOne({ name: c.name });
  if (!doc) doc = await Class.create({ ...c, notes: c.notes.map((msg) => ({ msg })) });
  classDocs.push(doc);
}
console.log(`Classes ready: ${classDocs.map((c) => c.name).join(", ")}`);

// Demo student (random password, printed only when newly created)
const studentEmail = "demo.student@example.com";
let student = await User.findOne({ email: studentEmail });
if (!student) {
  const studentPassword = crypto.randomBytes(6).toString("hex");
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  student = await User.create({
    name: "Demo Student",
    email: studentEmail,
    phone: "0000000000",
    password: await bcrypt.hash(studentPassword, 10),
    plan: planDocs[0]._id,
    status: "active",
    expiresAt,
    classes: classDocs.map((c) => c._id),
  });
  await Class.updateMany({ _id: { $in: classDocs.map((c) => c._id) } }, { $addToSet: { students: student._id } });
  console.log(`Demo student created: ${studentEmail} / ${studentPassword}`);
} else {
  console.log(`Demo student already exists: ${studentEmail}`);
}

await mongoose.disconnect();
console.log("Seed complete");
