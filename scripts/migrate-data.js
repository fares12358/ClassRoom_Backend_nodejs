// Data maintenance / migrations. DRY RUN by default; pass --apply to write.
//
//   node scripts/migrate-data.js emails      lower-case + trim emails (Users, Admins, PendingUsers)
//   node scripts/migrate-data.js join-codes  give every class without a joinCode one
//   node scripts/migrate-data.js reconcile   report/repair Users.classes <-> Class.students mismatches
//
// RUN `emails` BEFORE (or right after) deploying the lowercase email schema:
// until then, accounts whose stored email has uppercase letters cannot log in.
import dotenv from "dotenv";
import mongoose from "mongoose";
import Users from "../src/models/Users.js";
import Admin from "../src/models/Admin.js";
import PendingUser from "../src/models/PendingUser.js";
import Class from "../src/models/Class.js";
import { generateJoinCode } from "../src/utils/joinCode.js";

dotenv.config();
const [, , task] = process.argv;
const apply = process.argv.includes("--apply");

if (!process.env.MONGO_URI || !["emails", "join-codes", "reconcile"].includes(task)) {
  console.error("Usage: node scripts/migrate-data.js <emails|join-codes|reconcile> [--apply]  (needs MONGO_URI)");
  process.exit(1);
}

const normalizeEmails = async () => {
  for (const [label, Model] of [["Users", Users], ["Admins", Admin], ["PendingUsers", PendingUser]]) {
    const col = Model.collection; // raw collection: bypasses the lowercase setter
    const docs = await col.find({}, { projection: { email: 1 } }).toArray();
    const seen = new Map();
    let changed = 0, collisions = 0;
    for (const d of docs) {
      const norm = String(d.email ?? "").trim().toLowerCase();
      if (seen.has(norm)) {
        collisions++;
        console.warn(`  [${label}] COLLISION: ${d._id} and ${seen.get(norm)} both normalize to "${norm}" — resolve manually`);
        continue;
      }
      seen.set(norm, d._id);
      if (norm !== d.email) {
        changed++;
        if (apply) await col.updateOne({ _id: d._id }, { $set: { email: norm } });
      }
    }
    console.log(`${label}: ${docs.length} docs, ${changed} ${apply ? "updated" : "would update"}, ${collisions} collisions`);
  }
};

const backfillJoinCodes = async () => {
  const classes = await Class.collection.find({ $or: [{ joinCode: { $exists: false } }, { joinCode: null }, { joinCode: "" }] }, { projection: { name: 1 } }).toArray();
  for (const c of classes) {
    const code = generateJoinCode();
    if (apply) await Class.collection.updateOne({ _id: c._id }, { $set: { joinCode: code } });
    console.log(`${apply ? "set" : "would set"} joinCode for "${c.name}" (${c._id})${apply ? ": " + code : ""}`);
  }
  console.log(`${classes.length} classes ${apply ? "updated" : "need a code"}`);
};

const reconcile = async () => {
  const classes = await Class.find({}, "students").lean();
  const users = await Users.find({}, "classes").lean();
  const classIds = new Set(classes.map((c) => String(c._id)));
  const userIds = new Set(users.map((u) => String(u._id)));
  const userClasses = new Map(users.map((u) => [String(u._id), new Set((u.classes || []).map(String))]));

  let fixes = 0;
  for (const c of classes) {
    const members = new Set((c.students || []).map(String));
    for (const sid of members) {
      if (!userIds.has(sid)) { // dangling student reference
        fixes++; console.log(`class ${c._id}: student ${sid} does not exist`);
        if (apply) await Class.updateOne({ _id: c._id }, { $pull: { students: sid } });
      } else if (!userClasses.get(sid).has(String(c._id))) {
        fixes++; console.log(`class ${c._id} lists ${sid} but the user does not list the class`);
        if (apply) await Users.updateOne({ _id: sid }, { $addToSet: { classes: c._id } });
      }
    }
  }
  for (const u of users) {
    for (const cid of u.classes || []) {
      const c = classes.find((x) => String(x._id) === String(cid));
      if (!classIds.has(String(cid))) {
        fixes++; console.log(`user ${u._id}: class ${cid} does not exist`);
        if (apply) await Users.updateOne({ _id: u._id }, { $pull: { classes: cid } });
      } else if (!(c.students || []).map(String).includes(String(u._id))) {
        fixes++; console.log(`user ${u._id} lists class ${cid} but the class does not list the user`);
        if (apply) await Class.updateOne({ _id: cid }, { $addToSet: { students: u._id } });
      }
    }
  }
  console.log(`${fixes} inconsistencies ${apply ? "repaired" : "found"}`);
};

await mongoose.connect(process.env.MONGO_URI);
console.log(`Task: ${task} (${apply ? "APPLY" : "dry run"})`);
await ({ emails: normalizeEmails, "join-codes": backfillJoinCodes, reconcile }[task])();
await mongoose.disconnect();
