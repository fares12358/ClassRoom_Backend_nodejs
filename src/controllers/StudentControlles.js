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
export const getStudentClasses = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    // Find the student and populate their classes (only _id and name)
    const student = await Users.findById(studentId)
      .populate("classes", "_id name")
      .select("classes");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Return the list of classes with ids and names
    res.json({
      classes: student.classes.map(c => ({
        id: c._id,
        name: c.name,
      })),
    });
  } catch (err) {
    console.error("Error fetching student classes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getStudentClasseNote = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    // Find the class by ID and select only the notes
    const classData = await Class.findById(classId).select("notes name");

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Return notes with class name
    res.json({
      classId: classData._id,
      className: classData.name,
      notes: classData.notes.map(note => ({
        msg: note.msg,
        createdAt: note.createdAt,
      })),
    });
  } catch (err) {
    console.error("Error fetching class notes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
        description: file.description
      };
    });

    return res.json({ files });
  } catch (err) {
    console.error("Error getting all files:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTaskForStudent = async (req, res) => {
  try {
    const { classId, taskId } = req.params;

    const classroom = await Class.findById(classId);
    if (!classroom) return res.status(404).json({ message: "Class not found" });

    const task = classroom.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const signedUrl = cloudinary.utils.private_download_url(
      task.public_id,
      "pdf",
      {
        resource_type: "raw",
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12h
      }
    );

    res.json({ url: signedUrl });
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ message: err.message });
  }
};
// ✅ Student: Get all Tasks (12h signed links)
export const getAllTasksForStudent = async (req, res) => {
  try {
    const { classId } = req.params;

    const classroom = await Class.findById(classId);
    if (!classroom) return res.status(404).json({ message: "Class not found" });

    const tasks = classroom.tasks.map((task) => {
      const signedUrl = cloudinary.utils.private_download_url(
        task.public_id,
        "pdf",
        {
          resource_type: "raw",
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12h
        }
      );

      return {
        _id: task._id,
        name: task.name,
        description: task.description,
        addedAt: task.addedAt,
        url: signedUrl,
      };
    });

    res.json({ tasks });
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Helper for signed video URL
function generateSignedVideoUrl(publicId) {
  return cloudinary.v2.url(publicId, {
    resource_type: "video",
    sign_url: true,
    type: "authenticated",
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 12 // 12h
  });
}
// ✅ Get all videos for a class (student)
export const getStudentVideos = async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ msg: "Class not found" });

    const videos = classDoc.videos.map(v => ({
      _id: v._id,
      name: v.name,
      description: v.description,
      signedUrl: generateSignedVideoUrl(v.public_id),
      addedAt: v.addedAt
    }));

    res.json(videos);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
// ✅ Get single video by ID (student)
export const getStudentVideoById = async (req, res) => {
  try {
    const { classId, videoId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ msg: "Class not found" });

    const video = classDoc.videos.id(videoId);
    if (!video) return res.status(404).json({ msg: "Video not found" });

    res.json({
      _id: video._id,
      name: video.name,
      description: video.description,
      signedUrl: generateSignedVideoUrl(video.public_id),
      addedAt: video.addedAt
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};