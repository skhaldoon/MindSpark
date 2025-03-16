const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patientName: { type: String, required: true }, // ✅ Store Patient Name
  patientAge: { type: String, required: true },  // ✅ Store Patient Age
  patientGender: { type: String },  // 
  messages: [
    {
      sender: { type: String, enum: ["user", "ai"], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Chat", ChatSchema);



