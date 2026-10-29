import { useState } from "react";
import {
  Box,
  Heading,
  Input,
  HStack,
  Flex,
  Stack,
  Field,
  IconButton,
  InputElement,
  Group,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  MdEdit,
  MdLock,
  MdSave,
  MdVisibility,
  MdVisibilityOff,
  MdClose,
} from "react-icons/md";
import { toast } from "@/utils/toast";
import { useChangePasswordMutation } from "@/store/apiSlice";

export const ChangePassword = () => {
  const [updatePassword, { isLoading }] = useChangePasswordMutation();
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const toggleVisibility = (field: keyof typeof showPass) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleAction = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    try {
      await updatePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsEditing(false);
      toast.success("Password Updated!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update password");
    }
  };

  const isInvalid =
    isEditing &&
    (passwords.newPassword !== passwords.confirmPassword ||
      passwords.newPassword.length < 6 ||
      !passwords.currentPassword);

  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="xl"
      bg="bgMain"
      width="full"
      borderColor="brand.200"
    >
      <Flex mb={6} justify="space-between" align="center">
        <HStack gap={3}>
          <Box color="brandPrimary">
            <MdLock size={24} />
          </Box>
          <Heading size="md" color="brandPrimary">
            Security Settings
          </Heading>
        </HStack>
      </Flex>

      <Stack gap={4}>
        <Field.Root>
          <Field.Label fontWeight="bold" fontSize="sm">
            Current Password
          </Field.Label>
          <Group width="full">
            <Input
              type={showPass.current ? "text" : "password"}
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
              disabled={!isEditing}
              placeholder={isEditing ? "Enter current password" : "••••••••"}
            />
            <InputElement placement="end">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => toggleVisibility("current")}
                disabled={!isEditing}
              >
                {showPass.current ? <MdVisibilityOff /> : <MdVisibility />}
              </IconButton>
            </InputElement>
          </Group>
        </Field.Root>

        <Field.Root>
          <Field.Label fontWeight="bold" fontSize="sm">
            New Password
          </Field.Label>
          <Group width="full">
            <Input
              type={showPass.new ? "text" : "password"}
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
              disabled={!isEditing}
              placeholder={isEditing ? "Enter new password" : "••••••••"}
            />
            <InputElement placement="end">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => toggleVisibility("new")}
                disabled={!isEditing}
              >
                {showPass.new ? <MdVisibilityOff /> : <MdVisibility />}
              </IconButton>
            </InputElement>
          </Group>
          {isEditing && (
            <Field.HelperText fontSize="xs">
              Min 6 characters required.
            </Field.HelperText>
          )}
        </Field.Root>

        <Field.Root>
          <Field.Label fontWeight="bold" fontSize="sm">
            Confirm New Password
          </Field.Label>
          <Group width="full">
            <Input
              type={showPass.confirm ? "text" : "password"}
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
              disabled={!isEditing}
              placeholder={isEditing ? "Confirm new password" : "••••••••"}
            />
            <InputElement placement="end">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => toggleVisibility("confirm")}
                disabled={!isEditing}
              >
                {showPass.confirm ? <MdVisibilityOff /> : <MdVisibility />}
              </IconButton>
            </InputElement>
          </Group>
        </Field.Root>
      </Stack>

      <Flex justify="flex-end" mt={8} gap={3}>
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            colorPalette="gray"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <MdClose /> Cancel
          </Button>
        )}
        <Button
          size="sm"
          loading={isLoading}
          colorPalette="brand"
          onClick={handleAction}
          gap={2}
          disabled={isInvalid}
          variant={isEditing ? "solid" : "outline"}
        >
          {isEditing ? (
            <>
              <MdSave /> Save Changes
            </>
          ) : (
            <>
              <MdEdit /> Change Password
            </>
          )}
        </Button>
      </Flex>
    </Box>
  );
};
