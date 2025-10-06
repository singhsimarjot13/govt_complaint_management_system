import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import mcAdminRoutes from "./routes/mcAdminRoutes.js";
import mlaRoutes from "./routes/mlaRoutes.js";
import councillorRoutes from "./routes/councillorRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import citizenRoutes from "./routes/citizenRoutes.js";
import User from "./models/User.js";

dotenv.config(); // ✅ move to top before using env vars

const app = express();
app.use(cors({
  origin: [
  "https://govt-complaint-management-system-fr.vercel.app", // frontend
  `https://${process.env.VERCEL_URL}`
  ],
  credentials: true,
}));
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());


// ✅ Connect to MongoDB
let isMongoConnected = false;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
    isMongoConnected = true;
  })
  .catch(err => console.error("MongoDB error:", err.message));

// Function to create Super Admin if missing
async function ensureSuperAdmin() {
  if (!isMongoConnected) return; // wait for DB
  try {
    const existing = await User.findOne({ role: "super_admin" });
    if (!existing) {
      const admin = new User({
        name: "Super Admin",
        email: "superadmin@example.com",
        password: "super123",
        role: "super_admin"
      });
      await admin.save();
      console.log("✅ Default Super Admin created");
    }
  } catch (err) {
    console.error("Error creating Super Admin:", err.message);
  }
}

// Example middleware to ensure Super Admin exists on first request
app.use(async (req, res, next) => {
  await ensureSuperAdmin();
  next();
});

// ✅ Routes
app.get("/", (req, res) => res.send("Backend running on Vercel ✅"));
app.use("/api/auth", authRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/mc-admin", mcAdminRoutes);
app.use("/api/mla", mlaRoutes);
app.use("/api/councillor", councillorRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/citizen", citizenRoutes);

// ❌ Remove app.listen()
export default app; // ✅ Must export for Vercel
