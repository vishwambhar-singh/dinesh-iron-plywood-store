import {
  Box,
  Flex,
  HStack,
  Heading,
  Stack,
  Text,
  Badge,
  Input,
} from "@chakra-ui/react";
import { useGetAnomaliesQuery, useResolveAnomalyMutation, useGetCustomersQuery } from "@/store/apiSlice";
import { useState } from "react";
import { toast } from "@/utils/toast";
import { Button } from "@/components/ui/button";

const MATCH_BADGE: Record<string, { label: string; color: string }> = {
  EXACT_MOBILE: { label: "📱 Exact Mobile Match", color: "green" },
  EXACT_NAME: { label: "👤 Exact Name Match", color: "blue" },
  PARTIAL_NAME: { label: "🔍 Partial Name Match", color: "yellow" },
};

export const AnomaliesTab = () => {
  const { data: anomalies = [], isLoading } = useGetAnomaliesQuery();
  const { data: allCustomers = [] } = useGetCustomersQuery();
  const [resolveAnomaly, { isLoading: isResolving }] = useResolveAnomalyMutation();
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [expandedCreate, setExpandedCreate] = useState<Record<string, boolean>>({});
  const [createForms, setCreateForms] = useState<Record<string, { name: string; mobile: string; email: string; address: string; gstNumber: string }>>({});
  
  if (isLoading) return <Text>Loading anomalies...</Text>;
  
  if (anomalies.length === 0) return <Text p={4}>No anomalies found. Everything looks clean! ✅</Text>;
  
  const handleResolve = async (saleId: string, action: string, payload?: any) => {
    setSelectedSaleId(saleId);
    try {
      await resolveAnomaly({ id: saleId, action, payload }).unwrap();
      toast.success("Anomaly resolved successfully");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to resolve anomaly");
    } finally {
      setSelectedSaleId(null);
    }
  };

  const getSearchResults = (saleId: string) => {
    const query = (searchQueries[saleId] || "").toLowerCase().trim();
    if (!query) return [];
    return allCustomers.filter((c: any) =>
      c.name?.toLowerCase().includes(query) ||
      c.mobile?.includes(query)
    ).slice(0, 8);
  };

  const getCreateForm = (sale: any) => {
    if (createForms[sale.saleId]) return createForms[sale.saleId];
    return {
      name: sale.customerName || "",
      mobile: sale.customerMobile || "",
      email: "",
      address: "",
      gstNumber: "",
    };
  };

  return (
    <Stack gap={4}>
      <HStack justify="space-between" p={3} bg="red.50" borderRadius="lg">
        <Text fontWeight="bold" color="red.700">
          {anomalies.length} anomal{anomalies.length === 1 ? "y" : "ies"} need attention
        </Text>
        <Badge colorPalette="red" size="lg">{anomalies.length}</Badge>
      </HStack>

      {anomalies.map((sale: any) => (
        <Box key={sale.saleId} p={5} borderWidth="1px" borderRadius="xl" bg="white" shadow="sm">
          {/* Bill Info Header */}
          <HStack justify="space-between" mb={2}>
            <Heading size="sm">Bill #{sale.invoiceNumber} — ₹{sale.totalAmount}</Heading>
            <Badge colorPalette="red">{sale.anomalyType === "NULL_CUSTOMER_ID" ? "No Customer ID" : "Orphaned Sale"}</Badge>
          </HStack>
          <Text fontSize="sm" color="gray.600" mb={4}>
            <strong>Logged Info:</strong> Name: {sale.customerName || "N/A"} | Mobile: {sale.customerMobile || "N/A"} | Date: {new Date(sale.saleDate).toLocaleDateString()} | Type: {sale.saleType === "PAKKA" ? "Online Portal" : sale.saleType === "KACCHA" ? "Portal" : sale.saleType}
          </Text>
          
          <Stack gap={3}>
            {/* Auto-Matched Suggestions */}
            {sale.matchedProfiles?.length > 0 && (
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wide">
                  Auto-Matched Suggestions
                </Text>
                <Stack gap={2}>
                  {sale.matchedProfiles.map((profile: any, idx: number) => {
                    const matchInfo = MATCH_BADGE[profile.matchType || "PARTIAL_NAME"] || MATCH_BADGE["PARTIAL_NAME"];
                    return (
                      <Flex key={idx} p={3} bg="blue.50" borderRadius="md" justify="space-between" align="center" wrap="wrap" gap={2}>
                        <Box>
                          <HStack gap={2} mb={1}>
                            <Badge colorPalette={matchInfo?.color || "gray"} size="sm">{matchInfo?.label || "Partial Match"}</Badge>
                          </HStack>
                          <Text fontWeight="bold" fontSize="sm">{profile.name}</Text>
                          <Text fontSize="xs" color="gray.600">{profile.mobile || "No mobile"} {profile.email ? `• ${profile.email}` : ""}</Text>
                        </Box>
                        <Button 
                          size="sm" 
                          colorPalette="blue" 
                          loading={isResolving && selectedSaleId === sale.saleId}
                          onClick={() => handleResolve(sale.saleId, "LINK_EXISTING", { 
                            customerId: profile.id,
                            customerName: profile.name,
                            customerMobile: profile.mobile,
                          })}
                        >
                          Link to Profile
                        </Button>
                      </Flex>
                    );
                  })}
                </Stack>
              </Box>
            )}
             
            {/* Search Existing Customer */}
            <Box p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wide">
                Search Existing Customer
              </Text>
              <Input 
                placeholder="Search by name or mobile..."
                size="sm"
                bg="white"
                value={searchQueries[sale.saleId] || ""}
                onChange={(e) => setSearchQueries((prev) => ({ ...prev, [sale.saleId]: e.target.value }))}
              />
              {getSearchResults(sale.saleId).length > 0 && (
                <Stack gap={1} mt={2} maxH="200px" overflowY="auto">
                  {getSearchResults(sale.saleId).map((c: any) => (
                    <Flex key={c.id} p={2} bg="white" borderRadius="md" borderWidth="1px" borderColor="gray.200" justify="space-between" align="center" gap={2}>
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">{c.name}</Text>
                        <Text fontSize="xs" color="gray.500">{c.mobile || "No mobile"}</Text>
                      </Box>
                      <Button
                        size="xs"
                        colorPalette="blue"
                        variant="outline"
                        loading={isResolving && selectedSaleId === sale.saleId}
                        onClick={() => handleResolve(sale.saleId, "LINK_EXISTING", {
                          customerId: c.id,
                          customerName: c.name,
                          customerMobile: c.mobile,
                        })}
                      >
                        Link
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Create New Customer */}
            <Box p={3} bg="green.50" borderRadius="md">
              <Flex justify="space-between" align="center" cursor="pointer" onClick={() => setExpandedCreate((prev) => ({ ...prev, [sale.saleId]: !prev[sale.saleId] }))}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Create New Customer</Text>
                  <Text fontSize="xs" color="gray.600">Create a fresh customer profile and link this bill to it.</Text>
                </Box>
                <Text fontSize="lg">{expandedCreate[sale.saleId] ? "▾" : "▸"}</Text>
              </Flex>
              
              {expandedCreate[sale.saleId] && (
                <Box mt={3}>
                  <HStack gap={4} mb={3}>
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="medium" mb={1}>Name <Text as="span" color="red.500">*</Text></Text>
                      <Input 
                        size="sm" 
                        value={getCreateForm(sale)?.name || ""} 
                        onChange={(e) => setCreateForms(prev => ({...prev, [sale.saleId]: {...getCreateForm(sale), name: e.target.value}}))}
                        placeholder="John Doe"
                      />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="medium" mb={1}>Mobile <Text as="span" color="red.500">*</Text></Text>
                      <Input 
                        size="sm" 
                        value={getCreateForm(sale)?.mobile || ""} 
                        onChange={(e) => setCreateForms(prev => ({...prev, [sale.saleId]: {...getCreateForm(sale), mobile: e.target.value}}))}
                        placeholder="9876543210"
                      />
                    </Box>
                  </HStack>
                  <HStack gap={4} mb={3}>
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="medium" mb={1}>Email</Text>
                      <Input 
                        size="sm" 
                        value={getCreateForm(sale)?.email || ""} 
                        onChange={(e) => setCreateForms(prev => ({...prev, [sale.saleId]: {...getCreateForm(sale), email: e.target.value}}))}
                        placeholder="john@example.com"
                      />
                    </Box>
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="medium" mb={1}>GST Number</Text>
                      <Input 
                        size="sm" 
                        value={getCreateForm(sale)?.gstNumber || ""} 
                        onChange={(e) => setCreateForms(prev => ({...prev, [sale.saleId]: {...getCreateForm(sale), gstNumber: e.target.value}}))}
                        placeholder="27AADCB2230M1Z2"
                      />
                    </Box>
                  </HStack>
                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>Address</Text>
                    <Input 
                      size="sm" 
                      value={getCreateForm(sale)?.address || ""} 
                      onChange={(e) => setCreateForms(prev => ({...prev, [sale.saleId]: {...getCreateForm(sale), address: e.target.value}}))}
                      placeholder="123 Main St, City"
                    />
                  </Box>
                  <Flex justify="flex-end" mt={3}>
                    <Button size="sm" colorPalette="blue" onClick={() => {
                      const form = getCreateForm(sale);
                      if (!form || !form.name || form.name.trim().length < 3) {
                        toast.error("Valid Name is required (min 3 chars)");
                        return;
                      }
                      if (!form.mobile || !/^[6-9]\d{9}$/.test(form.mobile.trim())) {
                        toast.error("Valid 10-digit Mobile Number is required");
                        return;
                      }
                      
                      const existing = allCustomers.find((c: any) => c.mobile === form.mobile.trim());
                      if (existing) {
                        toast.error(`Mobile ${form.mobile} already belongs to "${existing.name}". Use the search above to link instead.`);
                        return;
                      }

                      handleResolve(sale.saleId, 'CREATE_NEW', {
                        newCustomer: {
                          name: form.name.trim(),
                          mobile: form.mobile.trim(),
                          email: form.email?.trim() || null,
                          address: form.address?.trim() || null,
                          gstNumber: form.gstNumber?.trim() || null
                        }
                      });
                    }}>
                      Create & Link Customer
                    </Button>
                  </Flex>
                </Box>
              )}
            </Box>

            {/* Delete */}
            <Flex p={3} bg="red.50" borderRadius="md" justify="space-between" align="center" wrap="wrap" gap={2}>
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="red.600">Delete Permanently</Text>
                <Text fontSize="xs" color="red.500">Completely deletes the bill and restores the inventory. Cannot be undone.</Text>
              </Box>
              <Button 
                size="sm" 
                colorPalette="red"
                loading={isResolving && selectedSaleId === sale.saleId}
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this bill? This cannot be undone.")) {
                    handleResolve(sale.saleId, "DELETE");
                  }
                }}
              >
                Delete Bill
              </Button>
            </Flex>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};
