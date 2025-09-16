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

// ✅ Get a single PDF (student safe)
export const getFilesClasses = async (req, res) => {
  try {
    const { classId, pdfId } = req.params;

    const classroom = await Class.findById(classId);
    if (!classroom) return res.status(404).json({ message: "Class not found" });

    const pdf = classroom.pdfs.id(pdfId);
    if (!pdf) return res.status(404).json({ message: "PDF not found" });

    // Short-lived signed URL (5 min)
    const signedUrl = cloudinary.url(pdf.public_id, {
      resource_type: "raw",
      type: "private",
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60
    });

    res.json({
      _id: pdf._id,
      name: pdf.name,
      description: pdf.description,
      addedAt: pdf.addedAt,
      viewUrl: `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get all PDFs (student safe)
export const getAllFilesClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classroom = await Class.findById(classId);
    if (!classroom) return res.status(404).json({ message: "Class not found" });

    // Generate signed URLs for each PDF
    const pdfs = classroom.pdfs.map((pdf) => {
      const signedUrl = cloudinary.url(pdf.public_id, {
        resource_type: "raw",
        type: "private",
        sign_url: true,
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60
      });

      return {
        _id: pdf._id,
        name: pdf.name,
        description: pdf.description,
        addedAt: pdf.addedAt,
        viewUrl: `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`
      };
    });

    res.json({ pdfs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
