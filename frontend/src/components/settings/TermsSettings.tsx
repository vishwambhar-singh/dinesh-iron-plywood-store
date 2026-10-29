import { useState, useEffect } from "react";
import { Box, Heading, Field, Textarea, HStack, Flex } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { MdOutlineDescription, MdSave, MdEdit, MdClose } from "react-icons/md";
import { TermsSettingsProps } from "@/types/settings";

export const TermsSettings = ({ initialTerms, onSave }: TermsSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localTerms, setLocalTerms] = useState(initialTerms);

  useEffect(() => {
    setLocalTerms(initialTerms);
  }, [initialTerms]);

  const handleCancel = () => {
    setLocalTerms(initialTerms);
    setIsEditing(false);
  };

  const handleAction = async () => {
    if (isEditing) {
      await onSave({
        group: "invoice",
        settings: {
          invoice_terms: localTerms,
        },
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="xl"
      bg="bgMain"
      width="full"
    >
      <Flex mb={6} justify="space-between" align="center">
        <HStack gap={3}>
          <Box color="brandPrimary">
            <MdOutlineDescription size={24} />
          </Box>
          <Heading size="md" color="brandPrimary">
            Invoice Terms
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
                <MdEdit /> Edit T&C
              </>
            )}
          </Button>
        </HStack>
      </Flex>

      <Field.Root>
        <Field.Label fontWeight="bold" color="brand.800">
          Terms & Conditions
        </Field.Label>
        <Textarea
          rows={6}
          value={localTerms}
          disabled={!isEditing}
          onChange={(e) => setLocalTerms(e.target.value)}
          placeholder="E.g. No refund on used items..."
          focusRingColor="brand.500"
          _disabled={{ opacity: 0.8, bg: "bg.muted" }}
        />
        <Field.HelperText mt={2}>
          These terms will appear at the bottom of every generated bill.
        </Field.HelperText>
      </Field.Root>
    </Box>
  );
};
