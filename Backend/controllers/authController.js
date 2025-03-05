const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// User Signup
exports.registerUser = async (req, res) => {
  const { fullName, email, password, age } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ fullName, email, password: hashedPassword, age });

    await user.save();
    res.status(201).json({ 
      _id: user._id, 
      fullName: user.fullName, 
      email: user.email, 
      token: generateToken(user._id) 
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// User Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate("chats");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Return user data + JWT token
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      chats: user.chats,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

