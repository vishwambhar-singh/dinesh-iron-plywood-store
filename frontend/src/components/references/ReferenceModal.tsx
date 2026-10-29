import {
  Input,
  Stack,
  Grid,
  Field,
  Text,
  Textarea,
  Box,
} from "@chakra-ui/react";
import { CustomModal } from "@/components/ui/CustomModal";
import { useState, useEffect } from "react";
import { Reference, ReferenceModalProps } from "@/types/references";
import { toast } from "@/utils/toast";

export const ReferenceModal = ({
  isOpen,
  onClose,
  onSubmit,
  reference,
  mode: initialMode = "add",
}: ReferenceModalProps) => {
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [formData, setFormData] = useState<Reference>({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (reference) {
      setFormData(reference);
    } else {
      setFormData({
        name: "",
        email: "",
        mobile: "",
        address: "",
      });
    }
  }, [reference, isOpen]);

  const handleChange = (field: keyof Reference, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateReference = (data: Reference) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!data.name || data.name.trim().length < 3) {
      toast.error("Name must be at least 3 characters long");
      return false;
    }
    if (!data.mobile || !phoneRegex.test(data.mobile)) {
      toast.error("Invalid Indian mobile number (10 digits starting with 6-9)");
      return false;
    }
    if (
      data.email &&
      data.email.trim() !== "" &&
      !emailRegex.test(data.email)
    ) {
      toast.error("Invalid email format");
      return false;
    }

    return true;
  };

  const handleConfirm = () => {
    if (currentMode === "view") {
      onClose();
      return;
    }

    if (validateReference(formData)) {
      onSubmit(formData);
    }
  };

  const isViewMode = currentMode === "view";

  return (
    <CustomModal
      title={
        isViewMode
          ? "Reference Details"
          : currentMode === "edit"
            ? "Edit Reference"
            : "Add New Reference"
      }
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      onConfirm={handleConfirm}
      confirmLabel={
        currentMode === "add" ? "Save Reference" : "Update Reference"
      }
      mode={currentMode}
      onEditClick={() => setCurrentMode("edit")}
    >
      <Stack gap={5}>
        <Box p={3} bg="bg.muted" borderRadius="md" borderWidth="1px">
          <Text fontSize="xs" fontWeight="bold" color="brand.solid" mb={1}>
            Reference Number: {formData.referenceNumber || "REF-XXXX-XXXX"}
          </Text>
          {!formData?.referenceNumber && (
            <Text fontSize="2xs" color="fg.muted">
              Note: Your Reference Number would be generated as REF-YYYY-XXXX
            </Text>
          )}
        </Box>

        <Grid templateColumns="1fr 1fr" gap={4}>
          <Field.Root>
            <Field.Label>Name *</Field.Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              readOnly={isViewMode}
              placeholder="Enter Name"
              type="text"
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Mobile *</Field.Label>
            <Input
              value={formData.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
              readOnly={isViewMode}
              placeholder="Enter Mobile"
              type="number"
              onKeyDown={(e) =>
                ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
              }
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </Field.Root>
        </Grid>

        <Grid templateColumns={isViewMode ? "1fr 1fr 1fr" : "1fr"} gap={4}>
          <Field.Root>
            <Field.Label>Email</Field.Label>
            <Input
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              readOnly={isViewMode}
              placeholder="Enter Email"
              type="text"
            />
          </Field.Root>
          {isViewMode && (
            <Field.Root>
              <Field.Label>Points</Field.Label>
              <Input value={formData.points || 0} readOnly />
            </Field.Root>
          )}
          {isViewMode && (
            <Field.Root>
              <Field.Label>Redeemed</Field.Label>
              <Input value={formData.redeemedPoints || 0} readOnly />
            </Field.Root>
          )}
        </Grid>

        <Field.Root>
          <Field.Label>Address</Field.Label>
          <Textarea
            value={formData.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            readOnly={isViewMode}
            placeholder="Enter Address"
            rows={3}
          />
        </Field.Root>
      </Stack>
    </CustomModal>
  );
};
