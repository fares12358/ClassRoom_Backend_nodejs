/**
 * seed.js  ─  npm run seed
 *
 * Seeds:
 *  • 4 Plans
 *  • 5 Classes  (active, each with 4 videos + 4 PDFs + 4 tasks + 3 notes)
 *  • 25 Students (5 per class, each with a plan & expiry, status: active)
 *  • 25 Transactions (1 per student, status: succeeded)
 *  • 5  PendingUsers  (with fake checkoutUrls)
 *
 * Admin data is left untouched.
 * Run:  npm run seed
 */

import dotenv from "dotenv";
import { resolve } from "path";

// ── Load .env from the same directory as seed.js (backend/) ──────
dotenv.config({ path: resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import bcrypt   from "bcrypt";

/* ── models ─────────────────────────────────────────────────────── */
import Plan        from "./src/models/Plan.js";
import Class       from "./src/models/Class.js";
import Users       from "./src/models/Users.js";
import Transaction from "./src/models/Transaction.js";
import PendingUser from "./src/models/PendingUser.js";

/* ══════════════════════════════════════════════════════════════════
   FAKE DATA POOLS
══════════════════════════════════════════════════════════════════ */

const YT_IDS = [
  "dQw4w9WgXcQ", "9bZkp7q19f0", "kJQP7kiw5Fk", "RgKAFK5djSk",
  "OPf0YbXqDm0", "JGwWNGJdvx8", "CevxZvSJLk8", "2Vv-BfVoq4g",
  "fJ9rUzIMcZQ", "hT_nvWreIhg", "09R8_2nJtjg", "3JZ_D3ELwOQ",
  "pRpeEdMmmQ0", "7PCkvCPvDXk", "bo_efYLyQKU", "YQHsXMglC9A",
  "e-ORhEE9VVg", "lp-EO5I60KA", "5NV6Rdv1h3Q", "M7lc1UVf-VE",
];

const PDF_BASE = "https://res.cloudinary.com/demo/raw/upload/v1/samples/";
const FAKE_PDFS = [
  { url: PDF_BASE + "algebra-ch1.pdf",      public_id: "samples/algebra-ch1" },
  { url: PDF_BASE + "geometry-ch2.pdf",     public_id: "samples/geometry-ch2" },
  { url: PDF_BASE + "physics-waves.pdf",    public_id: "samples/physics-waves" },
  { url: PDF_BASE + "chemistry-atoms.pdf",  public_id: "samples/chemistry-atoms" },
  { url: PDF_BASE + "history-ww2.pdf",      public_id: "samples/history-ww2" },
  { url: PDF_BASE + "biology-cells.pdf",    public_id: "samples/biology-cells" },
  { url: PDF_BASE + "english-grammar.pdf",  public_id: "samples/english-grammar" },
  { url: PDF_BASE + "arabic-syntax.pdf",    public_id: "samples/arabic-syntax" },
  { url: PDF_BASE + "math-calculus.pdf",    public_id: "samples/math-calculus" },
  { url: PDF_BASE + "science-quiz.pdf",     public_id: "samples/science-quiz" },
];

const ARABIC_NAMES = [
  "أحمد محمد",   "فاطمة علي",    "محمد إبراهيم", "سارة حسن",    "عمر خالد",
  "نور الدين",   "ياسمين سمير",  "كريم عادل",    "رنا طارق",    "مصطفى جمال",
  "لينا وليد",   "حسام فريد",    "دينا أشرف",    "زياد مجدي",   "منى سعيد",
  "أسامة رامي",  "هالة صالح",    "تامر عبدالله", "إيمان يوسف",  "شادي حاتم",
  "ريم ماهر",    "باسم كمال",    "نادية عمرو",   "وائل سليم",   "هبة منصور",
];

const CLASS_NAMES = [
  "رياضيات - المستوى المتقدم",
  "فيزياء - الميكانيكا الكلاسيكية",
  "لغة عربية - النحو والصرف",
  "لغة إنجليزية - المحادثة والكتابة",
  "أحياء - علم الخلية والوراثة",
];

const CLASS_DESCS = [
  "كورس شامل لمادة الرياضيات يغطي جميع مواضيع المستوى المتقدم من المعادلات التفاضلية والتكاملية.",
  "دراسة متعمقة لقوانين نيوتن وتطبيقاتها في حل المسائل الفيزيائية المعقدة.",
  "تحليل دقيق لقواعد اللغة العربية مع تطبيقات عملية وتدريبات متنوعة.",
  "تنمية مهارات المحادثة والكتابة باللغة الإنجليزية من خلال حوارات تفاعلية.",
  "رحلة علمية في عالم الخلية والجينات والوراثة مع أحدث الأبحاث.",
];

const VIDEO_NAMES = [
  "المقدمة والأساسيات",       "الدرس الأول - الفهم العام",
  "تطبيقات عملية",            "مراجعة شاملة",
  "أسئلة وأجوبة تفاعلية",     "الوحدة الثانية",
  "تمارين محلولة",            "امتحان تجريبي",
  "ملخص الفصل الدراسي",       "الدرس الختامي",
];

const PDF_NAMES = [
  "ملخص الوحدة الأولى",   "تمارين الفصل",
  "الاختبار القصير",       "مراجعة نهاية الفصل",
  "ورقة عمل إضافية",       "ملخص المنهج",
  "مسائل محلولة",          "أسئلة الامتحان السابق",
];

const TASK_NAMES = [
  "واجب الوحدة الأولى",   "مشروع البحث",
  "تقرير أسبوعي",          "اختبار تكويني",
  "حل مسائل الكتاب",       "تلخيص الدرس",
  "عرض تقديمي",            "ورقة إجابات",
];

const NOTES_POOL = [
  "الدرس القادم سيتم مناقشة الباب الثالث",
  "تذكروا موعد تسليم الواجب يوم الخميس",
  "يرجى مراجعة الملاحظات السابقة قبل الحضور",
  "تم تغيير موعد الاختبار إلى الأسبوع القادم",
  "مبروك للطلاب المتميزين في آخر اختبار",
  "رابط المادة الإضافية موجود في المجموعة",
];

/* ── helpers ─────────────────────────────────────────────────────── */
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const rInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (d) => { const t = new Date(); t.setDate(t.getDate() - d); return t; };

const makeVideos = (count = 4) =>
  pickN(YT_IDS, count).map((id, i) => ({
    videoId:     id,
    name:        VIDEO_NAMES[i % VIDEO_NAMES.length],
    description: `شرح تفصيلي للجزء ${i + 1} من المادة الدراسية`,
    uploadedAt:  daysAgo(rInt(1, 60)),
  }));

const makePdfs = (count = 4) =>
  pickN(FAKE_PDFS, count).map((p, i) => ({
    public_id:   p.public_id,
    url:         p.url,
    name:        PDF_NAMES[i % PDF_NAMES.length],
    description: `ملف PDF رقم ${i + 1} - مادة دراسية`,
    addedAt:     daysAgo(rInt(1, 45)),
    submissions: [],
  }));

const makeTasks = (count = 4) =>
  pickN(FAKE_PDFS, count).map((p, i) => ({
    public_id:   p.public_id.replace("samples/", "tasks/"),
    url:         p.url.replace("samples/", "tasks/"),
    name:        TASK_NAMES[i % TASK_NAMES.length],
    description: `واجب دراسي رقم ${i + 1} يُرجى الحل وإرساله قبل الموعد المحدد`,
    addedAt:     daysAgo(rInt(1, 30)),
    submissions: [],
  }));

const makeNotes = (count = 3) =>
  pickN(NOTES_POOL, count).map(msg => ({
    msg,
    createdAt: daysAgo(rInt(0, 20)),
  }));

/* ══════════════════════════════════════════════════════════════════
   MAIN SEED
══════════════════════════════════════════════════════════════════ */
async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌  MONGO_URI is not defined in .env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB\n");

  /* ── Clear seed collections (Admin left untouched) ────────── */
  await Promise.all([
    Plan.deleteMany({}),
    Class.deleteMany({}),
    Users.deleteMany({}),
    Transaction.deleteMany({}),
    PendingUser.deleteMany({}),
  ]);
  console.log("🗑️  Cleared old seed data");

  /* ════════════════════════════════════════════════════════════
     1. PLANS
  ════════════════════════════════════════════════════════════ */
  const planDefs = [
    { title: "الخطة الأسبوعية",  description: "اشتراك أسبوعي تجريبي",         price: 999,   durationValue: 1, durationType: "week"  },
    { title: "الخطة الشهرية",    description: "اشتراك شهري بسعر مناسب",        price: 4999,  durationValue: 1, durationType: "month" },
    { title: "الخطة الفصلية",    description: "اشتراك لمدة ثلاثة أشهر",        price: 12999, durationValue: 3, durationType: "month" },
    { title: "الخطة السنوية",    description: "اشتراك سنوي بخصم 30%",          price: 39999, durationValue: 1, durationType: "year"  },
  ];
  const plans = await Plan.insertMany(planDefs);
  console.log(`📋 Created ${plans.length} plans`);

  /* ════════════════════════════════════════════════════════════
     2. CLASSES
  ════════════════════════════════════════════════════════════ */
  const classDocs = CLASS_NAMES.map((name, i) => ({
    name,
    description: CLASS_DESCS[i],
    status:      "active",
    videos:      makeVideos(4),
    pdfs:        makePdfs(4),
    tasks:       makeTasks(4),
    notes:       makeNotes(3),
    createdAt:   daysAgo(rInt(30, 180)),
    students:    [],
  }));
  const classes = await Class.insertMany(classDocs);
  console.log(`🏫 Created ${classes.length} classes`);

  /* ════════════════════════════════════════════════════════════
     3. STUDENTS + 4. TRANSACTIONS
  ════════════════════════════════════════════════════════════ */
  const hashedPw   = await bcrypt.hash("Student@123", 10);
  const allStudents = [];
  const txDocs     = [];

  for (let ci = 0; ci < classes.length; ci++) {
    const cls        = classes[ci];
    const studentIds = [];

    for (let si = 0; si < 5; si++) {
      const nameIdx   = ci * 5 + si;
      const plan      = pick(plans);

      /* expiry based on plan duration */
      const msPerUnit = {
        week:  7   * 864e5,
        month: 30  * 864e5,
        year:  365 * 864e5,
        day:   1   * 864e5,
      };
      const joinedAt  = daysAgo(rInt(10, 120));
      const expiresAt = new Date(joinedAt.getTime() + plan.durationValue * msPerUnit[plan.durationType]);

      const student = new Users({
        name:      ARABIC_NAMES[nameIdx],
        email:     `student${nameIdx + 1}@classroom.demo`,
        phone:     `+20100${rInt(1000000, 9999999)}`,
        password:  hashedPw,
        plan:      plan._id,
        status:    "active",
        expiresAt,
        createdAt: joinedAt,
        classes:   [cls._id],
      });
      await student.save();
      studentIds.push(student._id);

      /* build transaction for this student */
      txDocs.push({
        user:            student._id,
        pendingUser:     null,
        stripeSessionId: `cs_test_seed_${student._id}`,
        stripePaymentId: `pi_seed_${Math.random().toString(36).slice(2, 14)}`,
        amount:          plan.price,
        currency:        "usd",
        status:          "succeeded",
        plan:            plan._id,
        checkoutUrl:     `https://checkout.stripe.com/pay/cs_test_seed_${student._id}`,
        createdAt:       joinedAt,
      });

      allStudents.push(student);
    }

    await Class.findByIdAndUpdate(cls._id, { $set: { students: studentIds } });
  }
  console.log(`👩‍🎓 Created ${allStudents.length} students`);

  await Transaction.insertMany(txDocs);
  console.log(`💳 Created ${txDocs.length} transactions`);

  /* ════════════════════════════════════════════════════════════
     5. PENDING USERS
  ════════════════════════════════════════════════════════════ */
  const pendingNames = ["ريم حسن", "ماجد عبدالرحمن", "سلمى نور", "يوسف كريم", "أميرة سعد"];

  const pendingDocs = pendingNames.map((name, i) => ({
    name,
    email:       `pending${i + 1}@classroom.demo`,
    phone:       `+20111${rInt(1000000, 9999999)}`,
    password:    hashedPw,
    planId:      plans[i % plans.length]._id,
    status:      "pending",
    checkoutUrl: `https://checkout.stripe.com/pay/cs_pending_seed_${i + 1}_${Date.now()}`,
    createdAt:   new Date(),
  }));
  await PendingUser.insertMany(pendingDocs);
  console.log(`⏳ Created ${pendingDocs.length} pending users`);

  /* ── Summary ─────────────────────────────────────────────── */
  console.log("\n✅ SEED COMPLETE");
  console.log("─────────────────────────────────────────");
  console.log(`  Plans:         ${plans.length}`);
  console.log(`  Classes:       ${classes.length}`);
  console.log(`  Students:      ${allStudents.length}`);
  console.log(`  Transactions:  ${txDocs.length}`);
  console.log(`  Pending users: ${pendingDocs.length}`);
  console.log("─────────────────────────────────────────");
  console.log("  Student login:  student1@classroom.demo");
  console.log("  Password:       Student@123");
  console.log("─────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
