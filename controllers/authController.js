import User from "../models/User.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";
const JWT_EXPIRES = "1d";

export const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, role });
    if(!user) return res.status(401).json({ success:false, message:"Invalid credentials or role" });

    const isMatch = user.comparePassword(password);
    if(!isMatch) return res.status(401).json({ success:false, message:"Invalid password" });

    // create JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    // send token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,  
      secure: true,       // production -> true
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ success:true, message:"Login successful", id:user._id });

  } catch(err) {
    console.error(err);
    res.status(500).json({ success:false, message:"Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};


export const register = async (req, res) => {
  const { name, email, password, location, ward_id } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create new citizen user
    const newUser = new User({
      name,
      email,
      password,
      role: "citizen",
      location: location || "",
      ward_id: ward_id || null,
      verified: true // Auto-verify citizens for now
    });

    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: "User registered successfully" 
    });

  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};