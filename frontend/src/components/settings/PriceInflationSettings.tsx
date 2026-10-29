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
  Badge,
  Group,
  InputElement,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import {
  MdTrendingUp,
  MdSave,
  MdEdit,
  MdClose,
  MdInfoOutline,
} from "react-icons/md";
import { toast } from "@/utils/toast";

interface PriceInflationSettingsProps {
  initialPercent: string;
  onSave: (data: any) => Promise<void>;
}

export const PriceInflationSettings = ({
  initialPercent,
  onSave,
}: PriceInflationSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [percent, setPercent] = useState<string>(initialPercent);

  useEffect(() => {
    setPercent(initialPercent);
  }, [initialPercent]);

  const handleCancel = () => {
    setPercent(initialPercent);
    setIsEditing(false);
  };

  const handleAction = async () => {
    if (isEditing) {
      const numPercent = Number(percent);

      if (numPercent < 0) {
        toast.error("Percentage cannot be negative!");
        return;
      }

      await onSave({
        group: "pricing",
        settings: {
          inflation_percent: String(numPercent),
        },
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const sampleAmount = 100;
  const inflatedPrice =
    sampleAmount + (sampleAmount * (Math.max(0, Number(percent)) || 0)) / 100;

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
          <Circle size="10" bg="blue.100" color="blue.600">
            <MdTrendingUp size={20} />
          </Circle>
          <Box>
            <Heading size="md" color="brand.800">
              Price Inflation Settings
            </Heading>
            <Text fontSize="xs" color="fg.muted">
              Automatically increase sale prices by a fixed percentage
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
        <Field.Root>
          <Field.Label fontWeight="bold" color="brand.800">
            Inflation Percentage
          </Field.Label>
          <Group width="full">
            <Input
              type="number"
              value={percent === "0" ? "" : percent}
              disabled={!isEditing}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) {
                  setPercent(val);
                }
              }}
              placeholder="e.g. 10"
              min={0}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              onKeyDown={(e) =>
                ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
              }
            />
            <InputElement placement="end">
              <Text fontWeight="bold" color="fg.muted" pr={6}>
                %
              </Text>
            </InputElement>
          </Group>
        </Field.Root>

        <Box
          p={4}
          borderRadius="lg"
          bg="brand.50"
          borderWidth="1px"
          borderColor="brand.200"
          borderStyle="dashed"
        >
          <Flex justify="space-between" align="center">
            <HStack gap={2} color="brand.700">
              <MdInfoOutline />
              <Text fontSize="sm" fontWeight="semibold">
                Live Preview:
              </Text>
            </HStack>
            <HStack gap={2}>
              <Text fontSize="sm" color="fg.muted">
                On ₹100 Base Price →
              </Text>
              <Badge colorPalette="blue" variant="solid" size="lg">
                ₹{inflatedPrice.toFixed(2)} Final Price
              </Badge>
            </HStack>
          </Flex>
        </Box>
      </Stack>
    </Box>
  );
};
