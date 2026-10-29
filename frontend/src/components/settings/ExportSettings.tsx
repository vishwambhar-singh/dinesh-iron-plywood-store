import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Field,
  HStack,
  Flex,
  Stack,
  Text,
  Circle,
  createListCollection,
} from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MdFileDownload, MdSave, MdEdit, MdClose } from "react-icons/md";
import { toast } from "@/utils/toast";

const exportFormats = createListCollection({
  items: [
    { label: "Excel (.xlsx)", value: "xlsx" },
    { label: "CSV (.csv)", value: "csv" },
    { label: "JSON (.json)", value: "json" },
  ],
});

interface ExportSettingsProps {
  initialFormat: string;
  onSave: (data: any) => Promise<void>;
}

export const ExportSettings = ({
  initialFormat,
  onSave,
}: ExportSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [format, setFormat] = useState<string[]>([initialFormat]);

  useEffect(() => {
    setFormat([initialFormat]);
  }, [initialFormat]);

  const handleCancel = () => {
    setFormat([initialFormat]);
    setIsEditing(false);
  };

  const handleAction = async () => {
    if (isEditing) {
      try {
        await onSave({
          group: "export_settings",
          settings: {
            preferred_format: format[0],
          },
        });
        setIsEditing(false);
      } catch (error) {
        toast.error("Error saving export settings");
      }
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
          <Circle size="10" bg="brand.50" color="brand.600">
            <MdFileDownload size={20} />
          </Circle>
          <Box>
            <Heading size="md" color="brand.800">
              Data Export Preference
            </Heading>
            <Text fontSize="xs" color="fg.muted">
              Select your default download format
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
                <MdSave /> Save
              </>
            ) : (
              <>
                <MdEdit /> Edit
              </>
            )}
          </Button>
        </HStack>
      </Flex>

      <Stack gap={6}>
        <Field.Root>
          <Field.Label fontWeight="bold" color="brand.800">
            Export File Type
          </Field.Label>
          <SelectRoot
            collection={exportFormats}
            disabled={!isEditing}
            value={format}
            onValueChange={(details) => setFormat(details.value)}
          >
            <SelectTrigger>
              <SelectValueText placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {exportFormats.items.map((item) => (
                <SelectItem item={item} key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </Field.Root>
      </Stack>
    </Box>
  );
};
