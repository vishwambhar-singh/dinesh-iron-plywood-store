import { Input, Stack, Grid, Field, Textarea } from "@chakra-ui/react";
import { CustomModal } from "@/components/ui/CustomModal";
import { useState, useEffect } from "react";
import { Supplier } from "@/types/supplier";
import { toast } from "@/utils/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Supplier) => void;
  supplier: Supplier | null;
  mode: "view" | "edit" | "add";
}

export const SupplierModal = ({
  isOpen,
  onClose,
  onSubmit,
  supplier,
  mode: initialMode,
}: Props) => {
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [formData, setFormData] = useState<Supplier>({
    name: "",
    email: "",
    mobile: "",
    address: "",
    pan: "",
    gstNumber: "",
    openingBalance: 0,
  });

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (supplier && isOpen) {
      setFormData(supplier);
    } else if (isOpen) {
      setFormData({
        name: "",
        email: "",
        mobile: "",
        address: "",
        pan: "",
        gstNumber: "",
        openingBalance: 0,
      });
    }
  }, [supplier, isOpen]);

  const isViewMode = currentMode === "view";
  const blockInvalidChar = (e: React.KeyboardEvent) =>
    ["e", "E", "-", "+"].includes(e.key) && e.preventDefault();

  const validateSupplierData = (data: Supplier) => {
    const errors: string[] = [];

    const name = data.name?.trim() || "";
    if (!name || name.length < 3) {
      errors.push("Supplier name must be at least 3 characters");
    }

    const mobile = data.mobile?.trim() || "";
    if (!mobile) {
      errors.push("Mobile number is mandatory");
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.push("Invalid Indian mobile number");
    }

    if (data.email && data.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push("Invalid email format");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  };

  return (
    <CustomModal
      title={
        isViewMode
          ? "Supplier Details"
          : currentMode === "edit"
            ? "Edit Supplier"
            : "Add New Supplier"
      }
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      onConfirm={() => {
        if (isViewMode) {
          onClose();
          return;
        }

        const validation = validateSupplierData(formData);

        if (!validation.isValid && validation.errors[0]) {
          toast.error(validation.errors[0]);
          return;
        }
        onSubmit(formData);
      }}
      confirmLabel={currentMode === "add" ? "Save Supplier" : "Update Supplier"}
      mode={currentMode}
      onEditClick={() => setCurrentMode("edit")}
    >
      <Stack gap={5}>
        <Grid templateColumns="1fr 1fr" gap={4}>
          <Field.Root>
            <Field.Label>Supplier Name *</Field.Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              readOnly={isViewMode}
              type="text"
              textTransform="capitalize"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Mobile Number *</Field.Label>
            <Input
              value={formData.mobile}
              onChange={(e) =>
                setFormData({ ...formData, mobile: e.target.value })
              }
              readOnly={isViewMode}
              type="number"
              onKeyDown={blockInvalidChar}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Email Address</Field.Label>
            <Input
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              readOnly={isViewMode}
              type="email"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>GST Number</Field.Label>
            <Input
              value={formData?.gstNumber?.toUpperCase()}
              onChange={(e) =>
                setFormData({ ...formData, gstNumber: e.target.value })
              }
              readOnly={isViewMode}
              type="text"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>PAN Number</Field.Label>
            <Input
              value={formData?.pan?.toUpperCase()}
              onChange={(e) =>
                setFormData({ ...formData, pan: e.target.value })
              }
              readOnly={isViewMode}
              type="text"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Opening Balance (₹)</Field.Label>
            <Input
              value={formData.openingBalance || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  openingBalance: parseFloat(e.target.value) || 0,
                })
              }
              readOnly={isViewMode}
              type="number"
            />
          </Field.Root>
        </Grid>
        <Field.Root>
          <Field.Label>Office Address</Field.Label>
          <Textarea
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            readOnly={isViewMode}
            rows={3}
          />
        </Field.Root>
      </Stack>
    </CustomModal>
  );
};
