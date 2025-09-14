import Class from "../models/Class.js";
import Users from "../models/Users.js";

export const joinClass = async (req, res) => {
  try {
    const { classId } = req.body;
    const studentId = req.user.id; // ✅ student logged-in (from auth middleware)

    const student = await Users.findById(studentId);
    const classObj = await Class.findById(classId);

    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Add class to student
    if (!student.classes.includes(classId)) {
      student.classes.push(classId);
      await student.save();
    }

    // Add student to class
    if (!classObj.students.includes(studentId)) {
      classObj.students.push(studentId);
      await classObj.save();
    }

    res.json({ message: "Successfully joined the class", class: classObj });
  } catch (error) {
    console.error("Error joining class:", error);
    res.status(500).json({ message: "Server error" });
  }
};
