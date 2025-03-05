const mongoose = require("mongoose");
const Chat = require("./Chat"); // <-- Import the Chat Model

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }]
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
