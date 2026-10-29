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
  VStack,
  IconButton,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  MdAccountBalance,
  MdAdd,
  MdDeleteOutline,
  MdSave,
  MdEdit,
  MdClose,
} from "react-icons/md";
import { toast } from "@/utils/toast";

interface BankSettingsProps {
  initialBanks: string;
  onSave: (data: any) => Promise<void>;
}

export const BankSettings = ({ initialBanks, onSave }: BankSettingsProps) => {
  const [banks, setBanks] = useState<string[]>([]);
  const [newBank, setNewBank] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    try {
      const parsed = initialBanks ? JSON.parse(initialBanks) : [];
      setBanks(parsed);
    } catch (e) {
      setBanks([]);
    }
  }, [initialBanks, isEditing === false]);

  const handleCancel = () => {
    try {
      const parsed = initialBanks ? JSON.parse(initialBanks) : [];
      setBanks(parsed);
    } catch (e) {
      setBanks([]);
    }
    setNewBank("");
    setIsEditing(false);
  };

  const handleAddBank = () => {
    const trimmed = newBank.trim();
    if (!trimmed) {
      toast.error("Bank name cannot be empty!");
      return;
    }
    if (banks.includes(trimmed)) {
      toast.error("This bank is already added!");
      return;
    }
    setBanks([...banks, trimmed]);
    setNewBank("");
  };

  const handleRemoveBank = (name: string) => {
    setBanks(banks.filter((b) => b !== name));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        group: "accounting",
        settings: {
          bank_list: JSON.stringify(banks),
        },
      });
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to save bank settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      p={6}
      bg="white"
      shadow="md"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="brand.200"
    >
      <Flex mb={6} justify="space-between" align="center">
        <HStack gap={3}>
          <Circle size="10" bg="brand.100" color="brand.600">
            <MdAccountBalance size={20} />
          </Circle>
          <Box>
            <Heading size="md" color="brand.800">
              Bank Accounts
            </Heading>
            <Text fontSize="xs" color="fg.muted">
              Manage bank accounts for accounting vouchers
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <MdClose /> Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant={isEditing ? "solid" : "outline"}
            colorPalette="brand"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            loading={isLoading}
            gap={2}
          >
            {isEditing ? (
              <>
                <MdSave /> Save Changes
              </>
            ) : (
              <>
                <MdEdit /> Edit Banks
              </>
            )}
          </Button>
        </HStack>
      </Flex>

      <Stack gap={6}>
        <Field.Root disabled={!isEditing}>
          <Field.Label fontWeight="bold" color="brand.800">
            Add New Bank
          </Field.Label>
          <HStack width="full">
            <Input
              placeholder="e.g. HDFC Bank - 1234"
              value={newBank}
              disabled={!isEditing}
              onChange={(e) => setNewBank(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddBank()}
            />
            <Button
              variant="subtle"
              colorPalette="blue"
              onClick={handleAddBank}
              disabled={!isEditing}
            >
              <MdAdd /> Add
            </Button>
          </HStack>
        </Field.Root>

        <Box>
          <Text fontSize="sm" fontWeight="bold" color="brand.800" mb={3}>
            Added Banks ({banks.length})
          </Text>
          {banks.length === 0 ? (
            <Box
              p={8}
              textAlign="center"
              borderRadius="lg"
              borderWidth="1px"
              borderStyle="dashed"
              bg="gray.50"
            >
              <Text fontSize="sm" color="fg.muted">
                No banks added yet.
              </Text>
            </Box>
          ) : (
            <VStack gap={2} align="stretch">
              {banks.map((bank, index) => (
                <HStack
                  key={index}
                  p={3}
                  bg="gray.50"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.100"
                  justify="space-between"
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {bank}
                  </Text>
                  {isEditing && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      aria-label="Delete bank"
                      onClick={() => handleRemoveBank(bank)}
                    >
                      <MdDeleteOutline />
                    </IconButton>
                  )}
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      </Stack>
    </Box>
  );
};
