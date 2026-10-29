import React, { useState, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  Grid,
  Field,
  Input,
  Textarea,
  Badge,
} from "@chakra-ui/react";
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseTrigger,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/dialog";
import {
  MdAccountBalanceWallet,
  MdOutlineMoneyOffCsred,
  MdCheckCircle,
  MdCardTravel,
} from "react-icons/md";
import {
  useGetExpensesQuery,
  useAddLeaveMutation,
  useGetLeavesQuery,
  useGetAdvancesQuery,
  useAddAdvanceMutation,
} from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/utils/toast";
import { Leave } from "@/types/leave";
import { MdMonetizationOn } from "react-icons/md";

// Note: Ensure types for Advance exist, or we use `any`
interface Advance {
  id: string;
  employee_id: string;
  amount: number;
  reason: string;
  status: string;
  month: number;
  year: number;
  created_at: string;
}

const MyPayrollWidget = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addLeave, { isLoading: isSubmitting }] = useAddLeaveMutation();

  const { data: globalExpenses = [] } = useGetExpensesQuery();
  const { data: myLeaves = [] } = useGetLeavesQuery();
  const { data: myAdvances = [] } = useGetAdvancesQuery();

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [addAdvance, { isLoading: isSubmittingAdvance }] = useAddAdvanceMutation();
  const [advanceFormData, setAdvanceFormData] = useState({
    amount: "",
    reason: "",
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const calculations = useMemo(() => {
    const fixedAmount = Number(user?.salary || 0);

    // Sum paid amount for this month under "Salary" category for this user
    const paidAmount = globalExpenses
      .filter(
        (exp: any) =>
          exp.employee_id === user?.id &&
          exp.category === "Salary" &&
          new Date(exp.date).getMonth() + 1 === currentMonth &&
          new Date(exp.date).getFullYear() === currentYear
      )
      .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);

    // Sum approved leave days
    const approvedLeaves = myLeaves.filter(
      (l: Leave) =>
        l.employee_id === user?.id &&
        l.status === "APPROVED" &&
        l.month === currentMonth &&
        l.year === currentYear
    );

    const takenDays = approvedLeaves.reduce(
      (sum: number, l: Leave) => sum + Number(l.days),
      0
    );

    const deduction = Math.round((fixedAmount / 30) * takenDays);
    const netSalary = fixedAmount - deduction;
    
    // Sum approved advances this month
    const approvedAdvances = myAdvances.filter(
      (a: Advance) =>
        a.employee_id === user?.id &&
        a.status === "APPROVED" &&
        a.month === currentMonth &&
        a.year === currentYear
    );
    const advanceDeduction = approvedAdvances.reduce(
      (sum: number, a: Advance) => sum + Number(a.amount),
      0
    );

    const balance = netSalary - paidAmount - advanceDeduction;

    return { fixedAmount, paidAmount, takenDays, deduction, netSalary, balance, advanceDeduction };
  }, [user, globalExpenses, myLeaves, myAdvances, currentMonth, currentYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addLeave(formData).unwrap();
      toast.success("Leave application submitted");
      setIsModalOpen(false);
      setFormData({ startDate: "", endDate: "", reason: "" });
    } catch {
      toast.error("Failed to submit leave application");
    }
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAdvance({ ...advanceFormData, amount: Number(advanceFormData.amount) }).unwrap();
      toast.success("Advance request submitted");
      setIsAdvanceModalOpen(false);
      setAdvanceFormData({ amount: "", reason: "" });
    } catch {
      toast.error("Failed to submit advance request");
    }
  };

  return (
    <>
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
        gap={4}
        bg="white"
        p={5}
        borderRadius="xl"
        border="1px solid"
        borderColor="brand.100"
        shadow="sm"
        w="full"
        mt={6}
        mb={4}
      >
        <Box
          p={4}
          bg="blue.50"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="blue.500"
        >
          <HStack mb={2}>
            <Icon as={MdAccountBalanceWallet} color="blue.500" />
            <Text fontSize="sm" fontWeight="bold" color="blue.800">
              Fixed Monthly Salary
            </Text>
          </HStack>
          <Heading size="md" color="blue.900">
            Rs. {calculations.fixedAmount.toLocaleString()}
          </Heading>
        </Box>

        <Box
          p={4}
          bg="orange.50"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="orange.500"
        >
          <HStack mb={2}>
            <Icon as={MdOutlineMoneyOffCsred} color="orange.500" />
            <Text fontSize="sm" fontWeight="bold" color="orange.800">
              Leave Deduction ({calculations.takenDays} days)
            </Text>
          </HStack>
          <Heading size="md" color="orange.900">
            Rs. {calculations.deduction.toLocaleString()}
          </Heading>
        </Box>

        <Box
          p={4}
          bg="green.50"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="green.500"
        >
          <HStack mb={2}>
            <Icon as={MdCheckCircle} color="green.500" />
            <Text fontSize="sm" fontWeight="bold" color="green.800">
              Paid This Month
            </Text>
          </HStack>
          <Heading size="md" color="green.900">
            Rs. {calculations.paidAmount.toLocaleString()}
          </Heading>
          <Text fontSize="xs" color="green.700" mt={1}>
            Net Payable: Rs. {calculations.netSalary.toLocaleString()}
          </Text>
          {calculations.advanceDeduction > 0 && (
            <Text fontSize="xs" color="red.600" mt={1} fontWeight="bold">
              - Rs. {calculations.advanceDeduction.toLocaleString()} Advance
            </Text>
          )}
        </Box>

        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={3}
        >
          <Heading size="md" color={calculations.balance > 0 ? "brand.600" : "gray.500"} mb={2}>
            Balance: Rs. {calculations.balance.toLocaleString()}
          </Heading>
          <VStack gap={2} w="full">
            <Button
              colorPalette="brand"
              size="sm"
              w="full"
              onClick={() => setIsModalOpen(true)}
            >
              <Icon as={MdCardTravel} mr={2} /> Apply Leave
            </Button>
            <Button
              colorPalette="blue"
              size="sm"
              w="full"
              onClick={() => setIsAdvanceModalOpen(true)}
            >
              <Icon as={MdMonetizationOn} mr={2} /> Request Advance
            </Button>
          </VStack>
        </Box>
      </Grid>

      <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody>
              <VStack gap={4}>
                <Field.Root required>
                  <Field.Label>Start Date</Field.Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>End Date</Field.Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Reason</Field.Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Provide a valid reason"
                  />
                </Field.Root>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="ghost" mr={3}>
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button colorPalette="brand" type="submit" loading={isSubmitting}>
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>

      <DialogRoot open={isAdvanceModalOpen} onOpenChange={(e) => setIsAdvanceModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={handleAdvanceSubmit}>
            <DialogHeader>
              <DialogTitle>Request Salary Advance</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody>
              <VStack gap={4}>
                <Field.Root required>
                  <Field.Label>Amount (Rs.)</Field.Label>
                  <Input
                    type="number"
                    value={advanceFormData.amount}
                    onChange={(e) =>
                      setAdvanceFormData({ ...advanceFormData, amount: e.target.value })
                    }
                    placeholder="E.g. 5000"
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Reason</Field.Label>
                  <Textarea
                    value={advanceFormData.reason}
                    onChange={(e) =>
                      setAdvanceFormData({ ...advanceFormData, reason: e.target.value })
                    }
                    placeholder="Provide a valid reason for the request"
                  />
                </Field.Root>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="ghost" mr={3}>
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button colorPalette="blue" type="submit" loading={isSubmittingAdvance}>
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>

       {/* Basic History */}
       <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mt={4}>
         {myLeaves.length > 0 && (
            <Box bg="white" p={4} borderRadius="xl" shadow="sm">
               <Text fontWeight="bold" mb={3} color="gray.700">Recent Leaves</Text>
               <VStack align="stretch" gap={2}>
                 {myLeaves.filter((l: Leave) => l.employee_id === user?.id).slice(0, 5).map((l: Leave) => (
                   <HStack key={l.id} justify="space-between" p={3} border="1px solid" borderColor="gray.100" borderRadius="md">
                     <VStack align="start" gap={0}>
                       <Text fontSize="sm" fontWeight="bold">{new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()} ({l.days} days)</Text>
                       <Text fontSize="xs" color="gray.500">{l.reason}</Text>
                     </VStack>
                     <Badge colorPalette={l.status === 'APPROVED' ? 'green' : l.status === 'REJECTED' ? 'red' : 'yellow'}>{l.status}</Badge>
                   </HStack>
                 ))}
               </VStack>
            </Box>
         )}

         {myAdvances.length > 0 && (
            <Box bg="white" p={4} borderRadius="xl" shadow="sm">
               <Text fontWeight="bold" mb={3} color="gray.700">Recent Advance Requests</Text>
               <VStack align="stretch" gap={2}>
                 {myAdvances.filter((a: Advance) => a.employee_id === user?.id).slice(0, 5).map((a: Advance) => (
                   <HStack key={a.id} justify="space-between" p={3} border="1px solid" borderColor="gray.100" borderRadius="md">
                     <VStack align="start" gap={0}>
                       <Text fontSize="sm" fontWeight="bold">Rs. {Number(a.amount).toLocaleString()}</Text>
                       <Text fontSize="xs" color="gray.500">{a.reason}</Text>
                     </VStack>
                     <Badge colorPalette={a.status === 'APPROVED' ? 'green' : a.status === 'REJECTED' ? 'red' : 'yellow'}>{a.status}</Badge>
                   </HStack>
                 ))}
               </VStack>
            </Box>
         )}
       </Grid>
    </>
  );
};

export default MyPayrollWidget;
