import User from "../models/User.js";
import Ward from "../models/ward.js";
import Department from "../models/dept.js";
import Councillor from "../models/Councillors.js";
import Worker from "../models/workers.js";
import Issue from "../models/issues.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";
import MC_Admin from "../models/mc_admins.js";

// ----- Councillors -----
export const createCouncillor = async (req, res) => {
  try {
    const { name, email, ward_id, password } = req.body;
    const mc_admin_id = req.user.id; // Get MC Admin ID from auth middleware
    console.log("MC Admin ID:", mc_admin_id);
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
    const user_id= req.user.id;
    const mc_admin_id= await Councillor.find({})
    const departments = await Department.find({ mc_admin_id: user_id }); 
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


// Get all issues for MC Admin dashboard
export const getIssuesForAssignment = async (req, res) => {
  try {
    const mc_admin_id = req.user.id;

    // Get all issues to show status even if no actions are available
    const issues = await Issue.find({})
      .populate("user_id", "name email")
      .populate("ward_id", "ward_name")
      .populate("current_department_id", "name")
      .populate("verified_by_councillor_id", "name")
      .populate("current_worker_id", "name")
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
    const { department_id, notes } = req.body;
    const mc_admin_id = req.user.id;
    
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if issue is in correct status for department assignment
    if (issue.status !== "verified_by_councillor" && issue.status!=="reopened") {
      return res.status(400).json({ message: "Issue must be verified by councillor before department assignment" });
    }

    // Update issue with new department
    const previousDepartment = issue.current_department_id;
    issue.current_department_id = department_id;
    issue.current_worker_id = null; // Reset worker assignment
    issue.status = "assigned_to_department";
    issue.assigned_by_mc_admin_id = mc_admin_id;
    issue.assigned_to_department_at = new Date();
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      previous_department_id: previousDepartment,
      new_department_id: department_id,
      assigned_by_mc_admin_id: mc_admin_id,
      status: "assigned_to_department",
      action_type: "department_assigned",
      notes: notes || "Issue assigned to department by MC Admin"
    });
    await history.save();

    // Notify department admin
    const department = await Department.findById(department_id);
    if (department) {
      const notification = new Notification({
        issue_id,
        recipient_id: department.admin_id,
        recipient_model: "User",
        type: "Issue Assigned - Please assign worker"
      });
      await notification.save();
    }

    res.json({ 
      message: "Issue assigned to department", 
      issue,
      next_step: "Department Admin will assign worker"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Transfer issue to different department
export const transferIssueToDepartment = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { new_department_id, reason, notes } = req.body;
    const mc_admin_id = req.user.id;
    
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if issue is in correct status for transfer
    if (!["assigned_to_department", "in-progress", "resolved_by_worker"].includes(issue.status)) {
      return res.status(400).json({ message: "Issue cannot be transferred in current status" });
    }

    // Update issue with new department
    const previousDepartment = issue.current_department_id;
    issue.current_department_id = new_department_id;
    issue.current_worker_id = null; // Reset worker assignment
    issue.status = "assigned_to_department";
    issue.assigned_by_mc_admin_id = mc_admin_id;
    issue.assigned_to_department_at = new Date();
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      previous_department_id: previousDepartment,
      new_department_id: new_department_id,
      assigned_by_mc_admin_id: mc_admin_id,
      status: "assigned_to_department",
      action_type: "transferred",
      notes: notes || `Issue transferred to new department. Reason: ${reason || 'Department reassignment'}`
    });
    await history.save();

    // Notify new department admin
    const department = await Department.findById(new_department_id);
    if (department) {
      const notification = new Notification({
        issue_id,
        recipient_id: department.admin_id,
        recipient_model: "User",
        type: "Issue Transferred - Please assign worker"
      });
      await notification.save();
    }

    res.json({ 
      message: "Issue transferred to new department", 
      issue,
      next_step: "New Department Admin will assign worker"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
