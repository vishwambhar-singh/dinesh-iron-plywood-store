import db from "../config/db.js";

export const insertNotification = async (notificationData, targetValues) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO notifications (id, type, title, message, reference_module, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        notificationData.id,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.reference_module || null,
        notificationData.reference_id || null,
      ],
    );

    if (targetValues.length > 0) {
      await connection.query(
        `INSERT INTO notification_targets (id, notification_id, target_type, target_value)
         VALUES ?`,
        [targetValues],
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const fetchUserNotifications = async (userId, userRoles) => {
  const [rows] = await db.query(
    `SELECT DISTINCT n.id, n.type, n.title, n.message, n.reference_module, n.reference_id, n.created_at,
            IF(nr.id IS NOT NULL, 1, 0) AS is_read
     FROM notifications n
     JOIN notification_targets nt ON n.id = nt.notification_id
     LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
     WHERE (nt.target_type = 'USER' AND nt.target_value = ?)
        OR (nt.target_type = 'ROLE' AND nt.target_value IN (?))
     ORDER BY n.created_at DESC`,
    [userId, userId, userRoles],
  );
  return rows;
};

export const insertNotificationRead = async (readData) => {
  const [result] = await db.query(
    `INSERT INTO notification_reads (id, notification_id, user_id)
     VALUES (?, ?, ?)`,
    [readData.id, readData.notification_id, readData.user_id],
  );
  return result.affectedRows;
};

export const fetchUnreadCount = async (userId, userRoles) => {
  const [rows] = await db.query(
    `SELECT COUNT(DISTINCT n.id) AS unread_count
     FROM notifications n
     JOIN notification_targets nt ON n.id = nt.notification_id
     LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
     WHERE ((nt.target_type = 'USER' AND nt.target_value = ?)
        OR (nt.target_type = 'ROLE' AND nt.target_value IN (?)))
       AND nr.id IS NULL`,
    [userId, userId, userRoles],
  );
  return rows[0].unread_count;
};

export const deleteNotificationsByReferenceDB = async (
  referenceId,
  referenceModule,
) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [notifications] = await connection.query(
      `SELECT id FROM notifications WHERE reference_id = ? AND reference_module = ?`,
      [referenceId, referenceModule],
    );

    if (notifications.length > 0) {
      const notificationIds = notifications.map((n) => n.id);

      await connection.query(
        `DELETE FROM notification_reads WHERE notification_id IN (?)`,
        [notificationIds],
      );

      await connection.query(
        `DELETE FROM notification_targets WHERE notification_id IN (?)`,
        [notificationIds],
      );

      await connection.query(`DELETE FROM notifications WHERE id IN (?)`, [
        notificationIds,
      ]);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteNotificationByIdDB = async (notificationId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      "DELETE FROM notification_reads WHERE notification_id = ?",
      [notificationId],
    );
    await connection.query(
      "DELETE FROM notification_targets WHERE notification_id = ?",
      [notificationId],
    );

    const [result] = await connection.query(
      "DELETE FROM notifications WHERE id = ?",
      [notificationId],
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteAllNotificationsDB = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query("DELETE FROM notification_reads");
    await connection.query("DELETE FROM notification_targets");
    await connection.query("DELETE FROM notifications");

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
