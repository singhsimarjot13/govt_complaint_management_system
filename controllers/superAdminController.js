import User from "../models/User.js";
import MLA from "../models/mla.js"
import MC_Admin from "../models/mc_admins.js"

// Dashboard
export const getDashboard = (req, res) => {
  res.json({ message: `Welcome Super Admin: ${req.user.role}` });
};

// ---------------- MLA ---------------- //

export const createMLA = async (req, res) => {
  try {
    const { name, email, constituency_location, password, wards } = req.body;

    // Step 1: User entry (for login)
    const newUser = new User({
      name,
      email,
      password,
      role: "mla",
    });
    await newUser.save();

    // Step 2: MLA entry (reference by email)
    const mla = new MLA({
      name,
      email,
      constituency_location,
      wards: wards || []
    });
    await mla.save();

    res.status(201).json({ message: "MLA created successfully", mla });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const updateMLA = async (req, res) => {
  try {
    const { id } = req.params; // id = User._id
    const updateFields = req.body;

    // 1️⃣ Update User collection
    const updatedUser = await User.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "MLA (User) not found" });

    // 2️⃣ Update MLA collection (email-based reference)
    const updatedMLA = await MLA.findOneAndUpdate(
      { email: updatedUser.email },
      updateFields,
      { new: true }
    );

    res.json({
      message: "MLA updated successfully",
      user: updatedUser,
      mla: updatedMLA
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const deleteMLA = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Delete from User collection
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "MLA not found" });

    // 2️⃣ Delete from MLA collection (email-based link)
    await MLA.findOneAndDelete({ email: user.email });

    res.json({ message: "MLA deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const getMLAs = async (req, res) => {
  try {
    // 1️⃣ Find all users with role MLA
    const users = await User.find({ role: "mla" }).select("-password");

    // 2️⃣ Join MLA-specific info by email
    const mlas = await Promise.all(
      users.map(async (user) => {
        const mlaInfo = await MLA.findOne({ email: user.email }).populate('wards');
        return {
          ...user.toObject(),
          constituency_location: mlaInfo?.constituency_location || null,
          wards: mlaInfo?.wards || []
        };
      })
    );

    res.json(mlas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ---------------- MC Admin ---------------- //
export const createMC = async (req, res) => {
  try {
    const { name, email, city, password } = req.body;

    // 1️⃣ User collection
    const newUser = new User({
      name,
      email,
      password,
      role: "mc_admin",
    });
    await newUser.save();
    const id=await User.findOne({email:email});
    // 2️⃣ MC_Admin collection (specific info)
    const mcAdmin = new MC_Admin({
      name,
      email,   // reference by email
      city,
      user_id: id._id,
    });
    await mcAdmin.save();

    res.status(201).json({ message: "MC Admin created successfully", mcAdmin });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const updateMC = async (req, res) => {
  try {
    const { id } = req.params; // User._id
    const updateFields = req.body;

    // Update User collection
    const updatedUser = await User.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "MC Admin (User) not found" });

    // Update MC_Admin collection
    const updatedMC = await MC_Admin.findOneAndUpdate(
      { email: updatedUser.email },
      updateFields,
      { new: true }
    );

    res.json({ message: "MC Admin updated successfully", user: updatedUser, mcAdmin: updatedMC });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const deleteMC = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "MC Admin not found" });

    await MC_Admin.findOneAndDelete({ email: user.email });

    res.json({ message: "MC Admin deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const getMCs = async (req, res) => {
  try {
    const users = await User.find({ role: "mc_admin" }).select("-password");

    const mcAdmins = await Promise.all(
      users.map(async (user) => {
        const mcInfo = await MC_Admin.findOne({ email: user.email });
        return { ...user.toObject(), city: mcInfo?.city };
      })
    );

    res.json(mcAdmins);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
