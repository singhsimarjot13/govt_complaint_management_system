import Ward from "../models/Ward.js";

// Only wards under MLA's city
export const createWardMLA = async (req, res) => {
  try {
    const ward = new Ward(req.body);
    await ward.save();
    res.status(201).json({ message: "Ward created", ward });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateWardMLA = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ward) return res.status(404).json({ message: "Ward not found" });
    res.json({ message: "Ward updated", ward });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteWardMLA = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndDelete(req.params.id);
    if (!ward) return res.status(404).json({ message: "Ward not found" });
    res.json({ message: "Ward deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getWardsMLA = async (req, res) => {
  try {
    const wards = await Ward.find(); // filter by MLA's city if needed
    res.json(wards);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
