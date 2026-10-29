import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  HStack,
  Stack,
  Table,
  Text,
  Badge,
  Input,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { useGetSalarySummaryQuery, usePaySalaryMutation } from "@/store/apiSlice";
import { toast } from "@/utils/toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const SalaryManagement = () => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  
  const { data: response, isLoading } = useGetSalarySummaryQuery({ month: selectedMonth, year: selectedYear });
  const [paySalary, { isLoading: isPaying }] = usePaySalaryMutation();

  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    employee: any;
    amount: string;
    method: string;
    remarks: string;
  } | null>(null);

  const summaryData = response?.data || [];

  const handlePay = async () => {
    if (!paymentModal) return;
    
    const amountNum = Number(paymentModal.amount);
    if (amountNum <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      await paySalary({
        employeeId: paymentModal.employee.employeeId,
        month: selectedMonth,
        year: selectedYear,
        paymentAmount: amountNum,
        paymentMethod: paymentModal.method,
        paymentRemarks: paymentModal.remarks
      }).unwrap();
      
      toast.success("Salary payment recorded and voucher generated");
      setPaymentModal(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to process payment");
    }
  };

  const getAvailableYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = 2026; y <= Math.max(currentYear, 2026); y++) {
      years.push(y);
    }
    return years;
  };

  if (isLoading) return <Text p={4}>Loading salary data...</Text>;

  return (
    <Box p={4} bg="white" borderRadius="lg" shadow="sm">
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Heading size="md">Monthly Salary Settlement</Heading>
        <HStack>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}
          >
            {MONTHS.map((m, i) => {
              // Restrict to Feb 2026 onwards
              if (selectedYear === 2026 && i === 0) return null;
              return <option key={i} value={i + 1}>{m}</option>;
            })}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}
          >
            {getAvailableYears().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </HStack>
      </Flex>

      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader>Employee</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Base Salary</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Leaves</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Advance</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Net Payable</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Paid Amount</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Balance</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Action</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {summaryData.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={9} textAlign="center" py={4} color="gray.500">
                  No employees found with an active salary.
                </Table.Cell>
              </Table.Row>
            ) : (
              summaryData.map((emp: any) => {
                const balance = Math.max(0, emp.netPayable - emp.amountPaid);
                return (
                  <Table.Row key={emp.employeeId}>
                    <Table.Cell fontWeight="medium">{emp.employeeName}</Table.Cell>
                    <Table.Cell textAlign="right">₹{emp.baseSalary}</Table.Cell>
                    <Table.Cell textAlign="right">
                      <Text>{emp.totalLeaves} days</Text>
                      <Text fontSize="xs" color="red.500">-₹{emp.leaveDeduction}</Text>
                    </Table.Cell>
                    <Table.Cell textAlign="right" color="red.500">-₹{emp.advanceTaken}</Table.Cell>
                    <Table.Cell textAlign="right" fontWeight="bold">₹{emp.netPayable}</Table.Cell>
                    <Table.Cell textAlign="right" color="green.600">₹{emp.amountPaid}</Table.Cell>
                    <Table.Cell textAlign="right" fontWeight="bold" color={balance > 0 ? "orange.600" : "green.600"}>
                      ₹{balance.toFixed(2)}
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Badge 
                        colorPalette={
                          emp.status === "PAID" ? "green" : 
                          emp.status === "PARTIALLY_PAID" ? "orange" : "gray"
                        }
                      >
                        {emp.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Button
                        size="sm"
                        colorPalette="blue"
                        disabled={balance <= 0}
                        onClick={() => setPaymentModal({
                          isOpen: true,
                          employee: emp,
                          amount: balance.toString(),
                          method: "CASH",
                          remarks: `Salary for ${MONTHS[selectedMonth-1]} ${selectedYear}`
                        })}
                      >
                        Pay
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Payment Modal */}
      {paymentModal?.isOpen && (
        <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="blackAlpha.500" zIndex={1000} display="flex" alignItems="center" justifyContent="center">
          <Box bg="white" p={6} borderRadius="lg" w="400px" shadow="xl">
            <Heading size="md" mb={4}>Pay Salary: {paymentModal.employee.employeeName}</Heading>
            
            <Stack gap={4}>
              <Box p={3} bg="blue.50" borderRadius="md">
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.600">Net Payable:</Text>
                  <Text fontWeight="bold">₹{paymentModal.employee.netPayable}</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.600">Already Paid:</Text>
                  <Text fontWeight="bold" color="green.600">₹{paymentModal.employee.amountPaid}</Text>
                </Flex>
                <Flex justify="space-between" pt={1} borderTop="1px solid" borderColor="blue.200">
                  <Text fontSize="sm" fontWeight="bold">Remaining Balance:</Text>
                  <Text fontWeight="bold" color="red.600">
                    ₹{(paymentModal.employee.netPayable - paymentModal.employee.amountPaid).toFixed(2)}
                  </Text>
                </Flex>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Payment Amount (₹)</Text>
                <Input 
                  type="number" 
                  value={paymentModal.amount} 
                  onChange={(e) => setPaymentModal({...paymentModal, amount: e.target.value})}
                  max={paymentModal.employee.netPayable - paymentModal.employee.amountPaid}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Payment Method</Text>
                <select 
                  value={paymentModal.method}
                  onChange={(e) => setPaymentModal({...paymentModal, method: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online/UPI</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Remarks</Text>
                <Input 
                  value={paymentModal.remarks} 
                  onChange={(e) => setPaymentModal({...paymentModal, remarks: e.target.value})}
                />
              </Box>

              <HStack justify="flex-end" mt={4}>
                <Button variant="outline" onClick={() => setPaymentModal(null)} disabled={isPaying}>
                  Cancel
                </Button>
                <Button colorPalette="blue" onClick={handlePay} loading={isPaying}>
                  Confirm Payment
                </Button>
              </HStack>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};
