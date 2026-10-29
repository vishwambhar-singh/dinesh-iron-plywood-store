import {
  Box,
  HStack,
  Heading,
  Button,
  Icon,
  Badge,
  Flex,
  Text,
} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerModal } from "@/components/customers/modal/CustomerModal";
import { HistoryModal } from "@/components/customers/modal/HistoryModal";
import { MergeCustomerModal } from "@/components/customers/modal/MergeCustomerModal";
import { MdAdd, MdOutlineDownload, MdPeople, MdMerge } from "react-icons/md";
import { useAuth } from "@/hooks/useAuth";
import { ModalMode } from "@/types/inventory";
import { Customer } from "@/types/customer";
import {
  useGetCustomersQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetSalesQuery,
  useGetVouchersQuery,
  useGetReturnsQuery,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { CustomDeleteDialog } from "@/components/ui/CustomDeleteDialog";
import SearchBar from "@/components/ui/SearchBar";
import { handleExport } from "@/utils/export";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { transformCustomerData } from "@/exportConfigs/customerExport";

const CustomerPage = () => {
  const { exportFormat } = useSystemSettings();
  const { isSuperAdmin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >(undefined);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers = [], isLoading } = useGetCustomersQuery();
  const { data: sales = [] } = useGetSalesQuery();
  const { data: vouchers = [] } = useGetVouchersQuery();
  const { data: returns = [] } = useGetReturnsQuery();
  const [addCustomer] = useAddCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: isDeleting }] =
    useDeleteCustomerMutation();

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const openHistoryId = searchParams.get("openHistory");

    if (openHistoryId && customers.length > 0) {
      const targetCustomer = customers.find((c: Customer) => c.id === openHistoryId);

      if (targetCustomer) {
        setSelectedCustomer(targetCustomer);
        setHistoryModalOpen(true);
      }

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("openHistory");
      newParams.delete("tab");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, customers, setSearchParams]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust: Customer) => {
      const matchesSearch =
        cust.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.mobile?.includes(searchQuery) ||
        cust.gstNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [customers, searchQuery]);

  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales.filter((sale: any) => sale.customerId === selectedCustomer.id);
  }, [sales, selectedCustomer]);

  const customerVouchers = useMemo(() => {
    if (!selectedCustomer) return [];
    return vouchers.filter(
      (v: any) =>
        v.relatedEntityType === "CUSTOMER" &&
        v.relatedEntityId === selectedCustomer.id &&
        v.status === "APPROVED"
    );
  }, [vouchers, selectedCustomer]);

  const customerReturns = useMemo(() => {
    if (!selectedCustomer) return [];
    return returns.filter((ret: any) => {
      // Find original sale to confirm customerId
      const originalSale = sales.find((s: any) => s.id === ret.originalSaleId);
      return originalSale?.customerId === selectedCustomer.id;
    });
  }, [returns, sales, selectedCustomer]);

  const handleAdd = () => {
    setSelectedCustomer(undefined);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setHistoryModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete.id).unwrap();
      toast.success("Customer deleted successfully");
      setCustomerToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete customer");
    }
  };

  const handleSubmit = async (data: Customer) => {
    try {
      if (modalMode === "edit" && selectedCustomer) {
        await updateCustomer({ ...data, id: selectedCustomer.id }).unwrap();
        toast.success("Customer updated successfully");
      } else {
        await addCustomer(data).unwrap();
        toast.success("Customer added successfully");
      }
      setModalOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message);
    }
  };

  const handleExportExcel = () => {
    const data = transformCustomerData(filteredCustomers);
    handleExport(data, exportFormat, "Customer List");
  };

  return (
    <Box w="full" p={6} bg="bg.canvas" minH="100vh">
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
            <Icon as={MdPeople} boxSize={6} />
          </Box>
          <Box>
            <HStack gap={2} mb={0.5}>
              <Heading
                size="lg"
                letterSpacing="tight"
                color="brand.900"
                lineHeight="short"
              >
                Customer Management
              </Heading>
              <Badge
                colorPalette="brand"
                variant="subtle"
                size="sm"
                borderRadius="md"
              >
                Clients
              </Badge>
            </HStack>
            <Text color="brand.500" fontSize="sm" fontWeight="medium">
              Manage client profiles, invoices and balances
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          {isSuperAdmin && (
            <Button
              onClick={() => setMergeModalOpen(true)}
              colorPalette="orange"
              variant="outline"
              size="md"
              px={5}
              fontWeight="bold"
              borderRadius="lg"
            >
              <Icon as={MdMerge} mr={1} boxSize={5} /> Merge Customers
            </Button>
          )}
          <Button
            onClick={handleAdd}
            colorPalette="brand"
            size="md"
            px={6}
            fontWeight="bold"
            borderRadius="lg"
            shadow="sm"
            _hover={{ transform: "translateY(-1px)", shadow: "md" }}
          >
            <Icon as={MdAdd} mr={1} boxSize={5} /> Add Customer
          </Button>
        </HStack>
      </Flex>

      <HStack gap="4" width="full" mb={4}>
        <Box flex="1">
          <SearchBar
            placeholder="Search by name, mobile, email & GST..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </Box>
        <Button variant="outline" color="brand.500" onClick={handleExportExcel}>
          <MdOutlineDownload size="20px" /> Export
        </Button>
      </HStack>

      <CustomerTable
        customers={filteredCustomers}
        onView={handleView}
        onEdit={handleEdit}
        onHistory={handleHistory}
        onDelete={(cust) => setCustomerToDelete(cust)}
        loading={isLoading}
      />

      <CustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        customer={selectedCustomer || null}
        mode={modalMode}
        allCustomers={customers}
      />

      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        customer={selectedCustomer || null}
        sales={customerSales}
        customerVouchers={customerVouchers}
        returns={customerReturns}
      />

      <MergeCustomerModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        customers={customers}
      />

      <CustomDeleteDialog
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Delete Customer?"
        description={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone.`}
      />
    </Box>
  );
};

export default CustomerPage;
