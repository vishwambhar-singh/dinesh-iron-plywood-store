import { Box, Circle, Text, VStack, Flex, IconButton } from "@chakra-ui/react";
import {
  MdNotificationsNone,
  MdOutlineDeleteSweep,
  MdDeleteOutline,
} from "react-icons/md";
import { useState, useRef, useEffect } from "react";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";
import { CustomDeleteDialog } from "../ui/CustomDeleteDialog";

const NotificationBell = () => {
  const { user, role, isSuperAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const queryParams = { userId: user?.id, userRoles: role };

  const { data: notifications = [] } = useGetNotificationsQuery(queryParams, {
    skip: !user?.id,
  });
  const { data: countData } = useGetUnreadCountQuery(queryParams, {
    skip: !user?.id,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [clearAll] = useClearAllNotificationsMutation();

  const unreadCount = Number(countData?.unread_count || 0);

  return (
    <>
      <Box ref={containerRef} position="relative">
        <Box
          cursor="pointer"
          p={2}
          borderRadius="lg"
          _hover={{ bg: "blackAlpha.50", color: "brand.600" }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <MdNotificationsNone size="24px" />
          {unreadCount > 0 && (
            <Circle
              size="18px"
              bg="red.500"
              color="white"
              position="absolute"
              top="1"
              right="1"
              fontSize="10px"
              fontWeight="bold"
              border="2px solid white"
            >
              {unreadCount}
            </Circle>
          )}
        </Box>

        {isOpen && (
          <Box
            position="absolute"
            top="45px"
            right="0"
            width="340px"
            bg="white"
            boxShadow="0px 10px 25px rgba(0,0,0,0.15)"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.100"
            zIndex={1000}
          >
            <Flex
              p={4}
              borderBottomWidth="1px"
              borderColor="gray.50"
              justify="space-between"
              align="center"
            >
              <Text fontWeight="bold" fontSize="sm">
                Notifications
              </Text>
              {isSuperAdmin && notifications.length > 0 && (
                <IconButton
                  aria-label="Clear all"
                  variant="ghost"
                  size="xs"
                  color="red"
                  onClick={() => setIsDialogOpen(true)}
                  title="Clear All"
                >
                  <MdOutlineDeleteSweep />
                </IconButton>
              )}
            </Flex>

            <VStack gap={0} align="stretch" maxH="380px" overflowY="auto">
              {notifications.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Text fontSize="xs" color="gray.400">
                    No new alerts
                  </Text>
                </Box>
              ) : (
                notifications.map((n: any) => (
                  <Flex
                    key={n.id}
                    p={4}
                    borderBottomWidth="1px"
                    borderColor="gray.50"
                    bg={n.is_read ? "transparent" : "blue.50"}
                    _hover={{ bg: "gray.50" }}
                    align="center"
                    gap={2}
                  >
                    <Box
                      flex="1"
                      cursor="pointer"
                      onClick={() =>
                        markAsRead({ notificationId: n.id, userId: user?.id })
                      }
                    >
                      <Text
                        fontWeight={n.is_read ? "semibold" : "bold"}
                        fontSize="xs"
                        color="gray.800"
                      >
                        {n.title}
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {n.message}
                      </Text>
                    </Box>

                    {isSuperAdmin && (
                      <IconButton
                        aria-label="Delete notification"
                        variant="ghost"
                        size="xs"
                        color="red"
                        onClick={() => deleteNotification(n.id)}
                      >
                        <MdDeleteOutline />
                      </IconButton>
                    )}
                  </Flex>
                ))
              )}
            </VStack>
          </Box>
        )}
      </Box>
      <CustomDeleteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          clearAll({});
          setIsDialogOpen(false);
        }}
        title="Delete Notifications?"
        description={`Are you sure you want to delete ? This action will permanently remove all notification.`}
      />
    </>
  );
};

export default NotificationBell;
