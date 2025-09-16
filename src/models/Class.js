import mongoose from "mongoose";


const pdfSchema = new mongoose.Schema({
    public_id: { type: String, required: true }, // Cloudinary public ID
    url: { type: String, required: true },       // Cloudinary secure URL
    name: { type: String, required: true },      // PDF name
    description: { type: String },               // Short description
    addedAt: { type: Date, default: Date.now },  // Date of upload
});

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    videos: [{ type: String }], // video URLs
    pdfs: [pdfSchema],   // pdf URLs
    tasks: [{ type: String }],  // task descriptions
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "pending"], default: "pending" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // assigned students
    notes: [
        {
            msg: { type: String },
            createdAt: { type: Date, default: Date.now },
        }
    ]
});

export default mongoose.model("Class", classSchema);
