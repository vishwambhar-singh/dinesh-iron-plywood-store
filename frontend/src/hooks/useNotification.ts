import { useEffect } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { apiSlice } from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { useAuth } from "@/hooks/useAuth";
import { logout, updateUser } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";

export const useNotifications = () => {
  const { user, role, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      socket.emit("join_room", `user_${user.id}`);
      if (role) {
        socket.emit("join_room", `role_${role}`);
      }
      socket.emit("join_room", "global_updates");
    });

    socket.on("new_notification", (notification) => {
      if (notification.type === "LOW_STOCK") {
        toast.error(`${notification.title}\n${notification.message}`);
      } else {
        toast.success(`${notification.title}\n${notification.message}`);
      }
      dispatch(apiSlice.util.invalidateTags(["Notifications"]));
    });

    socket.on("USER_MANAGEMENT", (data) => {
      switch (data.type) {
        case "PERMISSIONS_UPDATED":
          dispatch(updateUser({ permissions: data.permissions }));
          toast.warning("Permissions updated by admin.");
          break;

        case "FORCE_LOGOUT":
          toast.error(data.message || "Access Revoked.");
          dispatch(logout());
          dispatch(apiSlice.util.resetApiState());
          navigate("/login", { replace: true });
          break;

        case "ROLE_UPDATED":
          dispatch(updateUser({ role: data.newRole }));
          window.location.reload();
          break;
      }
    });

    socket.on("DATA_UPDATED", (data) => {
      if (data.tags && Array.isArray(data.tags)) {
        dispatch(apiSlice.util.invalidateTags(data.tags));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, role, isAuthenticated, dispatch]);
};
