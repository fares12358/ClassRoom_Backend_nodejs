import Class from "../models/Class.js";
import { generateJoinCode } from "../utils/joinCode.js";

// POST /api/admin/classe/:id/join-code  — (re)generate a class's join code.
// Also used to create the first code for classes that predate join codes.
export const regenerateJoinCode = async (req, res) => {
  try {
    const classroom = await Class.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: "Class not found" });

    classroom.joinCode = generateJoinCode();
    await classroom.save();

    res.json({ message: "Join code regenerated", joinCode: classroom.joinCode });
  } catch (err) {
    console.error("regenerateJoinCode error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
