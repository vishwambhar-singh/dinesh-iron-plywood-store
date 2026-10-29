import {
  Input,
  Stack,
  Grid,
  Field,
  IconButton,
  InputGroup,
  createListCollection,
  Box,
} from "@chakra-ui/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CustomModal } from "@/components/ui/CustomModal";
import { useState, useEffect, useMemo } from "react";
import { EmployeeModalProps, Employee } from "@/types/employee";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { NAV_ITEMS } from "@/constants/navigation";
import { MultiSelect } from "../ui/MultiSelect";
import { useGetRolePermissionsQuery } from "@/store/apiSlice";
import { toast } from "@/utils/toast";

export const EmployeeModal = ({
  isOpen,
  onClose,
  onSubmit,
  employee,
  mode: initialMode = "add",
}: EmployeeModalProps) => {
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const { data: dbRoles, isLoading: isRolesLoading } =
    useGetRolePermissionsQuery();

  const [formData, setFormData] = useState<Employee>({
    name: "",
    email: "",
    mobile: "",
    salary: 0,
    role: "",
    permissions: [],
  });

  const roles = useMemo(() => (dbRoles ? Object.keys(dbRoles) : []), [dbRoles]);

  const filteredRoles = useMemo(() => {
    return roles.filter(
      (r) =>
        r !== "SUPER_ADMIN" &&
        r.toLowerCase().includes(roleSearch.toLowerCase()),
    );
  }, [roles, roleSearch]);

  const rolesCollection = useMemo(() => {
    return createListCollection({
      items: filteredRoles.map((r) => ({ label: r, value: r })),
    });
  }, [filteredRoles]);

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        name: "",
        email: "",
        mobile: "",
        permissions: [],
        salary: 0,
        role: "",
      });
    }
  }, [employee, isOpen]);

  const validateEmployee = (data: any) => {
    const errors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!data.name || data.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters long";
    }
    if (!data.email || !emailRegex.test(data.email)) {
      errors.email = "Invalid email format";
    }
    if (!data.mobile || !phoneRegex.test(data.mobile)) {
      errors.mobile =
        "Invalid Indian mobile number (10 digits starting with 6-9)";
    }
    if (!data.role) {
      errors.role = "Please select a role";
    }
    if (currentMode === "add" && (!data.password || data.password.length < 6)) {
      errors.password = "Password must be at least 6 characters long";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  const handleConfirm = () => {
    const { isValid, errors } = validateEmployee(formData);
    if (!isValid) {
      const firstError = Object.values(errors)[0] as string;
      toast.error(firstError);
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (roleName: string) => {
    if (!roleName) return;
    const roleDefaultPermissions = dbRoles?.[roleName] || [];
    setFormData((prev) => ({
      ...prev,
      role: roleName,
      permissions: roleDefaultPermissions,
    }));
  };

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

  const isViewMode = currentMode === "view";

  return (
    <CustomModal
      title={
        isViewMode
          ? "Employee Details"
          : currentMode === "edit"
            ? "Edit Employee"
            : "Add New Employee"
      }
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      onConfirm={handleConfirm}
      confirmLabel={currentMode === "add" ? "Add Employee" : "Update Employee"}
      mode={currentMode}
      onEditClick={() => setCurrentMode("edit")}
    >
      <Stack gap={4}>
        <Grid templateColumns="1fr 1fr" gap={4}>
          <Field.Root
            invalid={formData.name.length > 0 && formData.name.length < 3}
          >
            <Field.Label>Employee Name *</Field.Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              readOnly={isViewMode}
              placeholder="Enter Employee Name"
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Email *</Field.Label>
            <Input
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              readOnly={isViewMode}
              placeholder="Enter Email"
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Mobile *</Field.Label>
            <Input
              value={formData.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
              readOnly={isViewMode}
              placeholder="Enter Mobile Number"
              type="number"
              onKeyDown={(e) =>
                ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
              }
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Select Role *</Field.Label>
            <SelectRoot
              key={rolesCollection.items.length + (formData.role || "none")}
              collection={rolesCollection}
              value={formData.role ? [formData.role] : []}
              onValueChange={(details) => {
                const selected = details.value[0];
                if (selected) handleRoleChange(selected);
              }}
              disabled={isViewMode || isRolesLoading}
            >
              <SelectTrigger>
                <SelectValueText
                  placeholder={
                    isRolesLoading ? "Loading roles..." : "Select assigned role"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <Box p={2}>
                  <Input
                    placeholder="Search roles..."
                    size="sm"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </Box>
                {rolesCollection.items.map((role) => (
                  <SelectItem key={role.value} item={role}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>

          {!isViewMode && (
            <Field.Root>
              <Field.Label>
                Password{" "}
                {currentMode === "edit" ? "(Leave blank to keep current)" : "*"}
              </Field.Label>
              <InputGroup
                flex="1"
                endElement={
                  <IconButton
                    aria-label="Toggle Password Visibility"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </IconButton>
                }
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ""}
                  onChange={(e) => handleChange("password", e.target.value)}
                  readOnly={isViewMode}
                  placeholder="Enter Password"
                  focusRingColor="brand.500"
                />
              </InputGroup>
            </Field.Root>
          )}

          <Field.Root>
            <Field.Label>Salary *</Field.Label>
            <Input
              type="number"
              min={0}
              value={formData.salary === 0 ? "" : formData.salary}
              placeholder="Enter Salary"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") handleChange("salary", 0);
                else {
                  const num = Number(val);
                  if (num >= 0) handleChange("salary", num);
                }
              }}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              onKeyDown={(e) =>
                ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
              }
              readOnly={isViewMode}
            />
          </Field.Root>
        </Grid>

        <Field.Root>
          <Field.Label>Custom Module Permissions (Overrides Role)</Field.Label>
          <MultiSelect
            options={permissionOptions}
            value={formData.permissions || []}
            onChange={(selectedValues) =>
              handleChange("permissions", selectedValues)
            }
            disabled={isViewMode}
            placeholder="Select additional modules..."
          />
        </Field.Root>
      </Stack>
    </CustomModal>
  );
};
