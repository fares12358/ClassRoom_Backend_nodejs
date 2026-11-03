// Usage: node scripts/seed-more.js
// Idempotent extra demo data: plans (6 total), classes (10 total), 10 students,
// transactions (succeeded / pending / failed) and pending accounts.
// Matches existing rows by title / name / email / stripeSessionId, so re-running is safe.
// All demo students share DEMO_PASSWORD below (demo data only).
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Plan from "../src/models/Plan.js";
import Class from "../src/models/Class.js";
import User from "../src/models/Users.js";
import PendingUser from "../src/models/PendingUser.js";
import Transaction from "../src/models/Transaction.js";

dotenv.config();
if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

const DEMO_PASSWORD = "Student@123";
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (d) => new Date(Date.now() + d * DAY);

const plans = [
  { title: "Basic", description: "Monthly access to all classes", price: 999, durationValue: 1, durationType: "month" },
  { title: "Standard", description: "Three months of access", price: 2499, durationValue: 3, durationType: "month" },
  { title: "Premium", description: "One year of access", price: 8999, durationValue: 1, durationType: "year" },
  { title: "Weekly Pass", description: "One week trial access", price: 399, durationValue: 1, durationType: "week" },
  { title: "Semester", description: "Six months of access", price: 4999, durationValue: 6, durationType: "month" },
  { title: "Intensive 30 Days", description: "30 days of intensive access", price: 1499, durationValue: 30, durationType: "day" },
];

const classes = [
  { name: "Mathematics 101", description: "Algebra and geometry basics", status: "active", notes: ["Welcome to the class!", "Homework 1 is due next week."] },
  { name: "Physics 101", description: "Mechanics and motion", status: "active", notes: ["Bring a calculator to the first session."] },
  { name: "Chemistry 101", description: "Atoms, bonds and reactions", status: "active", notes: ["Lab safety rules are in the PDF section."] },
  { name: "Biology 101", description: "Cells, genetics and ecosystems", status: "active", notes: ["Quiz on cell structure on Sunday."] },
  { name: "English Grammar", description: "Tenses, clauses and sentence structure", status: "active", notes: ["Practice worksheet uploaded."] },
  { name: "Arabic Literature", description: "Classical and modern Arabic texts", status: "active", notes: ["Read chapter 2 before the next lesson."] },
  { name: "Computer Science", description: "Programming fundamentals with JavaScript", status: "active", notes: ["Install Node.js before class."] },
  { name: "World History", description: "Ancient civilizations to the modern era", status: "pending", notes: ["Class starts next month."] },
  { name: "Geography", description: "Maps, climate and population", status: "active", notes: ["Atlas required."] },
  { name: "Art & Design", description: "Drawing, colour theory and composition", status: "pending", notes: ["Materials list coming soon."] },
];

// planIdx -> index in `plans`; classIdx -> indexes in `classes`
const students = [
  { name: "Ahmed Hassan", email: "ahmed.hassan@example.com", phone: "01000000001", planIdx: 0, expiresInDays: 20, classIdx: [0, 1] },
  { name: "Sara Ali", email: "sara.ali@example.com", phone: "01000000002", planIdx: 1, expiresInDays: 60, classIdx: [0, 2, 3] },
  { name: "Omar Khaled", email: "omar.khaled@example.com", phone: "01000000003", planIdx: 2, expiresInDays: 300, classIdx: [1, 6, 8] },
  { name: "Mona Ibrahim", email: "mona.ibrahim@example.com", phone: "01000000004", planIdx: 4, expiresInDays: 120, classIdx: [4, 5] },
  { name: "Youssef Mahmoud", email: "youssef.mahmoud@example.com", phone: "01000000005", planIdx: 3, expiresInDays: 5, classIdx: [6], warning7Sent: true },
  { name: "Laila Samir", email: "laila.samir@example.com", phone: "01000000006", planIdx: 5, expiresInDays: 12, classIdx: [2, 3, 8] },
  { name: "Khaled Nabil", email: "khaled.nabil@example.com", phone: "01000000007", planIdx: 1, expiresInDays: 1, classIdx: [0, 6], warning7Sent: true, warning1Sent: true },
  { name: "Nour Adel", email: "nour.adel@example.com", phone: "01000000008", planIdx: 2, expiresInDays: 200, classIdx: [4, 5, 8] },
  // expired subscriptions (status flips to pending at login)
  { name: "Hana Tarek", email: "hana.tarek@example.com", phone: "01000000009", planIdx: 0, expiresInDays: -10, status: "pending", classIdx: [0] },
  { name: "Mostafa Fathy", email: "mostafa.fathy@example.com", phone: "01000000010", planIdx: 3, expiresInDays: -3, status: "pending", classIdx: [1] },
];

const pendingAccounts = [
  { name: "Reem Gamal", email: "reem.gamal@example.com", phone: "01100000001", planIdx: 0 },
  { name: "Tamer Wael", email: "tamer.wael@example.com", phone: "01100000002", planIdx: 1 },
  { name: "Dina Fouad", email: "dina.fouad@example.com", phone: "01100000003", planIdx: 2 },
  { name: "Ziad Magdy", email: "ziad.magdy@example.com", phone: "01100000004", planIdx: 4 },
];

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

// Plans
const planDocs = [];
for (const p of plans) planDocs.push((await Plan.findOne({ title: p.title })) || (await Plan.create(p)));
console.log(`Plans: ${planDocs.length}`);

// Classes
const classDocs = [];
for (const c of classes) {
  let doc = await Class.findOne({ name: c.name });
  if (!doc) doc = await Class.create({ ...c, notes: c.notes.map((msg) => ({ msg })) });
  classDocs.push(doc);
}
console.log(`Classes: ${classDocs.length}`);

// Students + enrolment + succeeded transactions
const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
let createdStudents = 0;
let createdTx = 0;
for (const s of students) {
  const plan = planDocs[s.planIdx];
  const classIds = s.classIdx.map((i) => classDocs[i]._id);
  let user = await User.findOne({ email: s.email });
  if (!user) {
    user = await User.create({
      name: s.name,
      email: s.email,
      phone: s.phone,
      password: hashed,
      plan: plan._id,
      status: s.status || "active",
      expiresAt: daysFromNow(s.expiresInDays),
      classes: classIds,
      warning7Sent: !!s.warning7Sent,
      warning1Sent: !!s.warning1Sent,
    });
    createdStudents++;
  }
  await Class.updateMany({ _id: { $in: classIds } }, { $addToSet: { students: user._id } });

  const sessionId = `cs_seed_${s.email}`;
  if (!(await Transaction.findOne({ stripeSessionId: sessionId }))) {
    await Transaction.create({
      user: user._id,
      stripeSessionId: sessionId,
      stripePaymentId: `pi_seed_${s.email}`,
      amount: plan.price,
      status: "succeeded",
      plan: plan._id,
      createdAt: daysFromNow(-Math.floor(Math.random() * 25) - 1),
    });
    createdTx++;
  }
}
console.log(`Students: ${students.length} (new: ${createdStudents})`);

// Pending accounts + pending / failed transactions
let createdPending = 0;
for (const [i, p] of pendingAccounts.entries()) {
  const plan = planDocs[p.planIdx];
  let pending = await PendingUser.findOne({ email: p.email });
  const sessionId = `cs_seed_pending_${p.email}`;
  if (!pending) {
    pending = await PendingUser.create({
      name: p.name,
      email: p.email,
      phone: p.phone,
      password: hashed,
      planId: plan._id,
      checkoutUrl: `https://checkout.stripe.com/c/pay/${sessionId}`,
    });
    createdPending++;
  }
  if (!(await Transaction.findOne({ stripeSessionId: sessionId }))) {
    await Transaction.create({
      pendingUser: pending._id,
      stripeSessionId: sessionId,
      amount: plan.price,
      status: i === pendingAccounts.length - 1 ? "failed" : "pending",
      plan: plan._id,
      checkoutUrl: pending.checkoutUrl,
    });
    createdTx++;
  }
}
console.log(`Pending accounts: ${pendingAccounts.length} (new: ${createdPending})`);
console.log(`New transactions: ${createdTx}`);
console.log(`Demo student/pending password: ${DEMO_PASSWORD}`);

await mongoose.disconnect();
console.log("Seed-more complete");
