import { Box, VStack, HStack, Text, Button, Icon } from "@chakra-ui/react";
import { MdCloudDownload } from "react-icons/md";
import { useExportDatabaseMutation } from "@/store/apiSlice";
import { toast } from "@/utils/toast";

export const DatabaseBackup = () => {
  const [exportDatabase, { isLoading }] = useExportDatabaseMutation();

  const handleExport = async () => {
    try {
      await exportDatabase(undefined).unwrap();
      toast.success("Database compiled and dispatched to the system email successfully.");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to trigger database dispatch");
    }
  };

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="brand.100"
      shadow="sm"
    >
      <VStack align="stretch" gap={6}>
        <Box>
          <Text fontSize="lg" fontWeight="bold" color="brand.900" mb={1}>
            Full Database Export
          </Text>
          <Text color="brand.500" fontSize="sm">
            Compile all system data across every table natively into an Excel spreadsheet and dispatch it immediately to the registered System Email address.
          </Text>
        </Box>

        <HStack justify="space-between" align="center">
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              Deliver to: System Administrator Email
            </Text>
          </Box>
          <Button
            colorPalette="brand"
            size="md"
            loading={isLoading}
            loadingText="Compiling..."
            onClick={handleExport}
          >
            <Icon as={MdCloudDownload} mr={2} /> Request Email Backup
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
