import { Server } from "socket.io";
import { notificationEvents } from "./services/notificationServices.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("disconnect", () => {});
  });

  notificationEvents.on("push_notification", ({ notification, targets }) => {
    targets.forEach((target) => {
      const roomName =
        target.target_type === "ROLE"
          ? `role_${target.target_value}`
          : `user_${target.target_value}`;

      io.to(roomName).emit("new_notification", notification);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitUserAction = (userId, actionType, payload = {}) => {
  if (!io) return;
  io.to(`user_${userId}`).emit("USER_MANAGEMENT", {
    type: actionType,
    ...payload,
  });
};

export const emitGlobalUpdate = (tags = []) => {
  if (!io) return;
  io.to("global_updates").emit("DATA_UPDATED", { tags });
};
