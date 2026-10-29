import { HStack, Field, Input, Box, Text, Button } from "@chakra-ui/react";
import { MdSearch, MdRestore } from "react-icons/md";

interface DateRangeProps {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export const DateRangeFilter = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onSearch,
  onClear,
}: DateRangeProps) => {
  return (
    <HStack
      gap={4}
      width="full"
      align="flex-end"
      bg="white"
      p={4}
      borderRadius="xl"
      border="1px solid"
      borderColor="brand.100"
      shadow="sm"
    >
      <Field.Root flex="1">
        <Field.Label fontSize="xs" fontWeight="bold" color="gray.600">
          From Date
        </Field.Label>
        <Input
          size="sm"
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </Field.Root>

      <Box pb={2}>
        <Text fontSize="sm" color="gray.400">
          to
        </Text>
      </Box>

      <Field.Root flex="1">
        <Field.Label fontSize="xs" fontWeight="bold" color="gray.600">
          To Date
        </Field.Label>
        <Input
          size="sm"
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
        />
      </Field.Root>

      <HStack gap={2}>
        <Button size="sm" colorPalette="brand" onClick={onSearch}>
          <MdSearch /> Search
        </Button>

        <Button size="sm" variant="ghost" color="red.500" onClick={onClear}>
          <MdRestore /> Reset
        </Button>
      </HStack>
    </HStack>
  );
};
