import User from "../models/User.js";
import Ward from "../models/ward.js";
import Department from "../models/dept.js";
import Councillor from "../models/Councillors.js";
import Worker from "../models/workers.js";

// ----- Councillors -----
export const createCouncillor = async (req, res) => {
  try {
    const { name, email, ward_id, password } = req.body;
    const mc_admin_id = req.user.id; // Get MC Admin ID from auth middleware

    // 1. Create user account
    const newUser = new User({ 
      name, 
      email, 
      password, 
      role: "councillor",
      ward_id 
    });
    await newUser.save();

    // 2. Create councillor record
    const councillor = new Councillor({ 
      name, 
      email, 
      ward_id,
      mc_admin_id 
    });
    await councillor.save();

    // 3. Update ward with councillor_id
    await Ward.findByIdAndUpdate(ward_id, { councillor_id: councillor._id });

    res.status(201).json({ message: "Councillor created", councillor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateCouncillor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    const councillor = await User.findByIdAndUpdate(id, updateFields, { new: true });
    if (!councillor) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Councillor updated", councillor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteCouncillor = async (req, res) => {
  try {
    const { id } = req.params;
    const councillor = await User.findByIdAndDelete(id);
    if (!councillor) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Councillor deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getCouncillors = async (req, res) => {
  try {
    const councillors = await Councillor.find()
      .populate("ward_id", "ward_name")
      .populate("mc_admin_id", "name email");
    console.log("rawCouncillors:", councillors);

   res.json(councillors);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ----- Departments -----
export const createDepartment = async (req, res) => {
  try {
    const { name, admin_email, admin_password } = req.body;
    const mc_admin_id = req.user.id;

    // 1. Create department admin user
    const adminUser = new User({
      name: `${name} Admin`,
      email: admin_email,
      password: admin_password,
      role: "department_admin"
    });
    await adminUser.save();

    // 2. Create department
    const department = new Department({ 
      name, 
      mc_admin_id,
      admin_id: adminUser._id 
    });
    await department.save();

    res.status(201).json({ message: "Department created", department });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndUpdate(id, req.body, { new: true });
    if (!department) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Department updated", department });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndDelete(id);
    if (!department) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Department deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const mc_admin_id = req.user.id;
    const departments = await Department.find({ mc_admin_id })
      .populate("admin_id", "name email")
      .populate("mc_admin_id", "name email");
    res.json(departments);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ----- Wards -----
export const createWard = async (req, res) => {
  try {
    const ward = new Ward(req.body);
    await ward.save();
    res.status(201).json({ message: "Ward created", ward });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ward) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Ward updated", ward });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndDelete(req.params.id);
    if (!ward) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Ward deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getWards = async (req, res) => {
  try {
    const wards = await Ward.find(); // Fetch all wards
    console.log("Fetched wards:", wards); // Debug log
    
    // If no wards exist, create some sample ones (temporary solution)
    if (wards.length === 0) {
      console.log("No wards found, creating sample wards...");
      const sampleWards = [
        { ward_name: "Ward 1 - Central" },
        { ward_name: "Ward 2 - North" },
        { ward_name: "Ward 3 - South" },
        { ward_name: "Ward 4 - East" },
        { ward_name: "Ward 5 - West" }
      ];
      
      await Ward.insertMany(sampleWards);
      const newWards = await Ward.find();
      console.log("Created sample wards:", newWards);
      return res.json(newWards);
    }
    
    res.json(wards);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Get issues that need department assignment
export const getIssuesForAssignment = async (req, res) => {
  try {
    const mc_admin_id = req.user.id;
    
    // Get all issues that are verified by councillors (simplified since ward model is basic)
    const issues = await Issue.find({ 
      status: "in-progress"
    })
    .populate('user_id', 'name email')
    .populate('ward_id', 'ward_name') // Use ward_name instead of name
    .populate('current_department_id', 'name')
    .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Assign issue to department
export const assignIssueToDepartment = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { department_id } = req.body;
    
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Update issue with new department
    const previousDepartment = issue.current_department_id;
    issue.current_department_id = department_id;
    issue.current_worker_id = null; // Reset worker assignment
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      previous_department_id: previousDepartment,
      new_department_id: department_id,
      status: "Reassigned to Department"
    });
    await history.save();

    // Notify department admin
    const department = await Department.findById(department_id);
    if (department) {
      const notification = new Notification({
        issue_id,
        recipient_id: department.admin_id,
        recipient_model: "User",
        type: "Issue Assigned"
      });
      await notification.save();
    }

    res.json({ message: "Issue assigned to department", issue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
