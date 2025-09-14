import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    videos: [{ type: String }], // video URLs
    pdfs: [{ type: String }],   // pdf URLs
    tasks: [{ type: String }],  // task descriptions
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "pending"], default: "pending" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] // assigned students
});

export default mongoose.model("Class", classSchema);
