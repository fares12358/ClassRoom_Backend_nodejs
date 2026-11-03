import cron from "node-cron";
import Users from "../models/Users.js";
import Transaction from "../models/Transaction.js";
import Class from "../models/Class.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * Expired-account cleanup.
 *
 * Timeline is measured from the subscription EXPIRY (`expiresAt`), not signup:
 *   expiry + 38 days  -> "7 days left" warning
 *   expiry + 44 days  -> "1 day left" warning
 *   expiry + 45 days  -> account, transactions and submissions deleted
 *
 * Opt-in: started from server.js only when ENABLE_CRON=true. node-cron needs a
 * long-running process, so this does nothing useful on Vercel serverless
 * (use a Vercel Cron hitting a protected route that calls cleanExpiredUsers).
 * Set CLEANUP_DRY_RUN=true to log what would happen without emailing/deleting.
 */

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const safeEmail = async (to, subject, text) => {
  try {
    await sendEmail(to, subject, `<p>${text}</p>`);
  } catch (err) {
    console.error("Cleanup email failed:", err.message);
  }
};

export const cleanExpiredUsers = async ({ dryRun = process.env.CLEANUP_DRY_RUN === "true" } = {}) => {
  const summary = { warned7: 0, warned1: 0, deleted: 0 };
  try {
    // Only accounts whose subscription actually has an expiry date and has lapsed
    const users = await Users.find({ expiresAt: { $ne: null, $lte: daysAgo(38) } });

    for (const user of users) {
      const expiredFor45 = user.expiresAt <= daysAgo(45);
      const expiredFor44 = user.expiresAt <= daysAgo(44);

      if (expiredFor45) {
        if (dryRun) { console.log("[dry-run] would delete", user.email); summary.deleted++; continue; }

        const userId = user._id;
        await Transaction.deleteMany({ user: userId });
        await Class.updateMany(
          { students: userId },
          {
            $pull: {
              students: userId,
              "tasks.$[].submissions": { student: userId },
              "pdfs.$[].submissions": { student: userId },
            },
          }
        );
        await Users.deleteOne({ _id: userId });
        await safeEmail(user.email, "Account Deleted", "Your account and all your data have been deleted.");
        summary.deleted++;
        continue;
      }

      if (expiredFor44 && !user.warning1Sent) {
        if (!dryRun) {
          await safeEmail(user.email, "Final Account Deletion Warning", "Your account and all data will be deleted tomorrow. Renew your subscription to keep it.");
          user.warning1Sent = true;
          await user.save();
        }
        summary.warned1++;
      } else if (!user.warning7Sent) {
        if (!dryRun) {
          await safeEmail(user.email, "Account Deletion Warning", "Your account and all data will be deleted in 7 days. Renew your subscription to keep it.");
          user.warning7Sent = true;
          await user.save();
        }
        summary.warned7++;
      }
    }
  } catch (err) {
    console.error("Error in cleanup process:", err);
  }
  return summary;
};

export const startCleanupJob = () => {
  cron.schedule("0 0 * * *", () => cleanExpiredUsers());
  console.log("🧹 Expired-account cleanup scheduled (daily 00:00)");
};
