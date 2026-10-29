import { v4 as uuidv4 } from "uuid";
import * as repo from "../repositories/leaveRepo.js";
import { processNewNotification } from "./notificationServices.js";

export const processNewLeave = async (leaveData, creatorUser) => {
  if (!leaveData.startDate || !leaveData.endDate || !leaveData.reason) {
    throw new Error("Missing required fields for leave");
  }
  
  const start = new Date(leaveData.startDate);
  const end = new Date(leaveData.endDate);
  
  if (start > end) {
    throw new Error("End date cannot be before start date");
  }

  // Calculate inclusive days
  const timeDifference = end.getTime() - start.getTime();
  const daysDifference = Math.round(timeDifference / (1000 * 3600 * 24)) + 1;

  const id = uuidv4();
  const employeeId = creatorUser?.id; // The user applying for leave

  const payload = {
    id,
    employeeId,
    startDate: leaveData.startDate,
    endDate: leaveData.endDate,
    days: daysDifference,
    reason: leaveData.reason,
    month: start.getMonth() + 1, // 1-12
    year: start.getFullYear(),
    status: creatorUser?.role === 'SUPER_ADMIN' ? 'APPROVED' : 'PENDING'
  };

  const rowsAffected = await repo.createLeaveDB(payload);
  if (rowsAffected === 0) throw new Error("Failed to process leave application");

  // Create notifications for Admins
  if (creatorUser?.role !== 'SUPER_ADMIN') {
    try {
      await processNewNotification(
        {
          type: "LEAVE_REQUEST",
          title: "New Leave Request",
          message: `${creatorUser?.name || 'An employee'} has requested ${daysDifference} day(s) leave.`,
          reference_module: "LEAVE",
          reference_id: id,
        },
        [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }, { target_type: "ROLE", target_value: "ADMIN" }]
      );
    } catch (err) {
      console.error("Notification dispatch failed:", err.message);
    }
  }

  return id;
};

export const fetchAllLeaves = async (user) => {
  // If user is basic staff, fetch only theirs
  if (user?.role === 'STAFF' && !user?.permissions?.includes('ALL_LEAVES')) {
    return await repo.fetchLeavesByEmployeeDB(user.id);
  }
  return await repo.fetchAllLeavesDB();
};

export const modifyLeaveStatus = async (id, status, user) => {
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    throw new Error("Unauthorized to approve or reject leaves");
  }
  const rowsAffected = await repo.updateLeaveStatusDB(id, status);
  if (rowsAffected === 0) throw new Error("Failed to update leave status");
  return true;
};

export const removeLeave = async (id, user) => {
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    throw new Error("Unauthorized to delete leaves");
  }
  const rowsAffected = await repo.deleteLeaveDB(id);
  if (rowsAffected === 0) throw new Error("Failed to delete leave");
  return true;
};
