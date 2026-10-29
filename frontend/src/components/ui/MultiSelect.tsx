import {
  Badge,
  CloseButton,
  createListCollection,
  HStack,
  Stack,
} from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { useMemo } from "react";

interface MultiSelectProps {
  options: { label: string; value: string; icon?: any }[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MultiSelect = ({
  options,
  value = [],
  onChange,
  disabled,
  placeholder,
}: MultiSelectProps) => {
  const availableOptions = useMemo(
    () => options.filter((opt) => !value.includes(opt.value)),
    [options, value],
  );

  const collection = useMemo(
    () =>
      createListCollection({
        items: availableOptions,
      }),
    [availableOptions],
  );

  const handleSelect = (selectedValue: string) => {
    onChange([...value, selectedValue]);
  };

  const handleRemove = (itemValue: string) => {
    onChange(value.filter((v) => v !== itemValue));
  };

  return (
    <Stack gap={2} width="full">
      {!disabled && availableOptions.length > 0 && (
        <SelectRoot
          collection={collection}
          value={[]}
          onValueChange={(e) => {
            if (e.value[0]) {
              handleSelect(e.value[0]);
            }
          }}
        >
          <SelectTrigger>
            <SelectValueText placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent zIndex={2000}>
            {availableOptions.map((item) => (
              <SelectItem item={item} key={item.value}>
                <HStack gap={2}>
                  {item.icon && <item.icon />}
                  {item.label}
                </HStack>
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      )}
      <HStack wrap="wrap" gap={2}>
        {value.map((v) => {
          const item = options.find((opt) => opt.value === v);
          return (
            <Badge
              key={v}
              variant="subtle"
              colorPalette="blue"
              size="lg"
              borderRadius="md"
            >
              {item?.icon && <item.icon style={{ marginRight: "4px" }} />}
              {item?.label}
              {!disabled && (
                <CloseButton
                  size="xs"
                  onClick={() => handleRemove(v)}
                  variant="plain"
                />
              )}
            </Badge>
          );
        })}
      </HStack>
    </Stack>
  );
};
