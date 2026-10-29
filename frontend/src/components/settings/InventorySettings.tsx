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
  Switch,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { MdOutlineWarningAmber, MdSave, MdEdit, MdClose } from "react-icons/md";
import { InventorySettingsProps } from "@/types/settings";

export const InventorySettings = ({
  initialThreshold,
  initialNotify,
  onSave,
}: InventorySettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [threshold, setThreshold] = useState<number | string>(initialThreshold);
  const [notify, setNotify] = useState(initialNotify);

  useEffect(() => {
    setThreshold(initialThreshold);
    setNotify(initialNotify);
  }, [initialThreshold, initialNotify]);

  const handleCancel = () => {
    setThreshold(initialThreshold);
    setNotify(initialNotify);
    setIsEditing(false);
  };

  const handleAction = async () => {
    if (isEditing) {
      await onSave({
        group: "inventory",
        settings: {
          min_threshold: String(threshold),
          notification_enabled: String(notify),
        },
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const isNotifyDisabled = !isEditing || Number(threshold) <= 0;

  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="xl"
      bg="bg.panel"
      width="full"
    >
      <Flex mb={6} justify="space-between" align="center">
        <HStack gap={3}>
          <Box color="brand.500">
            <MdOutlineWarningAmber size={24} />
          </Box>
          <Heading size="md" color="brand.800">
            Stock Alerts
          </Heading>
        </HStack>

        <HStack gap={3}>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="gray"
              onClick={handleCancel}
            >
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
            Low Stock Threshold
          </Field.Label>
          <Input
            type="number"
            value={threshold === 0 ? "" : threshold}
            disabled={!isEditing}
            placeholder="Enter threshold amount..."
            min={0}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            onKeyDown={(e) =>
              ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setThreshold("");
              } else {
                const num = Number(val);
                setThreshold(num);
              }
            }}
          />
        </Field.Root>

        <HStack
          justify="space-between"
          p={4}
          bg={isNotifyDisabled ? "bg.muted" : "brand.50"}
          borderRadius="lg"
          opacity={isNotifyDisabled ? 0.7 : 1}
          borderWidth="1px"
          borderColor={isNotifyDisabled ? "transparent" : "brand.100"}
        >
          <Box>
            <Text
              fontWeight="bold"
              color={isNotifyDisabled ? "fg.muted" : "brand.800"}
            >
              Enable Notifications
            </Text>
            <Text
              fontSize="xs"
              color={isNotifyDisabled ? "fg.subtle" : "brand.500"}
            >
              {Number(threshold) <= 0
                ? "Set a threshold to enable dashboard alerts."
                : "Get real-time alerts for low stock items."}
            </Text>
          </Box>
          <Switch.Root
            disabled={isNotifyDisabled}
            colorPalette="brand"
            checked={Boolean(notify) && Number(threshold) > 0}
            onCheckedChange={(e) => setNotify(e.checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
      </Stack>
    </Box>
  );
};
