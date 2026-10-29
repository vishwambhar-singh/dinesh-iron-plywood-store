import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Button, Input, Badge, Tabs } from '@chakra-ui/react';
import Modal from '../components/Modal';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { formatToDDMMYY, getLocalDateString } from '../utils/date';

const StaffManagement = () => {
  const activeSystem = useAuthStore(state => state.activeSystem); // 'PAKKA' or 'GODOWN'
  const isPakka = activeSystem === 'PAKKA';

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [ledgerType, setLedgerType] = useState<'PAKKA' | 'ACTUAL'>(isPakka ? 'PAKKA' : 'ACTUAL');
  const [ledger, setLedger] = useState<any[]>([]);

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Keep ledgerType synced with activeSystem
  useEffect(() => {
    setLedgerType(isPakka ? 'PAKKA' : 'ACTUAL');
  }, [isPakka]);

  // Staff Modal
  const [isStaffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({ name: '', mobile: '', role: 'STAFF', salary_pakka: 0, salary_actual: 0 });

  // Ledger Modal
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Salary Payment & Ledger Edit
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [paymentDate, setPaymentDate] = useState(getLocalDateString());

  const [isEditLedgerOpen, setIsEditLedgerOpen] = useState(false);
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const [editLedgerData, setEditLedgerData] = useState({ amount: 0, description: '', transaction_date: '', transaction_type: 'SALARY_PAID' });

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaffList(res.data);
    } catch (err) { }
  };

  const fetchLedger = async () => {
    if (!selectedStaff) return;
    try {
      const res = await api.get(`/staff/${selectedStaff}/ledger?ledger_type=${ledgerType}`);
      setLedger(res.data);
    } catch (err) { }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [selectedStaff, ledgerType]);

  const handleSaveStaff = async () => {
    try {
      if (editingStaffId) {
        await api.put(`/staff/${editingStaffId}`, newStaff);
      } else {
        await api.post('/staff', newStaff);
      }
      setStaffModalOpen(false);
      setEditingStaffId(null);
      setNewStaff({ name: '', mobile: '', role: 'STAFF', salary_pakka: 0, salary_actual: 0 });
      fetchStaff();
    } catch (err) {
      alert('Failed to save staff');
    }
  };

  const openEditStaff = (staff: any) => {
    setNewStaff({ name: staff.name, mobile: staff.mobile, role: staff.role, salary_pakka: staff.salary_pakka, salary_actual: staff.salary_actual });
    setEditingStaffId(staff.id);
    setStaffModalOpen(true);
  };

  const openAddStaff = () => {
    setNewStaff({ name: '', mobile: '', role: 'STAFF', salary_pakka: 0, salary_actual: 0 });
    setEditingStaffId(null);
    setStaffModalOpen(true);
  };

  const handleAddPayment = async (type: 'SALARY_PAID' | 'SALARY_DUE') => {
    if (!paymentAmount || !selectedStaff) return;
    try {
      await api.post(`/staff/${selectedStaff}/ledger`, {
        transaction_date: paymentDate,
        ledger_type: ledgerType,
        transaction_type: type,
        amount: Number(paymentAmount),
        description: paymentDesc || (type === 'SALARY_DUE' ? 'Monthly Salary Due' : 'Salary Payment')
      });
      setPaymentAmount('');
      setPaymentDesc('');
      fetchLedger();
    } catch (err) {
      alert('Failed to add payment');
    }
  };

  const handleDeleteLedger = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this ledger entry?')) return;
    try {
      await api.delete(`/staff/${selectedStaff}/ledger/${entryId}`);
      fetchLedger();
    } catch (err) {
      alert('Failed to delete ledger entry');
    }
  };

  const openEditLedger = (entry: any) => {
    setEditingLedgerId(entry.id);
    setEditLedgerData({ 
      amount: parseFloat(entry.amount), 
      description: entry.description, 
      transaction_date: entry.transaction_date.split('T')[0],
      transaction_type: entry.transaction_type 
    });
    setIsEditLedgerOpen(true);
  };

  const handleUpdateLedger = async () => {
    try {
      await api.put(`/staff/${selectedStaff}/ledger/${editingLedgerId}`, editLedgerData);
      setIsEditLedgerOpen(false);
      fetchLedger();
    } catch (err) {
      alert('Failed to update ledger entry');
    }
  };

  const currentStaff = staffList.find(s => s.id === selectedStaff);

  const calculateBalance = () => {
    const dues = ledger.filter(l => l.transaction_type === 'SALARY_DUE').reduce((acc, l) => acc + parseFloat(l.amount), 0);
    const paids = ledger.filter(l => l.transaction_type === 'SALARY_PAID').reduce((acc, l) => acc + parseFloat(l.amount), 0);
    return dues - paids; // Positive means company owes staff
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.mobile.includes(searchQuery);
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="var(--text-primary)">Staff Management</Heading>
        <Button colorScheme="blue" onClick={openAddStaff}>+ Add Staff</Button>
      </Flex>

      <Flex gap={4} mb={4}>
        <Input 
          placeholder="Search staff by name or mobile..." 
          bg="white" 
          maxW="300px" 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
        />
        <select className="form-input" style={{ maxWidth: '200px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="STAFF">General Staff</option>
          <option value="DRIVER">Driver</option>
          <option value="MANAGER">Manager</option>
        </select>
      </Flex>

      <Box bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="var(--border-color)" overflow="hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Mobile</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Salary ({isPakka ? 'Pakka' : 'Actual'})</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(staff => (
              <tr key={staff.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{staff.name}</td>
                <td style={{ padding: '12px 16px' }}>{staff.role}</td>
                <td style={{ padding: '12px 16px' }}>{staff.mobile}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>₹{isPakka ? staff.salary_pakka : staff.salary_actual}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <Flex gap={2} justify="center">
                    <Button 
                      size="sm" 
                      colorPalette="blue" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedStaff(staff.id);
                        setIsLedgerOpen(true);
                      }}
                    >
                      Ledger
                    </Button>
                    <Button size="sm" variant="ghost" colorPalette="gray" onClick={() => openEditStaff(staff)}>
                      Edit
                    </Button>
                  </Flex>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'gray' }}>No staff found.</td></tr>
            )}
          </tbody>
        </table>
      </Box>

      {/* Ledger Modal */}
      <Modal isOpen={isLedgerOpen} onClose={() => setIsLedgerOpen(false)} title="Staff Ledger" maxWidth="800px">
        {currentStaff ? (
          <Box>
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading size="md">{currentStaff.name}</Heading>
                <Text color="gray.500" fontSize="sm">{currentStaff.mobile} • {currentStaff.role}</Text>
              </Box>
              <Flex gap={4}>
                {isPakka && (
                  <Box textAlign="right" p={2} bg="blue.50" borderRadius="md" minW="120px">
                    <Text fontSize="xs" color="blue.600" fontWeight="bold">Pakka Salary</Text>
                    <Text fontWeight="bold">₹{currentStaff.salary_pakka}</Text>
                  </Box>
                )}
                {!isPakka && (
                  <Box textAlign="right" p={2} bg="orange.50" borderRadius="md" minW="120px">
                    <Text fontSize="xs" color="orange.600" fontWeight="bold">Actual Salary</Text>
                    <Text fontWeight="bold">₹{currentStaff.salary_actual}</Text>
                  </Box>
                )}
              </Flex>
            </Flex>

            <Tabs.Root value={ledgerType} onValueChange={(details) => setLedgerType(details.value as any)}>
              <Tabs.List>
                {isPakka && <Tabs.Trigger value="PAKKA" fontWeight="bold" p={3}>Formal Ledger (Pakka)</Tabs.Trigger>}
                {!isPakka && <Tabs.Trigger value="ACTUAL" fontWeight="bold" p={3}>Actual Ledger (Godown)</Tabs.Trigger>}
              </Tabs.List>

              <Tabs.Content value="PAKKA" p={0} pt={4}>
                <Flex gap={4} mb={6} p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="var(--border-color)">
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>Date</Text>
                    <Input type="date" bg="white" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>Amount</Text>
                    <Input type="number" bg="white" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} />
                  </Box>
                  <Box flex={2}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>Description</Text>
                    <Input bg="white" value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} placeholder="e.g. Salary Advance" />
                  </Box>
                  <Flex direction="column" gap={2} mt={6}>
                    <Button size="sm" variant="ghost" colorPalette="red" border="1px solid" onClick={() => handleAddPayment('SALARY_DUE')}>Log Due</Button>
                    <Button size="sm" colorPalette="green" bg="green.500" color="white" onClick={() => handleAddPayment('SALARY_PAID')}>Pay Salary</Button>
                  </Flex>
                </Flex>

                <Flex justify="space-between" align="center" mb={4} p={3} bg="var(--bg-primary)" borderRadius="md">
                  <Text fontWeight="bold">Ledger Transactions</Text>
                  <Badge colorScheme={calculateBalance() > 0 ? 'red' : 'green'} p={2} borderRadius="md">
                    {calculateBalance() > 0 ? `To Pay: ₹${calculateBalance().toFixed(2)}` : `Advance/Settled: ₹${Math.abs(calculateBalance()).toFixed(2)}`}
                  </Badge>
                </Flex>

                <Box maxH="400px" overflowY="auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ background: '#f3f4f6', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map(l => (
                        <tr key={l.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '8px' }}>{formatToDDMMYY(l.transaction_date)}</td>
                          <td style={{ padding: '8px' }}>
                            <Badge colorPalette={l.transaction_type === 'SALARY_PAID' ? 'green' : 'red'}>
                              {l.transaction_type === 'SALARY_PAID' ? 'PAID' : 'DUE'}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px' }}>{l.description}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: l.transaction_type === 'SALARY_PAID' ? 'var(--brand-green)' : 'var(--brand-maroon)' }}>
                            ₹{parseFloat(l.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {ledger.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'gray' }}>No transactions recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </Box>
              </Tabs.Content>
              <Tabs.Content value="ACTUAL" p={0} pt={4}>
                {/* Reuse same UI but colors adapt based on scheme */}
                <Flex gap={4} mb={6} p={4} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>Date</Text>
                    <Input type="date" bg="white" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>Amount</Text>
                    <Input type="number" bg="white" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} />
                  </Box>
                  <Box flex={2}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>Description</Text>
                    <Input bg="white" value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} placeholder="e.g. Cash Advance" />
                  </Box>
                  <Flex direction="column" gap={2} mt={6}>
                    <Button size="sm" variant="ghost" colorPalette="red" border="1px solid" onClick={() => handleAddPayment('SALARY_DUE')}>Log Due</Button>
                    <Button size="sm" colorPalette="orange" bg="orange.500" color="white" onClick={() => handleAddPayment('SALARY_PAID')}>Pay Salary</Button>
                  </Flex>
                </Flex>

                <Flex justify="space-between" align="center" mb={4} p={3} bg="var(--bg-primary)" borderRadius="md">
                  <Text fontWeight="bold">Ledger Transactions</Text>
                  <Badge colorScheme={calculateBalance() > 0 ? 'red' : 'green'} p={2} borderRadius="md">
                    {calculateBalance() > 0 ? `To Pay: ₹${calculateBalance().toFixed(2)}` : `Advance/Settled: ₹${Math.abs(calculateBalance()).toFixed(2)}`}
                  </Badge>
                </Flex>

                <Box maxH="400px" overflowY="auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ background: '#f3f4f6', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map(l => (
                        <tr key={l.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '8px' }}>{formatToDDMMYY(l.transaction_date)}</td>
                          <td style={{ padding: '8px' }}>
                            <Badge colorPalette={l.transaction_type === 'SALARY_PAID' ? 'green' : 'red'}>
                              {l.transaction_type === 'SALARY_PAID' ? 'PAID' : 'DUE'}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px' }}>{l.description}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: l.transaction_type === 'SALARY_PAID' ? 'var(--brand-green)' : 'var(--brand-maroon)' }}>
                            ₹{parseFloat(l.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {ledger.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'gray' }}>No transactions recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </Box>
              </Tabs.Content>
            </Tabs.Root>
          </Box>
        ) : (
          <Text>No staff selected.</Text>
        )}
      </Modal>

      {/* Staff Form Modal */}
      <Modal isOpen={isStaffModalOpen} onClose={() => setStaffModalOpen(false)} title={editingStaffId ? "Edit Staff Member" : "Add New Staff Member"} maxWidth="500px">
        <Box mb={3}>
          <Text fontWeight="bold" fontSize="sm" mb={1}>Name</Text>
          <Input value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
        </Box>
        <Box mb={3}>
          <Text fontWeight="bold" fontSize="sm" mb={1}>Mobile</Text>
          <Input value={newStaff.mobile} onChange={e => setNewStaff({ ...newStaff, mobile: e.target.value })} />
        </Box>
        <Box mb={3}>
          <Text fontWeight="bold" fontSize="sm" mb={1}>Role</Text>
          <select className="form-input" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
            <option value="STAFF">General Staff</option>
            <option value="DRIVER">Driver</option>
            <option value="MANAGER">Manager</option>
          </select>
        </Box>
        <Flex gap={4}>
          {isPakka && (
            <Box flex={1}>
              <Text fontWeight="bold" fontSize="sm" mb={1}>Salary (Pakka)</Text>
              <Input type="number" value={newStaff.salary_pakka} onChange={e => setNewStaff({ ...newStaff, salary_pakka: Number(e.target.value) })} />
            </Box>
          )}
          {!isPakka && (
            <Box flex={1}>
              <Text fontWeight="bold" fontSize="sm" mb={1}>Salary (Actual)</Text>
              <Input type="number" value={newStaff.salary_actual} onChange={e => setNewStaff({ ...newStaff, salary_actual: Number(e.target.value) })} />
            </Box>
          )}
        </Flex>
        <Flex justify="flex-end" mt={6} gap={3}>
          <Button variant="ghost" onClick={() => setStaffModalOpen(false)}>Cancel</Button>
          <Button colorPalette="blue" bg="blue.500" color="white" onClick={handleSaveStaff}>Save</Button>
        </Flex>
      </Modal>

      {/* Edit Ledger Entry Modal */}
      <Modal isOpen={isEditLedgerOpen} onClose={() => setIsEditLedgerOpen(false)} title="Edit Ledger Entry" maxWidth="400px">
        <Box mb={3}>
          <Text fontWeight="bold" fontSize="sm" mb={1}>Date</Text>
          <Input type="date" value={editLedgerData.transaction_date} onChange={e => setEditLedgerData({...editLedgerData, transaction_date: e.target.value})} />
        </Box>
        <Box mb={3}>
          <Text fontWeight="bold" fontSize="sm" mb={1}>Amount</Text>
          <Input type="number" value={editLedgerData.amount} onChange={e => setEditLedgerData({...editLedgerData, amount: Number(e.target.value)})} />
        </Box>
        <Box mb={3}>
          <Text fontWeight="bold" fontSize="sm" mb={1}>Type</Text>
          <select className="form-input" value={editLedgerData.transaction_type} onChange={e => setEditLedgerData({...editLedgerData, transaction_type: e.target.value})}>
            <option value="SALARY_PAID">Salary Paid (Advance)</option>
            <option value="SALARY_DUE">Salary Due (To Pay)</option>
          </select>
        </Box>
        <Box mb={3}>
          <Text fontWeight="bold" fontSize="sm" mb={1}>Description</Text>
          <Input value={editLedgerData.description} onChange={e => setEditLedgerData({...editLedgerData, description: e.target.value})} />
        </Box>
        <Flex justify="flex-end" mt={6} gap={3}>
          <Button variant="ghost" onClick={() => setIsEditLedgerOpen(false)}>Cancel</Button>
          <Button colorPalette="blue" bg="blue.500" color="white" onClick={handleUpdateLedger}>Update</Button>
        </Flex>
      </Modal>

    </Box>
  );
};

export default StaffManagement;
