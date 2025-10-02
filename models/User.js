import mongoose from "mongoose";
import crypto from "crypto";

const ENCRYPTION_KEY = "32charslongsecretkey1234567890ab"; // 32 chars
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = parts.join(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    verified: { type: Boolean, default: false },
    ward_id: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      default: null 
    },
    location: { type: String, trim: true, default: "" },

    // Role-based addition
    role: {
      type: String,
      enum: ["citizen", "super_admin", "mla", "mc_admin", "councillor", "department_admin", "worker"],
      default: "citizen",  // default role
      required: true
    },
  },
  { timestamps: true }
);

// Encrypt password before save
userSchema.pre("save", function(next){
  if(this.isModified("password")){
    this.password = encrypt(this.password);
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = function(inputPassword){
  const decrypted = decrypt(this.password);
  return inputPassword === decrypted;
}

export default mongoose.model("User", userSchema);
