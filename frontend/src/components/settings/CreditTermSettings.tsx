import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Field,
  Input,
  HStack,
  Flex,
  Stack,
  Text,
  Circle,
  Group,
  InputElement,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  MdCalendarToday,
  MdSave,
  MdEdit,
  MdClose,
  MdInfoOutline,
} from "react-icons/md";
import { toast } from "@/utils/toast";

interface CreditTermSettingsProps {
  initialSupplierDays: string;
  initialCustomerDays: string;
  onSave: (data: any) => Promise<void>;
}

export const CreditTermSettings = ({
  initialSupplierDays,
  initialCustomerDays,
  onSave,
}: CreditTermSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [supplierDays, setSupplierDays] = useState<string>(initialSupplierDays);
  const [customerDays, setCustomerDays] = useState<string>(initialCustomerDays);

  useEffect(() => {
    setSupplierDays(initialSupplierDays);
    setCustomerDays(initialCustomerDays);
  }, [initialSupplierDays, initialCustomerDays]);

  const handleCancel = () => {
    setSupplierDays(initialSupplierDays);
    setCustomerDays(initialCustomerDays);
    setIsEditing(false);
  };

  const handleAction = async () => {
    if (isEditing) {
      const sDays = Number(supplierDays);
      const cDays = Number(customerDays);

      if (sDays < 0 || cDays < 0) {
        toast.error("Days cannot be negative!");
        return;
      }

      await onSave({
        group: "credit_terms",
        settings: {
          supplier_credit_days: String(sDays),
          customer_credit_days: String(cDays),
        },
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

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
      <Flex mb={6} justify="space-between" align="center">
        <HStack gap={3}>
          <Circle size="10" bg="brand.100" color="brand.600">
            <MdCalendarToday size={20} />
          </Circle>
          <Box>
            <Heading size="md" color="brand.800">
              Payment Credit Terms
            </Heading>
            <Text fontSize="xs" color="fg.muted">
              Default credit period for suppliers and customers
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          {isEditing && (
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <MdClose /> Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant={isEditing ? "solid" : "outline"}
            colorPalette="brand"
            onClick={handleAction}
            gap={2}
          >
            {isEditing ? (
              <>
                <MdSave /> Save Changes
              </>
            ) : (
              <>
                <MdEdit /> Edit Settings
              </>
            )}
          </Button>
        </HStack>
      </Flex>

      <Stack gap={6}>
        <HStack gap={6} width="full" align="flex-start">
          <Field.Root flex={1}>
            <Field.Label fontWeight="bold" color="brand.800">
              Supplier Credit (Payables)
            </Field.Label>
            <Group width="full">
              <Input
                type="number"
                value={supplierDays}
                disabled={!isEditing}
                onChange={(e) => setSupplierDays(e.target.value)}
                placeholder="e.g. 60"
                min={0}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={(e) =>
                  ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                }
              />
              <InputElement placement="end">
                <Text fontWeight="bold" color="fg.muted" pr={6}>
                  Days
                </Text>
              </InputElement>
            </Group>
          </Field.Root>

          <Field.Root flex={1}>
            <Field.Label fontWeight="bold" color="brand.800">
              Customer Credit (Receivables)
            </Field.Label>
            <Group width="full">
              <Input
                type="number"
                value={customerDays}
                disabled={!isEditing}
                onChange={(e) => setCustomerDays(e.target.value)}
                placeholder="e.g. 30"
                min={0}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={(e) =>
                  ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                }
              />
              <InputElement placement="end">
                <Text fontWeight="bold" color="fg.muted" pr={6}>
                  Days
                </Text>
              </InputElement>
            </Group>
          </Field.Root>
        </HStack>

        <Box
          p={4}
          borderRadius="lg"
          bg="brand.50"
          borderWidth="1px"
          borderColor="brand.200"
          borderStyle="dashed"
        >
          <HStack gap={2} color="brand.700">
            <MdInfoOutline />
            <Text fontSize="sm">
              These values will be used to calculate <b>Due Dates</b> for new
              invoices and purchase orders.
            </Text>
          </HStack>
        </Box>
      </Stack>
    </Box>
  );
};
