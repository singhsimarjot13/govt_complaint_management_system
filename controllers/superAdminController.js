import User from "../models/User.js";
import MLA from "../models/mla.js";
import MC_Admin from "../models/mc_admins.js";
import Issue from "../models/issues.js";
import Department from "../models/dept.js";
import Worker from "../models/workers.js";
import Ward from "../models/ward.js";
import Councillor from "../models/Councillors.js";

// Dashboard
export const getDashboard = async (req, res) => {
  try {
    // Sequential aggregation to avoid Promise.all
    const totalIssues = await Issue.countDocuments({});
    const resolvedIssues = await Issue.countDocuments({ status: { $in: ["verified_resolved", "resolved"] } });
    const totalDepartments = await Department.countDocuments({});
    const activeWorkers = await Worker.countDocuments({});

    res.json({
      totalIssues,
      resolvedIssues,
      totalDepartments,
      activeWorkers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public district-wise stats for heatmap
export const getDistrictStats = async (req, res) => {
  try {
    const mcAdmins = await MC_Admin.find({});
    const results = [];

    for (const mc of mcAdmins) {
      // Fetch councillors for this MC admin
      const councillors = await Councillor.find({ mc_admin_id: mc.user_id });
      const wardIds = councillors.map(c => c.ward_id).filter(Boolean);

      let total = 0;
      let resolved = 0;
      let verified = 0;
      let pending = 0;

      if (wardIds.length > 0) {
        total = await Issue.countDocuments({ ward_id: { $in: wardIds } });
        resolved = await Issue.countDocuments({ 
          ward_id: { $in: wardIds },
          status: { $in: ["verified_resolved", "resolved"] } 
        });
        verified = await Issue.countDocuments({ 
          ward_id: { $in: wardIds },
          status: "verified_by_councillor" 
        });
        pending = Math.max(total - resolved, 0);
      }

      results.push({
        district: mc.city,
        mcAdmin: mc.name,
        total,
        resolved,
        pending,
        verified
      });
    }

    res.json({ districts: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leaderboards
export const getCitizenLeaderboard = async (req, res) => {
  try {
    // Top citizens by number of issues verified by councillors
    const issues = await Issue.aggregate([
      { $match: { status: "verified_by_councillor" } },
      { $group: { _id: "$user_id", verifiedCount: { $sum: 1 } } },
      { $sort: { verifiedCount: -1 } },
      { $limit: 20 }
    ]);

    const results = [];
    for (const it of issues) {
      const user = await User.findById(it._id).select("name email");
      if (user) {
        results.push({
          rank: results.length + 1,
          userId: user._id,
          name: user.name || user.email,
          city: "",
          verifiedCount: it.verifiedCount,
        });
      }
    }
    res.json({ citizens: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMCAdminLeaderboard = async (req, res) => {
  try {
    // Use district stats computed above
    const { districts } = await (async () => {
      const mcAdmins = await MC_Admin.find({});
      const results = [];
      for (const mc of mcAdmins) {
        const councillors = await Councillor.find({ mc_admin_id: mc.user_id });
        const wardIds = councillors.map((c) => c.ward_id).filter(Boolean);
        let total = 0, resolved = 0;
        if (wardIds.length > 0) {
          total = await Issue.countDocuments({ ward_id: { $in: wardIds } });
          resolved = await Issue.countDocuments({ ward_id: { $in: wardIds }, status: { $in: ["verified_resolved", "resolved"] } });
        }
        const efficiency = total > 0 ? Math.round((resolved / total) * 100) : 0;
        results.push({ district: mc.city, mcAdmin: mc.name, resolvedCount: resolved, total, efficiency });
      }
      // sort here
      results.sort((a, b) => b.resolvedCount - a.resolvedCount);
      // add rank
      results.forEach((r, i) => r.rank = i + 1);
      return { districts: results };
    })();
    res.json({ mcAdmins: districts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWardLeaderboard = async (req, res) => {
  try {
    // Top wards by resolved issues
    const issues = await Issue.aggregate([
      { $match: { ward_id: { $ne: null } } },
      { $group: {
          _id: {
            ward: "$ward_id",
            resolved: { $in: ["$status", ["verified_resolved", "resolved"]] }
          },
          total: { $sum: 1 },
          // note: aggregation for resolved will be recomputed per ward below for clarity
        }
      }
    ]);

    // Simpler: compute per ward sequentially
    const wards = await Ward.find({});
    const results = [];
    for (const w of wards) {
      const total = await Issue.countDocuments({ ward_id: w._id });
      const resolved = await Issue.countDocuments({ ward_id: w._id, status: { $in: ["verified_resolved", "resolved"] } });
      const efficiency = total > 0 ? Math.round((resolved / total) * 100) : 0;
      results.push({ rank: 0, ward: w.ward_name, city: "", resolvedCount: resolved, total, efficiency });
    }
    results.sort((a, b) => b.resolvedCount - a.resolvedCount);
    results.forEach((r, i) => r.rank = i + 1);
    res.json({ wards: results.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
