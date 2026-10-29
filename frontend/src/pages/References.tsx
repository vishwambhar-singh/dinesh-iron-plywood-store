import { useState, useMemo } from "react";
import {
  Box,
  Heading,
  HStack,
  Stack,
  Flex,
  Text,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { MdAdd, MdOutlineDownload, MdPeopleOutline } from "react-icons/md";
import { ReferenceTable } from "@/components/references/ReferenceTable";
import { ReferenceModal } from "@/components/references/ReferenceModal";
import { Reference } from "@/types/references";
import {
  useAddReferenceMutation,
  useDeleteReferenceMutation,
  useGetReferencesQuery,
  useUpdateReferenceMutation,
} from "@/store/apiSlice";
import { CustomDeleteDialog } from "@/components/ui/CustomDeleteDialog";
import { toast } from "@/utils/toast";
import SearchBar from "@/components/ui/SearchBar";
import { transformReferenceData } from "@/exportConfigs/referenceExport";
import { handleExport } from "@/utils/export";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export const References = () => {
  const { exportFormat } = useSystemSettings();
  const { data: allReferences = [], isLoading } = useGetReferencesQuery();
  const [createReference] = useAddReferenceMutation();
  const [deleteReference, { isLoading: isDeleting }] =
    useDeleteReferenceMutation();
  const [updateReference] = useUpdateReferenceMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState<Reference | undefined>(
    undefined,
  );
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [referenceToDelete, setReferenceToDelete] = useState<Reference | null>(
    null,
  );

  const filteredReferences = useMemo(() => {
    return allReferences.filter(
      (ref: Reference) =>
        ref.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.mobile?.includes(searchQuery) ||
        (ref.email &&
          ref.email.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [allReferences, searchQuery]);

  const handleOpenModal = (mode: "add" | "edit" | "view", ref?: Reference) => {
    setModalMode(mode);
    setSelectedRef(ref);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRef(undefined);
  };

  const handleSubmit = async (data: Reference) => {
    try {
      if (modalMode === "add") {
        const currentYear = new Date().getFullYear();
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const referenceNumber = `REF-${currentYear}-${randomPart}`;

        const finalData = {
          ...data,
          referenceNumber,
          status: data.status || "Active",
        };

        await createReference(finalData).unwrap();
        toast.success("Reference Created Successfully");
      } else if (modalMode === "edit") {
        await updateReference({ id: data.id, ...data }).unwrap();
        toast.success("Reference Updated Successfully");
      }
      handleCloseModal();
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Operation failed!";
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (ref: Reference) => {
    setReferenceToDelete(ref);
  };

  const handleConfirmDelete = async () => {
    if (referenceToDelete) {
      try {
        await deleteReference(referenceToDelete.id).unwrap();
        setReferenceToDelete(null);
        toast.success("Reference Deleted Succesfully");
      } catch (error) {
        toast.error("Failed to Delete!");
      }
    }
  };

  const handleExportExcel = () => {
    const data = transformReferenceData(filteredReferences);
    handleExport(data, exportFormat, "References List");
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto">
      <Stack gap={8}>
        <Flex
          justify="space-between"
          align="center"
          bg="white"
          p={6}
          borderRadius="xl"
          border="1px solid"
          borderColor="brand.100"
          shadow="sm"
          mb={6}
        >
          <HStack gap={4}>
            <Box p={2} bg="brand.50" borderRadius="lg" color="brand.600">
              <Icon as={MdPeopleOutline} boxSize={6} />
            </Box>
            <Box>
              <HStack gap={2} mb={0.5}>
                <Heading
                  size="lg"
                  letterSpacing="tight"
                  color="brand.900"
                  lineHeight="short"
                >
                  References
                </Heading>
                <Badge
                  colorPalette="brand"
                  variant="subtle"
                  size="sm"
                  borderRadius="md"
                >
                  Network
                </Badge>
              </HStack>
              <Text color="brand.500" fontSize="sm" fontWeight="medium">
                Manage and track all your business references
              </Text>
            </Box>
          </HStack>

          <Button
            onClick={() => handleOpenModal("add")}
            colorPalette="brand"
            size="md"
            px={6}
            fontWeight="bold"
            borderRadius="lg"
            shadow="sm"
            _hover={{ transform: "translateY(-1px)", shadow: "md" }}
          >
            <Icon as={MdAdd} mr={1} boxSize={5} /> Add Reference
          </Button>
        </Flex>

        <HStack gap="4" width="full" mb={4}>
          <Box flex="1">
            <SearchBar
              placeholder="Search references..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </Box>
          <Button
            variant="outline"
            color="brand.500"
            onClick={handleExportExcel}
          >
            <MdOutlineDownload size="20px" /> Export
          </Button>
        </HStack>

        <ReferenceTable
          references={filteredReferences}
          onView={(ref) => handleOpenModal("view", ref)}
          onEdit={(ref) => handleOpenModal("edit", ref)}
          onDelete={handleDeleteClick}
          isLoading={isLoading}
        />
      </Stack>

      <ReferenceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        reference={selectedRef}
        mode={modalMode}
      />

      <CustomDeleteDialog
        isOpen={!!referenceToDelete}
        onClose={() => setReferenceToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Reference?"
        description={`Are you sure you want to delete this reference ${referenceToDelete?.name}? This action will permanently remove the reference and related records.`}
      />
    </Box>
  );
};

export default References;
