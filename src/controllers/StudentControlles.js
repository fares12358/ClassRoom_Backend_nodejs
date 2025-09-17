import cloudinary from "../config/cloudinary.js";
import Class from "../models/Class.js";
import Users from "../models/Users.js";

export const joinClass = async (req, res) => {
  try {
    const { classId, studentId } = req.body;

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

// get single pdf (valid for 24h only)
export const getFilesClasses = async (req, res) => {
  try {
    const { classId, pdfId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const file = classData.pdfs.id(pdfId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Generate signed URL (valid for 24h)
    const expireTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours
    const secureUrl = cloudinary.url(file.public_id, {
      resource_type: "raw",
      type: "upload",
      secure: true,
      sign_url: true,
      expires_at: expireTime,
      transformation: [{ flags: "attachment:false" }], // prevent forced download
    });

    return res.json({ pdfUrl: secureUrl, name: file.name, expiresAt: expireTime });
  } catch (err) {
    console.error("Error getting file:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// get all pdfs for a class (24h signed URLs)
export const getAllFilesClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const expireTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours

    const files = classData.pdfs.map((file) => {
      const secureUrl = cloudinary.url(file.public_id, {
        resource_type: "raw",
        type: "upload",
        secure: true,
        sign_url: true,
        expires_at: expireTime,
        transformation: [{ flags: "attachment:false" }],
      });

      return {
        id: file._id,
        name: file.name,
        pdfUrl: secureUrl,
        expiresAt: expireTime,
      };
    });

    return res.json({ files });
  } catch (err) {
    console.error("Error getting all files:", err);
    res.status(500).json({ message: "Server error" });
  }
};