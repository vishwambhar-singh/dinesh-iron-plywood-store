import express from "express";
import {
  fetchNotifications,
  markAsRead,
  fetchUnreadCount,
  clearAllNotifications,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/list", fetchNotifications);
router.post("/read", markAsRead);
router.get("/count", fetchUnreadCount);
router.delete("/clear-all", clearAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
