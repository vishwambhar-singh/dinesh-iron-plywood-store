import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  createListCollection,
  Flex,
} from "@chakra-ui/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { NAV_ITEMS } from "@/constants/navigation";
import { MultiSelect } from "../ui/MultiSelect";
import { Button } from "../ui/button";
import { MdEdit, MdSave, MdClose, MdSecurity } from "react-icons/md";
import {
  useCreateRolePermissionMutation,
  useGetRolePermissionsQuery,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";

type RolePermissions = Record<string, string[]>;

const rolesCollection = createListCollection({
  items: [
    // { label: "SUPER ADMIN", value: "SUPER_ADMIN" },
    { label: "ADMIN", value: "ADMIN" },
    { label: "MANAGER", value: "MANAGER" },
    { label: "ACCOUNTANT", value: "ACCOUNTANT" },
    { label: "SALES", value: "SALES" },
    { label: "INVENTORY MANAGER", value: "INVENTORY_MANAGER" },
  ],
});

const RolePermissionsSetting = () => {
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
  const [isEditing, setIsEditing] = useState(false);

  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    // SUPER_ADMIN: NAV_ITEMS.map((item) => item.to),
    ADMIN: NAV_ITEMS.map((item) => item.to),
    MANAGER: [],
    ACCOUNTANT: [],
    SALES: [],
    INVENTORY_MANAGER: [],
  });

  const { data: fetchedPermissions, isLoading: isFetching } =
    useGetRolePermissionsQuery();
  const [createRolePermission, { isLoading: isSaving }] =
    useCreateRolePermissionMutation();

  useEffect(() => {
    if (fetchedPermissions) {
      setRolePermissions((prev) => ({
        ...prev,
        ...fetchedPermissions,
      }));
    }
  }, [fetchedPermissions]);

  const permissionOptions = useMemo(
    () =>
      NAV_ITEMS.map(
        (item) => ({
          label: item.label,
          value: item.to,
          icon: item.icon,
        }),
      ),
    [],
  );

  const handlePermissionsChange = (selectedValues: string[]) => {
    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: selectedValues,
    }));
  };

  const handleCancel = () => {
    if (fetchedPermissions) {
      setRolePermissions((prev) => ({
        ...prev,
        ...fetchedPermissions,
      }));
    }
    setIsEditing(false);
  };

  const handleAction = async () => {
    if (isEditing) {
      try {
        const permissionsData = rolePermissions[selectedRole] || [];
        await createRolePermission({
          role: selectedRole,
          permissions: permissionsData,
        }).unwrap();
        setIsEditing(false);
        toast.success("Permissions Updated!");
      } catch (error) {
        toast.error("Failed to update permissions");
      }
    } else {
      setIsEditing(true);
    }
  };

  const isWorking = isSaving || isFetching;

  return (
    <Box
      p={6}
      mb={4}
      bg="white"
      shadow="md"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="brand.200"
    >
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <Box color="brand.600">
            <MdSecurity size={24} />
          </Box>
          <Heading size="md" color="brand.800">
            Role-Based Access Control
          </Heading>
        </HStack>

        <HStack gap={3}>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="gray"
              onClick={handleCancel}
              disabled={isWorking}
            >
              <MdClose /> Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant={isEditing ? "solid" : "outline"}
            colorPalette="brand"
            onClick={handleAction}
            loading={isWorking}
            gap={2}
          >
            {isEditing ? (
              <>
                <MdSave /> Save Changes
              </>
            ) : (
              <>
                <MdEdit /> Edit Permissions
              </>
            )}
          </Button>
        </HStack>
      </Flex>

      <HStack align="flex-start" gap={10} mt={4}>
        <VStack align="stretch" w="35%" gap={4}>
          <Text fontWeight="bold" color="brand.900" fontSize="sm">
            Select Role
          </Text>
          <SelectRoot
            collection={rolesCollection}
            value={[selectedRole]}
            onValueChange={(e) => {
              const val = e.value[0];
              if (val) setSelectedRole(val);
            }}
            disabled={!isEditing || isWorking}
          >
            <SelectTrigger
              borderColor="brand.300"
              _focus={{ outlineColor: "brand.500", borderColor: "brand.500" }}
            >
              <SelectValueText placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              {rolesCollection.items.map((role) => (
                <SelectItem key={role.value} item={role}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
          <Text fontSize="xs" color="fg.muted">
            Changes will only apply to the selected role.
          </Text>
        </VStack>

        <Box w="1px" bg="brand.100" h="150px" />

        <VStack align="stretch" w="60%" gap={4}>
          <Text fontWeight="bold" color="brand.900" fontSize="sm">
            Modules Visibility ({selectedRole})
          </Text>

          <Box
            p={4}
            borderWidth="1px"
            borderColor={isEditing ? "brand.300" : "brand.100"}
            borderRadius="lg"
            bg={isEditing ? "white" : "brand.50"}
            transition="all 0.2s"
          >
            <MultiSelect
              options={permissionOptions}
              value={rolePermissions[selectedRole] || []}
              onChange={handlePermissionsChange}
              placeholder="Assign modules..."
              disabled={!isEditing || isWorking}
            />
          </Box>
        </VStack>
      </HStack>
    </Box>
  );
};

export default RolePermissionsSetting;
