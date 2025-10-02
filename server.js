import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
// Import models to ensure they're registered with Mongoose
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import mcAdminRoutes from "./routes/mcAdminRoutes.js";
import mlaRoutes from "./routes/mlaRoutes.js";
import councillorRoutes from "./routes/councillorRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import citizenRoutes from "./routes/citizenRoutes.js";
import User from "./models/User.js";
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin:"http://localhost:5173", credentials:true }));

// Public & Auth routes
app.use("/api/auth", authRoutes);

// Role-based routes
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/mc-admin", mcAdminRoutes);
app.use("/api/mla", mlaRoutes);
app.use("/api/councillor", councillorRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/citizen", citizenRoutes);

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/govt_complaint")
.then(async () => {
  console.log("MongoDB connected");

  // Check if default Super_Admin exists
  const superAdmin = await User.findOne({ email: "superadmin@example.com" });
  if(!superAdmin){
    const defaultAdmin = new User({
      name: "Super Admin",
      email: "superadmin@example.com",
      password: "super123",
      role:"super_admin"
    });
    await defaultAdmin.save();
    console.log("Default Super_Admin created: email=superadmin@example.com, password=super123");
  } else {
    console.log("Super_Admin already exists");
  }
})
.catch(err => console.error(err));

app.listen(5000, ()=> console.log("Server running on http://localhost:5000"));
