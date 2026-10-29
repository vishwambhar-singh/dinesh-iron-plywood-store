import * as services from "../services/advanceServices.js";

export const requestAdvance = async (req, res) => {
  try {
    const id = await services.requestAdvance(req.body, req.user);
    res.status(201).json({ success: true, id, message: "Advance request submitted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllAdvances = async (req, res) => {
  try {
    const data = await services.getAdvances(req.user);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdvanceStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    await services.updateAdvanceStatus(id, status, req.user);
    res.status(200).json({ success: true, message: "Advance status updated" });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      res.status(403).json({ success: false, message: "Unauthorized action" });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

export const deleteAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    await services.removeAdvance(id, req.user);
    res.status(200).json({ success: true, message: "Advance record deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
