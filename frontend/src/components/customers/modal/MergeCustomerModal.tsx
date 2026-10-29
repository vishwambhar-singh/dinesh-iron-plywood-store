import {
  Box,
  HStack,
  Text,
  Input,
  Stack,
  Field,
  Badge,
} from "@chakra-ui/react";
import { CustomModal } from "@/components/ui/CustomModal";
import { useState, useMemo } from "react";
import { Customer } from "@/types/customer";
import { useMergeCustomersMutation } from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface MergeCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
}

export const MergeCustomerModal = ({
  isOpen,
  onClose,
  customers,
}: MergeCustomerModalProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [winnerId, setWinnerId] = useState<string>("");
  const [winnerName, setWinnerName] = useState("");
  const [winnerMobile, setWinnerMobile] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mergeCustomers] = useMergeCustomersMutation();

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.mobile?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSetWinner = (customer: Customer) => {
    setWinnerId(customer.id || "");
    setWinnerName(customer.name);
    setWinnerMobile(
      customer.mobile?.startsWith("DUMMY_") ? "" : customer.mobile || ""
    );
  };

  const handleMerge = async () => {
    if (!winnerId) {
      toast.error("Please select a primary (winner) customer");
      return;
    }
    const loserIds = selectedIds.filter((id) => id !== winnerId);
    if (loserIds.length === 0) {
      toast.error("Select at least one duplicate to merge into the primary");
      return;
    }
    if (!winnerMobile || winnerMobile.startsWith("DUMMY_") || !/^[6-9]\d{9}$/.test(winnerMobile)) {
      toast.error("Please provide a valid 10-digit mobile number for the primary customer");
      return;
    }

    // Check uniqueness
    const duplicate = customers.find(
      (c) => c.mobile === winnerMobile && c.id !== winnerId && !loserIds.includes(c.id || "")
    );
    if (duplicate) {
      toast.error(`Mobile number ${winnerMobile} is already taken by '${duplicate.name}'. Please choose another.`);
      return;
    }

    try {
      await mergeCustomers({
        winnerId,
        loserIds,
        winnerData: { name: winnerName, mobile: winnerMobile },
      }).unwrap();
      toast.success("Customers merged successfully!");
      setSelectedIds([]);
      setWinnerId("");
      setWinnerName("");
      setWinnerMobile("");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to merge customers");
    }
  };

  const handleClose = () => {
    setSelectedIds([]);
    setWinnerId("");
    setWinnerName("");
    setWinnerMobile("");
    setSearchQuery("");
    onClose();
  };

  return (
    <CustomModal
      title="Merge Duplicate Customers"
      open={isOpen}
      onOpenChange={({ open }) => !open && handleClose()}
      onConfirm={handleMerge}
      confirmLabel="Merge Customers"
      mode="add"
    >
      <Stack gap={6}>
        <Text fontSize="sm" color="gray.600">
          Select the customers you want to merge, then choose the primary
          customer whose name and mobile will be kept. All sales, returns, and
          ledger entries from duplicates will be moved to the primary.
        </Text>

        <Input
          placeholder="Search customers by name or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {winnerId && (
          <Box
            p={4}
            bg="green.50"
            borderRadius="lg"
            border="1px solid"
            borderColor="green.200"
          >
            <Text fontSize="sm" fontWeight="bold" color="green.700" mb={2}>
              Primary Customer (Winner)
            </Text>
            <HStack gap={4}>
              <Field.Root flex={1}>
                <Field.Label fontSize="xs">Name</Field.Label>
                <Input
                  size="sm"
                  value={winnerName}
                  onChange={(e) => setWinnerName(e.target.value)}
                />
              </Field.Root>
              <Field.Root flex={1}>
                <Field.Label fontSize="xs">Mobile</Field.Label>
                <Input
                  size="sm"
                  value={winnerMobile}
                  onChange={(e) => setWinnerMobile(e.target.value)}
                />
              </Field.Root>
            </HStack>
          </Box>
        )}

        <Box maxH="350px" overflowY="auto" borderWidth="1px" borderRadius="lg">
          {filteredCustomers.map((customer) => {
            const isSelected = selectedIds.includes(customer.id || "");
            const isWinner = winnerId === customer.id;
            return (
              <HStack
                key={customer.id}
                p={3}
                borderBottom="1px solid"
                borderColor="gray.100"
                bg={isWinner ? "green.50" : isSelected ? "brand.50" : "white"}
                _hover={{ bg: isWinner ? "green.50" : "gray.50" }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(customer.id || "")}
                />
                <Box flex={1}>
                  <HStack gap={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      {customer.name}
                    </Text>
                    {customer.needsReview && (
                      <Badge
                        colorPalette="orange"
                        variant="subtle"
                        size="sm"
                      >
                        Review
                      </Badge>
                    )}
                    {isWinner && (
                      <Badge colorPalette="green" variant="subtle" size="sm">
                        Primary
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {customer.mobile?.startsWith("DUMMY_")
                      ? "No mobile"
                      : customer.mobile}
                  </Text>
                </Box>
                {isSelected && !isWinner && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="green"
                    onClick={() => handleSetWinner(customer)}
                  >
                    Set Primary
                  </Button>
                )}
                {isSelected && isWinner && (
                  <Badge colorPalette="green" size="sm">
                    ✓ Primary
                  </Badge>
                )}
                {!isSelected && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorPalette="brand"
                    onClick={() => {
                      toggleSelect(customer.id || "");
                      if (!winnerId) handleSetWinner(customer);
                    }}
                  >
                    Select
                  </Button>
                )}
              </HStack>
            );
          })}
        </Box>

        {selectedIds.length > 0 && (
          <Text fontSize="sm" color="brand.600" fontWeight="medium">
            {selectedIds.length} customer(s) selected
            {winnerId ? ` — merging into "${winnerName}"` : " — choose a primary"}
          </Text>
        )}
      </Stack>
    </CustomModal>
  );
};
