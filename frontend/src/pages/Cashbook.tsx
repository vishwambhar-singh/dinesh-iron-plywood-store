import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import api from '../utils/api';
import { Search, History, Plus, CreditCard, User, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@chakra-ui/react';
import BankAccountsTab from '../components/BankAccountsTab';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StatementDocument } from '../components/StatementPDF';
import { Printer } from 'lucide-react';

import SearchableSelect from '../components/SearchableSelect';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAuthStore } from '../store/useAuthStore';
import { formatToDDMMYY, getLocalDateString, formatToYYYYMMDD } from '../utils/date';

const Cashbook = ({ panelMode = 'PAKKA' }: { panelMode?: 'PAKKA' | 'ACTUAL' }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [partySummaries, setPartySummaries] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'TRANSACTIONS' | 'PARTIES' | 'ACCOUNTS'>('TRANSACTIONS');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [partyFilter, setPartyFilter] = useState('ALL');
    const [isManageBanksOpen, setIsManageBanksOpen] = useState(false);
    const [viewTxn, setViewTxn] = useState<any>(null);
    const [selectedTxns, setSelectedTxns] = useState<string[]>([]);
    const [isBulkDeletePasswordOpen, setIsBulkDeletePasswordOpen] = useState(false);
    const [bulkDeletePassword, setBulkDeletePassword] = useState('');
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    
    const { user } = useAuthStore();
    const canDelete = user?.role === 'ADMIN' || user?.role === 'GODOWN';


    const [accountFilter, setAccountFilter] = useState('ALL');
    const [groupFilter, setGroupFilter] = useState<'DEBTORS' | 'CREDITORS' | 'DUAL'>('DEBTORS');

    const formatIndian = (val: number | string) => {
        const num = parseFloat(val as string) || 0;
        return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatCurrency = (val: number) => {
        const formatted = formatIndian(Math.abs(val));
        return val < 0 ? `- ₹${formatted}` : `₹${formatted}`;
    };

    const renderBalance = (val: number, type: 'CUSTOMER' | 'SUPPLIER') => {
        const absVal = Math.abs(val);
        const formatted = formatIndian(absVal);
        if (absVal === 0) return `${formatted} ${type === 'CUSTOMER' ? 'Dr' : 'Cr'}`;
        
        if (type === 'CUSTOMER') {
            return val >= 0 ? `${formatted} Dr` : `${formatted} Cr`;
        } else {
            return val >= 0 ? `${formatted} Cr` : `${formatted} Dr`;
        }
    };

    const renderBalanceText = (val: number, type: string) => {
        const absVal = Math.abs(val);
        const formatted = absVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (absVal === 0) return `${formatted} ${type === 'CUSTOMER' ? 'Dr' : 'Cr'}`;
        
        if (type === 'CUSTOMER') {
            return val >= 0 ? `${formatted} Dr` : `${formatted} Cr`;
        } else {
            return val >= 0 ? `${formatted} Cr` : `${formatted} Dr`;
        }
    };

    const defaultForm = {
        transaction_date: getLocalDateString(),
        type: 'EXPENSE',
        category: 'INTERNAL_EXPENSES',
        amount: '',
        payment_method: 'BANK/NEFT',
        bank_account_id: '',
        description: '',
        entity_name: '',
        related_type: 'INTERNAL',
        related_id: '',
        is_split: false,
        pakka_amount: '',
        actual_amount: '',
        ledger_mode: panelMode
    };
    const [formData, setFormData] = useState({ ...defaultForm });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useKeyboardShortcuts({
        'Alt+n': () => { setIsAddOpen(true); setEditingId(null); setFormData({ ...defaultForm }); },
        'Alt+t': () => setViewMode('TRANSACTIONS'),
        'Alt+l': () => setViewMode('PARTIES'),
        'Escape': () => { setIsAddOpen(false); setEditingId(null); }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txnRes, sumRes, partyRes, cusRes, supRes, bankRes] = await Promise.all([
                api.get(`/cashbook?mode=${panelMode}`),
                api.get('/cashbook/summary'),
                api.get('/cashbook/party-summaries', { params: { startDate, endDate } }),
                api.get('/customers'),
                api.get('/suppliers'),
                api.get('/bank-accounts')
            ]);
            setTransactions(txnRes.data);
            setSummary(sumRes.data);
            setPartySummaries(partyRes.data);
            setCustomers(cusRes.data);
            setSuppliers(supRes.data);
            setBankAccounts(bankRes?.data || []);
        } catch (err) { 
            console.error("Fetch Error:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [panelMode, startDate, endDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError('');
        try {
            let finalData = { ...formData };
            const totalAmt = parseFloat(formData.amount);
            
            if (formData.ledger_mode === 'PAKKA') {
                finalData.pakka_amount = totalAmt.toString();
                finalData.actual_amount = '0';
            } else {
                finalData.pakka_amount = '0';
                finalData.actual_amount = totalAmt.toString();
            }

            if (editingId) {
                await api.put(`/cashbook/${editingId}`, finalData);
            } else {
                await api.post('/cashbook', finalData);
            }
            setIsAddOpen(false);
            setEditingId(null);
            setFormData({ ...defaultForm });
            fetchData(); 
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to process transaction');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this transaction? It will be permanently removed and related balances updated.")) return;
        try {
            await api.delete(`/cashbook/${id}`);
            fetchData();
        } catch (err) {
            console.error("Delete Error:", err);
            alert("Failed to delete transaction");
        }
    };


    const handleEdit = (row: any) => {
        setEditingId(row.id);
        const amt = panelMode === 'PAKKA' ? parseFloat(row.pakka_amount || 0) : parseFloat(row.actual_amount || 0);
        setFormData({
            transaction_date: formatToYYYYMMDD(row.transaction_date),
            type: row.type,
            category: row.category || 'INTERNAL_EXPENSES',
            amount: amt.toString(),
            payment_method: row.payment_method,
            bank_account_id: row.bank_account_id || '',
            description: row.description || '',
            entity_name: row.entity_name || '',
            related_type: row.related_type || 'INTERNAL',
            related_id: row.related_id || '',
            is_split: !!row.is_split,
            pakka_amount: row.pakka_amount || '',
            actual_amount: row.actual_amount || '',
            ledger_mode: panelMode
        });
        setIsAddOpen(true);
    };


    const partyColumns = [
        { header: 'Particulars', accessor: 'name' },
        { 
            header: 'Type', 
            accessor: 'type', 
            render: (v: string) => <Badge colorScheme={v === 'CUSTOMER' ? 'blue' : 'orange'}>{v === 'CUSTOMER' ? 'Customer' : 'Supplier'}</Badge> 
        },
        { 
            header: 'Opening Balance', 
            accessor: 'openingBalance',
            render: (v: number, row: any) => renderBalance(v, row.type)
        },
        { 
            header: 'Debit', 
            accessor: 'debit',
            render: (v: number) => v === 0 ? '-' : <span style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{formatIndian(v)}</span>
        },
        { 
            header: 'Credit', 
            accessor: 'credit',
            render: (v: number) => v === 0 ? '-' : <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{formatIndian(v)}</span>
        },
        { 
            header: 'Closing Balance', 
            accessor: 'closingBalance',
            render: (v: number, row: any) => renderBalance(v, row.type)
        }
    ];

    const dualColumns = [
        { 
            header: 'Party Entity', 
            accessor: 'name',
            render: (v: string, row: any) => (
                <div>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {v}
                        <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: 'rgba(124, 58, 237, 0.1)',
                            color: '#7c3aed',
                            border: '1px solid rgba(124, 58, 237, 0.25)'
                        }}>Both</span>
                    </div>
                    {row.supplierName && row.supplierName !== v && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Vendor Account: {row.supplierName}
                        </div>
                    )}
                </div>
            )
        },
        { 
            header: 'Customer Due (Lena)', 
            accessor: 'customerBal',
            render: (v: number) => (
                <span style={{ fontWeight: 700, color: v > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                    {renderBalance(v, 'CUSTOMER')}
                </span>
            )
        },
        { 
            header: 'Supplier Due (Dena)', 
            accessor: 'supplierBal',
            render: (v: number) => (
                <span style={{ fontWeight: 700, color: v > 0 ? '#10b981' : 'var(--text-primary)' }}>
                    {renderBalance(v, 'SUPPLIER')}
                </span>
            )
        },
        { 
            header: 'Net Standing Position', 
            accessor: 'netBal',
            render: (_: any, row: any) => {
                const net = row.customerBal - row.supplierBal;
                const absNet = Math.abs(net);
                if (absNet < 0.01) {
                    return <span style={{ fontWeight: 700, color: '#10b981' }}>₹0.00 (Settled)</span>;
                }
                if (net > 0) {
                    return (
                        <span style={{ fontWeight: 800, color: '#ef4444' }}>
                            ₹{formatIndian(net)} Lena (Dr)
                        </span>
                    );
                } else {
                    return (
                        <span style={{ fontWeight: 800, color: '#10b981' }}>
                            ₹{formatIndian(absNet)} Dena (Cr)
                        </span>
                    );
                }
            }
        },
        {
            header: 'Net Position Status',
            accessor: 'status',
            render: (_: any, row: any) => {
                const net = row.customerBal - row.supplierBal;
                if (Math.abs(net) < 0.01) return <Badge colorScheme="green">SETTLED</Badge>;
                if (net > 0) return <Badge colorScheme="purple">RECEIVABLE</Badge>;
                return <Badge colorScheme="orange">PAYABLE</Badge>;
            }
        }
    ];

    
    const accountData = [
        {
            id: 'cash',
            name: 'Cash in Hand',
            opening_balance: 0,
            income: transactions.filter(t => t.type === 'INCOME' && !t.bank_account_id && (panelMode === 'PAKKA' ? parseFloat(t.pakka_amount) > 0 : (parseFloat(t.actual_amount) > 0 || parseFloat(t.pakka_amount) > 0))).reduce((sum, t) => sum + (panelMode === 'PAKKA' ? parseFloat(t.pakka_amount) : (parseFloat(t.actual_amount) > 0 ? parseFloat(t.actual_amount) : parseFloat(t.pakka_amount))), 0),
            expense: transactions.filter(t => t.type === 'EXPENSE' && !t.bank_account_id && (panelMode === 'PAKKA' ? parseFloat(t.pakka_amount) > 0 : (parseFloat(t.actual_amount) > 0 || parseFloat(t.pakka_amount) > 0))).reduce((sum, t) => sum + (panelMode === 'PAKKA' ? parseFloat(t.pakka_amount) : (parseFloat(t.actual_amount) > 0 ? parseFloat(t.actual_amount) : parseFloat(t.pakka_amount))), 0),
        },
        ...bankAccounts.map(b => {
            const ob = panelMode === 'PAKKA' ? parseFloat(b.opening_balance_pakka || 0) : parseFloat(b.opening_balance_actual || 0);
            const income = transactions.filter(t => t.type === 'INCOME' && t.bank_account_id === b.id && (panelMode === 'PAKKA' ? parseFloat(t.pakka_amount) > 0 : (parseFloat(t.actual_amount) > 0 || parseFloat(t.pakka_amount) > 0))).reduce((sum, t) => sum + (panelMode === 'PAKKA' ? parseFloat(t.pakka_amount) : (parseFloat(t.actual_amount) > 0 ? parseFloat(t.actual_amount) : parseFloat(t.pakka_amount))), 0);
            const expense = transactions.filter(t => t.type === 'EXPENSE' && t.bank_account_id === b.id && (panelMode === 'PAKKA' ? parseFloat(t.pakka_amount) > 0 : (parseFloat(t.actual_amount) > 0 || parseFloat(t.pakka_amount) > 0))).reduce((sum, t) => sum + (panelMode === 'PAKKA' ? parseFloat(t.pakka_amount) : (parseFloat(t.actual_amount) > 0 ? parseFloat(t.actual_amount) : parseFloat(t.pakka_amount))), 0);
            return {
                id: b.id,
                name: `${b.bank_name} (${b.account_number})`,
                opening_balance: ob,
                income,
                expense
            };
        })
    ];

    const accountColumns = [
        { header: 'Account Name', accessor: 'name', render: (v: string, row: any) => (
            <button 
                onClick={() => {
                    setAccountFilter(row.id);
                    setViewMode('TRANSACTIONS');
                }}
                style={{
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--accent-primary)', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                }}
            >
                {v}
            </button>
        ) },
        { header: 'Opening Balance', accessor: 'opening_balance', render: (v: number) => `₹${formatIndian(v)}` },
        { header: 'Total In', accessor: 'income', render: (v: number) => <span style={{color: '#10b981'}}>+ ₹{formatIndian(v)}</span> },
        { header: 'Total Out', accessor: 'expense', render: (v: number) => <span style={{color: '#ef4444'}}>- ₹{formatIndian(v)}</span> },
        { header: 'Current Balance', accessor: 'balance', render: (_v: any, row: any) => {
            const bal = row.opening_balance + row.income - row.expense;
            return <strong style={{fontSize: '1.1rem'}}>{formatCurrency(bal)}</strong>;
        }}
    ];

    
    const uniqueParties = Array.from(new Set(transactions.map(t => t.entity_name).filter(Boolean))).sort();

    const filteredTransactions = transactions.filter(t => {
        if (panelMode === 'PAKKA' && parseFloat(t.pakka_amount || '0') <= 0 && t.related_type === 'INTERNAL') return false;
        if (panelMode === 'ACTUAL' && parseFloat(t.actual_amount || '0') <= 0 && parseFloat(t.pakka_amount || '0') <= 0 && t.related_type === 'INTERNAL') return false;
        
        if (accountFilter === 'CASH' && t.bank_account_id) return false;
        if (accountFilter === 'UNTRACKED' && (t.bank_account_id || t.payment_method === 'CASH')) return false;
        if (accountFilter !== 'ALL' && accountFilter !== 'CASH' && accountFilter !== 'UNTRACKED' && t.bank_account_id !== accountFilter) return false;
        
        if (partyFilter !== 'ALL') {
            if (['SALES', 'PURCHASE', 'INTERNAL'].includes(partyFilter)) {
                if (t.related_type !== partyFilter) return false;
            } else {
                if (t.entity_name !== partyFilter) return false;
            }
        }
        
        if (startDate) {
            const tDate = t.transaction_date.split('T')[0];
            const sDate = startDate.split('T')[0];
            if (tDate < sDate) return false;
        }
        if (endDate) {
            const tDate = t.transaction_date.split('T')[0];
            const eDate = endDate.split('T')[0];
            if (tDate > eDate) return false;
        }
        
        const q = searchQuery.toLowerCase();
        const bankMatch = (t.bank_name || '').toLowerCase().includes(q);
        return (t.description || '').toLowerCase().includes(q) || (t.entity_name || '').toLowerCase().includes(q) || bankMatch;
    });

    const handleSelectTxn = (id: string) => {
        setSelectedTxns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    
    const handleSelectAll = (e: any) => {
        if (e.target.checked) {
            setSelectedTxns(filteredTransactions.map(t => t.id));
        } else {
            setSelectedTxns([]);
        }
    };

    const confirmBulkDelete = () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedTxns.length} transactions? This cannot be undone.`)) return;
        setIsBulkDeletePasswordOpen(true);
        setBulkDeletePassword('');
    };

    const executeBulkDelete = async () => {
        setIsDeletingBulk(true);
        try {
            const api = (await import('../utils/api')).default;
            await api.post('/auth/verify-password', { password: bulkDeletePassword });
            
            await api.post('/cashbook/bulk-delete', { ids: selectedTxns });
            fetchData();
            setSelectedTxns([]);
            setIsBulkDeletePasswordOpen(false);
        } catch (error: any) {
            alert(error.response?.data?.message || error.response?.data?.error || 'Password verification failed or server error');
        }
        setIsDeletingBulk(false);
    };

    const columns = [
        ...(canDelete ? [{
            header: <input type="checkbox" onChange={handleSelectAll} checked={selectedTxns.length > 0 && selectedTxns.length === filteredTransactions.length} />,
            accessor: 'id',
            render: (val: string) => <input type="checkbox" checked={selectedTxns.includes(val)} onChange={() => handleSelectTxn(val)} />
        }] : []),
        { header: 'Date', accessor: 'transaction_date', render: (val: string) => formatToDDMMYY(val) },
        {
            header: 'Type', accessor: 'type', render: (val: string) => (
                <span style={{
                    background: val === 'INCOME' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: val === 'INCOME' ? '#10b981' : '#ef4444',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                }}>{val}</span>
            )
        },
        { 
            header: 'Entity / Bank', 
            accessor: 'entity_name',
            render: (v: string, row: any) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{v || 'Internal'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {row.bank_account_id ? `Bank: ${bankAccounts.find(a => a.id === row.bank_account_id)?.bank_name || 'Legacy Bank'}` : 'Cash'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{row.payment_method}</div>
                </div>
            )
        },
        { header: 'Description', accessor: 'description' },
        {
            header: 'Amount', accessor: 'amount', render: (_val: string, row: any) => {
                const displayAmt = panelMode === 'PAKKA' ? parseFloat(row.pakka_amount || 0) : (parseFloat(row.actual_amount || 0) > 0 ? parseFloat(row.actual_amount || 0) : parseFloat(row.pakka_amount || 0));
                return <span style={{ fontWeight: 'bold', color: row.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                    {row.type === 'INCOME' ? '+' : '-'} ₹{formatIndian(displayAmt)}
                </span>
            }
        },
        {
            header: 'Actions', accessor: 'actions', render: (_val: any, row: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setViewTxn(row)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6' }} title="View Details"><Eye size={16} /></button>
                    <button onClick={() => handleEdit(row)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-primary)' }} title="Edit"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(row.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }} title="Delete"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    const computedParties = partySummaries.map(p => {
        const staticOpening = panelMode === 'PAKKA' ? parseFloat(p.opening_balance_pakka || 0) : parseFloat(p.opening_balance_actual || 0);
        const billedBefore = panelMode === 'PAKKA' ? parseFloat(p.billed_before_pakka || 0) : parseFloat(p.billed_before_actual || 0);
        const incomeBefore = parseFloat(p.income_before || 0);
        const expenseBefore = parseFloat(p.expense_before || 0);

        const billedDuring = panelMode === 'PAKKA' ? parseFloat(p.billed_during_pakka || 0) : parseFloat(p.billed_during_actual || 0);
        const incomeDuring = parseFloat(p.income_during || 0);
        const expenseDuring = parseFloat(p.expense_during || 0);

        let openingBalance = 0;
        let debit = 0;
        let credit = 0;
        let closingBalance = 0;

        if (p.type === 'CUSTOMER') {
            // Customer/Debtor: Invoices (billed) & refunds paid to customer (expense) increase debt. Payments received (income) reduces debt.
            openingBalance = staticOpening + (billedBefore + expenseBefore) - incomeBefore;
            debit = billedDuring + expenseDuring;
            credit = incomeDuring;
            closingBalance = openingBalance + debit - credit;
        } else {
            // Supplier/Creditor: Purchases (billed) & refunds from supplier (income) increase liability. Payments made to supplier (expense) reduces liability.
            openingBalance = staticOpening + (billedBefore + incomeBefore) - expenseBefore;
            debit = expenseDuring;
            credit = billedDuring + incomeDuring;
            closingBalance = openingBalance + credit - debit;
        }

        return {
            ...p,
            openingBalance,
            debit,
            credit,
            closingBalance
        };
    });

    const filteredParties = computedParties.filter(p => {
        const typeMatch = groupFilter === 'DEBTORS' ? p.type === 'CUSTOMER' : p.type === 'SUPPLIER';
        if (!typeMatch) return false;
        
        // Hide if opening balance, debit, credit, and closing balance are all zero
        const isAllZero = Math.abs(p.openingBalance) < 0.01 &&
                          Math.abs(p.debit) < 0.01 &&
                          Math.abs(p.credit) < 0.01 &&
                          Math.abs(p.closingBalance) < 0.01;
        if (isAllZero) return false;

        return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const dualPartiesList = customers.filter(c => c.linked_supplier_id).map(c => {
        const custStats = computedParties.find(p => p.id === c.id && p.type === 'CUSTOMER');
        const suppStats = computedParties.find(p => p.id === c.linked_supplier_id && p.type === 'SUPPLIER');

        const customerBal = custStats ? custStats.closingBalance : 0;
        const supplierBal = suppStats ? suppStats.closingBalance : 0;
        const netBal = customerBal - supplierBal;

        return {
            id: c.id,
            supplierId: c.linked_supplier_id,
            name: c.name,
            supplierName: c.linked_supplier_name || '',
            customerBal,
            supplierBal,
            netBal
        };
    }).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        if (groupFilter === 'DUAL') {
            const reportTitle = 'Dual Parties Summary (Customer & Supplier)';
            const companyName = panelMode === 'ACTUAL' ? 'PDS - Godown' : 'PLY DECORE SALES';
            const periodText = startDate || endDate 
                ? `Period: ${startDate ? formatToDDMMYY(startDate) : 'Start'} to ${endDate ? formatToDDMMYY(endDate) : 'Present'}`
                : 'Period: Lifetime';

            let totalCustomerDue = 0;
            let totalSupplierDue = 0;

            dualPartiesList.forEach(p => {
                totalCustomerDue += p.customerBal;
                totalSupplierDue += p.supplierBal;
            });
            const totalNet = totalCustomerDue - totalSupplierDue;

            const rowsHtml = dualPartiesList.map(p => {
                const net = p.customerBal - p.supplierBal;
                const absNet = Math.abs(net);
                const netText = absNet < 0.01 ? '₹0.00 (Settled)' : (net > 0 ? `₹${formatIndian(net)} Lena (Dr)` : `₹${formatIndian(absNet)} Dena (Cr)`);
                return `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                            <div style="font-weight: bold;">${p.name}</div>
                            ${p.supplierName && p.supplierName !== p.name ? `<div style="font-size: 11px; color: #666;">Vendor: ${p.supplierName}</div>` : ''}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: ${p.customerBal > 0 ? '#ef4444' : '#333'}; font-weight: bold;">
                            ${renderBalanceText(p.customerBal, 'CUSTOMER')}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: ${p.supplierBal > 0 ? '#10b981' : '#333'}; font-weight: bold;">
                            ${renderBalanceText(p.supplierBal, 'SUPPLIER')}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: ${net > 0 ? '#ef4444' : (net < 0 ? '#10b981' : '#333')};">
                            ${netText}
                        </td>
                    </tr>
                `;
            }).join('');

            const totalNetText = Math.abs(totalNet) < 0.01 
                ? '₹0.00 (Settled)' 
                : (totalNet > 0 ? `₹${formatIndian(totalNet)} Lena (Dr)` : `₹${formatIndian(Math.abs(totalNet))} Dena (Cr)`);

            printWindow.document.write(`
                <html>
                <head>
                    <title>${reportTitle}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
                        h1 { margin: 0; font-size: 24px; color: ${panelMode === 'ACTUAL' ? '#1a365d' : '#A02B2B'}; text-align: center; text-transform: uppercase; }
                        h2 { margin: 5px 0 20px 0; font-size: 18px; text-align: center; color: #555; }
                        .period { text-align: center; font-size: 14px; color: #666; margin-bottom: 30px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f5f5f5; padding: 12px 10px; border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; font-weight: bold; color: #555; }
                        td { font-size: 14px; }
                        .totals-row td { font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333; background-color: #fafafa; }
                    </style>
                </head>
                <body>
                    <h1>${companyName}</h1>
                    <h2>${reportTitle}</h2>
                    <div class="period">${periodText}</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: left;">Party Entity</th>
                                <th style="text-align: right;">Customer Due (Lena)</th>
                                <th style="text-align: right;">Supplier Due (Dena)</th>
                                <th style="text-align: right;">Net Standing Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                            <tr class="totals-row">
                                <td style="padding: 12px 10px;">Total Dual Entities</td>
                                <td style="padding: 12px 10px; text-align: right; color: #ef4444;">${renderBalanceText(totalCustomerDue, 'CUSTOMER')}</td>
                                <td style="padding: 12px 10px; text-align: right; color: #10b981;">${renderBalanceText(totalSupplierDue, 'SUPPLIER')}</td>
                                <td style="padding: 12px 10px; text-align: right;">${totalNetText}</td>
                            </tr>
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
            return;
        }

        const reportTitle = groupFilter === 'DEBTORS' ? 'Group Summary: Sundry Debtors' : 'Group Summary: Sundry Creditors';
        const companyName = panelMode === 'ACTUAL' ? 'PDS - Godown' : 'PLY DECORE SALES';
        const periodText = startDate || endDate 
            ? `Period: ${startDate ? formatToDDMMYY(startDate) : 'Start'} to ${endDate ? formatToDDMMYY(endDate) : 'Present'}`
            : 'Period: Lifetime';

        let totalOpening = 0;
        let totalDebit = 0;
        let totalCredit = 0;
        let totalClosing = 0;

        filteredParties.forEach(p => {
            totalOpening += p.openingBalance;
            totalDebit += p.debit;
            totalCredit += p.credit;
            totalClosing += p.closingBalance;
        });

        const rowsHtml = filteredParties.map(p => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${p.type === 'CUSTOMER' ? 'Customer' : 'Supplier'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${renderBalanceText(p.openingBalance, p.type)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: ${p.debit > 0 ? '#ef4444' : '#000'}; font-weight: bold;">${p.debit > 0 ? '₹' + formatIndian(p.debit) : '-'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: ${p.credit > 0 ? '#10b981' : '#000'}; font-weight: bold;">${p.credit > 0 ? '₹' + formatIndian(p.credit) : '-'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${renderBalanceText(p.closingBalance, p.type)}</td>
            </tr>
        `).join('');

        const typeLabel = groupFilter === 'DEBTORS' ? 'CUSTOMER' : 'SUPPLIER';
        const totalOpeningText = renderBalanceText(totalOpening, typeLabel);
        const totalClosingText = renderBalanceText(totalClosing, typeLabel);

        printWindow.document.write(`
            <html>
            <head>
                <title>${reportTitle}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
                    h1 { margin: 0; font-size: 24px; color: ${panelMode === 'ACTUAL' ? '#1a365d' : '#A02B2B'}; text-align: center; text-transform: uppercase; }
                    h2 { margin: 5px 0 20px 0; font-size: 18px; text-align: center; color: #555; }
                    .period { text-align: center; font-size: 14px; color: #666; margin-bottom: 30px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #f5f5f5; padding: 12px 10px; border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; font-weight: bold; color: #555; }
                    td { font-size: 14px; }
                    .totals-row td { font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333; background-color: #fafafa; }
                </style>
            </head>
            <body>
                <h1>${companyName}</h1>
                <h2>${reportTitle}</h2>
                <div class="period">${periodText}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Particulars</th>
                            <th style="text-align: center;">Type</th>
                            <th style="text-align: right;">Opening Balance</th>
                            <th style="text-align: right;">Debit</th>
                            <th style="text-align: right;">Credit</th>
                            <th style="text-align: right;">Closing Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                        <tr class="totals-row">
                            <td style="padding: 12px 10px;">Total</td>
                            <td style="padding: 12px 10px; text-align: center;">-</td>
                            <td style="padding: 12px 10px; text-align: right;">${totalOpeningText}</td>
                            <td style="padding: 12px 10px; text-align: right; color: #ef4444;">₹${formatIndian(totalDebit)}</td>
                            <td style="padding: 12px 10px; text-align: right; color: #10b981;">₹${formatIndian(totalCredit)}</td>
                            <td style="padding: 12px 10px; text-align: right;">${totalClosingText}</td>
                        </tr>
                    </tbody>
                </table>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const activeSummary = {
        income: panelMode === 'PAKKA' ? (summary as any).pakka?.income || 0 : (summary as any).actual?.income || 0,
        expense: panelMode === 'PAKKA' ? (summary as any).pakka?.expense || 0 : (summary as any).actual?.expense || 0,
    };
    const activeBalance = activeSummary.income - activeSummary.expense;

    let bankStatementData = null;
    if (viewMode === 'TRANSACTIONS' && accountFilter !== 'ALL') {
        let accName = 'Cash in Hand';
        let opening = 0;
        if (accountFilter !== 'CASH') {
            const b = bankAccounts.find(x => x.id === accountFilter);
            if (b) {
                accName = `${b.bank_name} (${b.account_number})`;
                opening = panelMode === 'PAKKA' ? parseFloat(b.opening_balance_pakka || 0) : parseFloat(b.opening_balance_actual || 0);
            }
        }
        
        let runningBal = opening;
        const txnsRev = [...filteredTransactions].reverse();
        const pdfTxns = txnsRev.map(t => {
            const amt = panelMode === 'PAKKA' ? parseFloat(t.pakka_amount || 0) : parseFloat(t.actual_amount || 0);
            let debit = 0, credit = 0;
            if (t.type === 'INCOME') {
                debit = amt;
                runningBal += amt;
            } else {
                credit = amt;
                runningBal -= amt;
            }
            return {
                date: t.transaction_date,
                ref: t.related_type + (t.entity_name ? ` - ${t.entity_name}` : ''),
                description: t.description,
                debit,
                credit,
                running_balance: runningBal
            };
        });

        bankStatementData = {
            entity_name: accName,
            opening_balance: opening,
            closing_balance: runningBal,
            transactions: pdfTxns
        };
    }


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Cashbook & Party Ledgers</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Manage cashflow and entity-wise balances.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px', height: '42px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                        <button style={{ padding: '0 16px', height: '34px', borderRadius: '8px', border: 'none', background: viewMode === 'TRANSACTIONS' ? 'white' : 'transparent', color: viewMode === 'TRANSACTIONS' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition-smooth)' }} onClick={() => setViewMode('TRANSACTIONS')}>
                            <History size={16}/> Transactions
                        </button>
                        <button style={{ padding: '0 16px', height: '34px', borderRadius: '8px', border: 'none', background: viewMode === 'PARTIES' ? 'white' : 'transparent', color: viewMode === 'PARTIES' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition-smooth)' }} onClick={() => setViewMode('PARTIES')}>
                            <User size={16}/> Group Summary
                        </button>
                        <button style={{ padding: '0 16px', height: '34px', borderRadius: '8px', border: 'none', background: viewMode === 'ACCOUNTS' ? 'white' : 'transparent', color: viewMode === 'ACCOUNTS' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition-smooth)' }} onClick={() => setViewMode('ACCOUNTS')}>
                            <CreditCard size={16}/> Accounts
                        </button>
                    </div>
                    
                    {bankStatementData && (
                        <PDFDownloadLink
                            document={<StatementDocument data={bankStatementData} isActualMode={panelMode === 'ACTUAL'} />}
                            fileName={`${bankStatementData.entity_name}_Ledger.pdf`}
                            style={{ textDecoration: 'none' }}
                        >
                            {({ loading: pdfLoading }) => (
                                <button 
                                    className="primary-btn" 
                                    style={{ 
                                        height: '42px', padding: '0 16px', borderRadius: '10px', border: 'none', 
                                        background: '#1e293b', color: '#fff', cursor: 'pointer', 
                                        fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                                        boxShadow: '0 2px 4px rgba(30,41,59,0.1)'
                                    }}
                                >
                                    <Printer size={16}/> {pdfLoading ? 'Building PDF...' : 'Print Ledger'}
                                </button>
                            )}
                        </PDFDownloadLink>
                    )}
                    
                    {selectedTxns.length > 0 && canDelete && (
                        <button className="secondary-btn" style={{ height: '42px', padding: '0 16px', fontSize: '0.875rem', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }} onClick={confirmBulkDelete}>
                            <Trash2 size={16} /> Delete ({selectedTxns.length})
                        </button>
                    )}
                    
                    <button className="secondary-btn" style={{ height: '42px', padding: '0 16px', fontSize: '0.875rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onClick={() => setIsManageBanksOpen(true)}>
                        <CreditCard size={16} /> Manage Banks
                    </button>
                    <button className="primary-btn" style={{ height: '42px', padding: '0 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(160, 43, 43, 0.15)' }} onClick={() => { setIsAddOpen(true); setEditingId(null); setFormData({ ...defaultForm }); }}>
                        <Plus size={16} /> Record Entry
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ flex: 1.2, padding: '24px', borderLeft: '6px solid var(--accent-primary)' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Cash Balance</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{formatCurrency(activeBalance)}</p>
                </div>
                <div className="glass-panel" style={{ flex: 1, padding: '24px', borderLeft: '6px solid #10b981' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Income</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>{formatCurrency(activeSummary.income)}</p>
                </div>
                <div className="glass-panel" style={{ flex: 1, padding: '24px', borderLeft: '6px solid #ef4444' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Expense</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>{formatCurrency(activeSummary.expense)}</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {viewMode === 'PARTIES' 
                            ? (groupFilter === 'DEBTORS' 
                                ? 'Group Summary: Sundry Debtors' 
                                : groupFilter === 'CREDITORS' 
                                    ? 'Group Summary: Sundry Creditors' 
                                    : 'Dual Parties Summary (Customer & Supplier)') 
                            : viewMode === 'ACCOUNTS' 
                                ? 'Account Balances' 
                                : 'Cash Flow Registry'}
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {viewMode === 'PARTIES' && (
                            <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '10px', gap: '4px', border: '1px solid var(--border-color)', height: '40px', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    style={{
                                        padding: '0 16px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: groupFilter === 'DEBTORS' ? 'var(--accent-primary)' : 'transparent',
                                        color: groupFilter === 'DEBTORS' ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        transition: 'var(--transition-smooth)'
                                    }}
                                    onClick={() => setGroupFilter('DEBTORS')}
                                >
                                    Sundry Debtors
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        padding: '0 16px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: groupFilter === 'CREDITORS' ? 'var(--accent-primary)' : 'transparent',
                                        color: groupFilter === 'CREDITORS' ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        transition: 'var(--transition-smooth)'
                                    }}
                                    onClick={() => setGroupFilter('CREDITORS')}
                                >
                                    Sundry Creditors
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        padding: '0 16px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: groupFilter === 'DUAL' ? '#7c3aed' : 'transparent',
                                        color: groupFilter === 'DUAL' ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        transition: 'var(--transition-smooth)'
                                    }}
                                    onClick={() => setGroupFilter('DUAL')}
                                >
                                    Dual Parties (Both)
                                </button>
                            </div>
                        )}
                        {viewMode === 'PARTIES' && (
                            <button
                                type="button"
                                onClick={handlePrintReport}
                                className="primary-btn"
                                style={{
                                    height: '40px',
                                    padding: '0 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'var(--accent-primary)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 8px rgba(160, 43, 43, 0.15)'
                                }}
                            >
                                <Printer size={16} /> Print Report
                            </button>
                        )}
                    </div>
                </div>

                {(viewMode === 'TRANSACTIONS' || viewMode === 'PARTIES') && (
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        {viewMode === 'TRANSACTIONS' && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</label>
                                    <select 
                                        className="form-input" 
                                        style={{ padding: '0 12px', minWidth: '180px', height: '38px', borderRadius: '8px', background: 'white', border: '1px solid var(--border-color)' }} 
                                        value={accountFilter} 
                                        onChange={e => setAccountFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Accounts</option>
                                        <option value="CASH">Cash In Hand</option>
                                        <option value="UNTRACKED">Untracked Legacy Entries</option>
                                        {bankAccounts.map(b => (
                                            <option key={b.id} value={b.id}>{b.bank_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Party Type / Category</label>
                                    <select 
                                        className="form-input" 
                                        style={{ padding: '0 12px', minWidth: '200px', height: '38px', borderRadius: '8px', background: 'white', border: '1px solid var(--border-color)' }} 
                                        value={partyFilter} 
                                        onChange={e => setPartyFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Parties</option>
                                        <option value="SALES">Customer Payments (Credit)</option>
                                        <option value="PURCHASE">Supplier Payments (Debit)</option>
                                        <option value="INTERNAL">Internal / Other Expenses</option>
                                        {uniqueParties.map((p: any) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From Date</label>
                            <input type="date" className="form-input" style={{ padding: '0 12px', height: '38px', borderRadius: '8px', width: '150px', background: 'white', border: '1px solid var(--border-color)' }} value={startDate} onChange={e => setStartDate(e.target.value)} title="Start Date" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To Date</label>
                            <input type="date" className="form-input" style={{ padding: '0 12px', height: '38px', borderRadius: '8px', width: '150px', background: 'white', border: '1px solid var(--border-color)' }} value={endDate} onChange={e => setEndDate(e.target.value)} title="End Date" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: 'auto' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Particulars</label>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', background: 'white', height: '38px', width: '220px' }}>
                                <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                                <input type="text" placeholder="Type to filter..." style={{ background: 'transparent', border: 'none', padding: 0, outline: 'none', fontSize: '0.85rem', width: '100%' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}
                <DataTable 
                    columns={viewMode === 'PARTIES' ? (groupFilter === 'DUAL' ? dualColumns : partyColumns) : viewMode === 'ACCOUNTS' ? accountColumns : columns} 
                    data={viewMode === 'PARTIES' ? (groupFilter === 'DUAL' ? dualPartiesList : filteredParties) : viewMode === 'ACCOUNTS' ? accountData : filteredTransactions} 
                    loading={loading} 
                    emptyMessage="No financial nodes detected." 
                    searchable={false}
                />
            </div>

            <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setEditingId(null); }} title={editingId ? "Edit Transaction" : "Record Financial Transaction"}>
                {error && <div style={{ background: 'var(--danger)', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Date</label><input type="date" required className="form-input" style={{ padding: '12px' }} value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} /></div>
                        <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Amount (₹)</label><input type="number" step="0.01" required className="form-input" style={{ padding: '12px', fontSize: '1.1rem', fontWeight: 700 }} placeholder="0.00" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} /></div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Select Account</label>
                            <select className="form-input" style={{ padding: '12px' }} value={formData.bank_account_id} onChange={e => {
                                const accId = e.target.value;
                                setFormData({ 
                                    ...formData, 
                                    bank_account_id: accId, 
                                    payment_method: accId === '' ? 'CASH' : (formData.payment_method === 'CASH' ? 'BANK/NEFT' : formData.payment_method)
                                });
                            }}>
                                <option value="">Cash In Hand</option>
                                {bankAccounts.map(b => (
                                    <option key={b.id} value={b.id}>{b.bank_name} ({b.account_number})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Payment Method</label>
                            <select className="form-input" style={{ padding: '12px' }} value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })} disabled={formData.bank_account_id === ''}>
                                <option value="CASH">CASH</option>
                                <option value="BANK/NEFT">BANK/NEFT</option>
                                <option value="CHEQUE">CHEQUE</option>
                                <option value="UPI">UPI</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Transaction Category</label>
                            <select className="form-input" style={{ padding: '12px' }} value={formData.related_type} onChange={e => setFormData({ ...formData, related_type: e.target.value, type: e.target.value === 'SALES' ? 'INCOME' : 'EXPENSE', entity_name: '', related_id: '' })}>
                                <option value="INTERNAL">Internal / Other Expenses</option>
                                <option value="SALES">Customer Payment (Credit)</option>
                                <option value="PURCHASE">Supplier Payment (Debit)</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Cash Flow Type</label>
                            <select className="form-input" style={{ padding: '12px' }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="EXPENSE">Debit (Money Out)</option>
                                <option value="INCOME">Credit (Money In)</option>
                            </select>
                        </div>
                    </div>

                    {formData.related_type === 'SALES' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Select Customer</label>
                            <SearchableSelect 
                                options={customers.map(c => ({ id: c.name, label: c.name, sublabel: c.gst_number ? `GST: ${c.gst_number}` : '' }))}
                                value={formData.entity_name}
                                onChange={(val) => setFormData({ ...formData, entity_name: val, related_id: '' })}
                                placeholder="-- Search Customer Name --"
                            />
                        </div>
                    )}

                    {formData.related_type === 'PURCHASE' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Select Supplier</label>
                            <SearchableSelect 
                                options={suppliers.map(s => ({ id: s.name, label: s.name, sublabel: s.gst_number ? `GST: ${s.gst_number}` : '' }))}
                                value={formData.entity_name}
                                onChange={(val) => setFormData({ ...formData, entity_name: val, related_id: '' })}
                                placeholder="-- Search Supplier Name --"
                            />
                        </div>
                    )}

                    {formData.related_type === 'INTERNAL' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Entity / Person Name</label>
                            <input type="text" className="form-input" style={{ padding: '12px' }} placeholder="e.g. Staff Name, Office Rent, etc." value={formData.entity_name} onChange={e => setFormData({ ...formData, entity_name: e.target.value })} />
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Memo / Description</label>
                        <input type="text" required className="form-input" style={{ padding: '12px' }} placeholder="Notes about this transaction..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <button type="submit" className="primary-btn" disabled={submitting} style={{ marginTop: '16px', height: '56px', fontSize: '1.1rem', fontWeight: 700, background: 'var(--accent-primary)', color: '#fff' }}>
                        <CreditCard size={20} style={{ marginRight: '10px' }} /> {submitting ? 'Processing Transaction...' : 'Commit to Ledger'}
                    </button>
                </form>
            </Modal>

            <Modal isOpen={isManageBanksOpen} onClose={() => { setIsManageBanksOpen(false); fetchData(); }} title="Manage Bank Accounts">
                <BankAccountsTab panelMode={panelMode} />
            </Modal>

            <Modal isOpen={!!viewTxn} onClose={() => setViewTxn(null)} title="Transaction Details">
                {viewTxn && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                            <strong>{formatToDDMMYY(viewTxn.transaction_date)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Type:</span>
                            <strong style={{ color: viewTxn.type === 'INCOME' ? '#10b981' : '#ef4444' }}>{viewTxn.type}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Entity / Party:</span>
                            <strong>{viewTxn.entity_name || 'Internal'} ({viewTxn.related_type})</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Amount ({panelMode}):</span>
                            <strong style={{ fontSize: '1.2rem', color: viewTxn.type === 'INCOME' ? '#10b981' : '#ef4444' }}>₹{parseFloat(panelMode === 'PAKKA' ? viewTxn.pakka_amount : viewTxn.actual_amount).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                            <strong>{viewTxn.payment_method}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Bank Account:</span>
                            <strong>{viewTxn.bank_account_id ? (bankAccounts.find(a => a.id === viewTxn.bank_account_id)?.bank_name || 'Legacy Bank') : 'N/A'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Description / Memo:</span>
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                {viewTxn.description || 'No description provided.'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isBulkDeletePasswordOpen} onClose={() => setIsBulkDeletePasswordOpen(false)} title="Security Verification">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Please enter your password to confirm deletion of {selectedTxns.length} records.</p>
                    <div>
                        <label className="form-label">Password</label>
                        <input type="password" autoFocus className="form-input" value={bulkDeletePassword} onChange={e => setBulkDeletePassword(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                        <button type="button" className="secondary-btn" onClick={() => setIsBulkDeletePasswordOpen(false)}>Cancel</button>
                        <button type="button" className="primary-btn" style={{ background: '#ef4444' }} onClick={executeBulkDelete} disabled={isDeletingBulk || !bulkDeletePassword}>
                            {isDeletingBulk ? 'Verifying...' : 'Confirm Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Cashbook;