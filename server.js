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
app.use(express.json());
app.use(cookieParser());

// ✅ Allow local + deployed frontends
const allowedOrigins = [
  "https://govt-complaint-management-system-fr.vercel.app", // frontend
  `https://${process.env.VERCEL_URL}`
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // mobile apps or server requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle all OPTIONS preflight requests
app.options(/.*/, cors()); // ✅ match all routes using regex
// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // Ensure Super Admin exists
    const superAdmin = await User.findOne({ email: "superadmin@example.com" });
    if (!superAdmin) {
      const defaultAdmin = new User({
        name: "Super Admin",
        email: "superadmin@example.com",
        password: "super123",
        role: "super_admin"
      });
      await defaultAdmin.save();
      console.log("✅ Default Super_Admin created");
    } else {
      console.log("Super_Admin already exists");
    }
  })
  .catch(err => console.error("MongoDB error:", err.message));

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
