import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import * as repo from "../repositories/notificationRepo.js";
import nodemailer from "nodemailer";

export const notificationEvents = new EventEmitter();

export const processNewNotification = async (data, targets) => {
  const notificationData = {
    id: uuidv4(),
    type: data.type,
    title: data.title,
    message: data.message,
    reference_module: data.reference_module || null,
    reference_id: data.reference_id || null,
  };

  const targetValues = targets.map((target) => [
    uuidv4(),
    notificationData.id,
    target.target_type,
    target.target_value,
  ]);

  await repo.insertNotification(notificationData, targetValues);

  notificationEvents.emit("push_notification", {
    notification: notificationData,
    targets: targets,
  });

  return notificationData.id;
};

export const getUserNotificationsList = async (userId, userRoles) => {
  return await repo.fetchUserNotifications(userId, userRoles);
};

export const markNotificationRead = async (notificationId, userId) => {
  const readData = {
    id: uuidv4(),
    notification_id: notificationId,
    user_id: userId,
  };
  return await repo.insertNotificationRead(readData);
};

export const getUserUnreadNotificationCount = async (userId, userRoles) => {
  return await repo.fetchUnreadCount(userId, userRoles);
};

export const removeRelatedNotifications = async (
  referenceId,
  referenceModule,
) => {
  try {
    if (!referenceId || !referenceModule) {
      return {
        success: false,
        message: "Reference ID and Module are required",
      };
    }

    await repo.deleteNotificationsByReferenceDB(referenceId, referenceModule);

    return { success: true, message: "Related notifications cleared" };
  } catch (error) {
    console.error("Error in removeRelatedNotifications service:", error);
    throw new Error("Failed to remove notifications");
  }
};

export const removeNotification = async (id) => {
  const success = await repo.deleteNotificationByIdDB(id);
  if (!success) throw new Error("Notification not found");
  return success;
};

export const clearNotifications = async () => {
  return await repo.deleteAllNotificationsDB();
};

export const sendSystemEmail = async (title, message, emailList) => {
  try {
    const uniqueEmails = [...new Set(emailList.filter(Boolean))];

    if (uniqueEmails.length === 0) return;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `<${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      bcc: uniqueEmails.join(", "),
      subject: title,
      text: message,
      html: `<div style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h2 style="color: #dd6b20;">${title}</h2>
              <p style="font-size: 16px;">${message}</p>
             </div>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("System Email Error:", error.message);
  }
};
