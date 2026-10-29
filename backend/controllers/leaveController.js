import * as service from "../services/leaveServices.js";

export const createLeave = async (req, res) => {
  try {
    const user = req.user;
    const leaveId = await service.processNewLeave(req.body, user);
    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      id: leaveId,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getLeaves = async (req, res) => {
  try {
    const user = req.user;
    const leaves = await service.fetchAllLeaves(user);
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    await service.modifyLeaveStatus(id, status, user);
    res.status(200).json({ success: true, message: `Leave ${status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await service.removeLeave(id, user);
    res.status(200).json({ success: true, message: "Leave deleted successfully" });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};
