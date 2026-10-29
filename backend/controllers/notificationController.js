import * as notificationService from "../services/notificationServices.js";

export const fetchNotifications = async (req, res) => {
  try {
    const { userId, userRoles } = req.query;
    const notifications = await notificationService.getUserNotificationsList(
      userId,
      userRoles,
    );
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId, userId } = req.body;
    await notificationService.markNotificationRead(notificationId, userId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchUnreadCount = async (req, res) => {
  try {
    const { userId, userRoles } = req.query;
    const count = await notificationService.getUserUnreadNotificationCount(
      userId,
      userRoles,
    );
    res.status(200).json({ unread_count: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.removeNotification(id);
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res
      .status(error.message === "Notification not found" ? 404 : 500)
      .json({ message: error.message });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    await notificationService.clearNotifications();
    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
