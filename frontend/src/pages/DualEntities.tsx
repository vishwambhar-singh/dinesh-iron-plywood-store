import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    Users, 
    CheckCircle2, 
    XCircle, 
    Link2, 
    Unlink, 
    AlertCircle, 
    Search, 
    Loader2, 
    Building2, 
    Phone, 
    FileText,
    ArrowRightLeft,
    PlusCircle
} from 'lucide-react';
import Modal from '../components/Modal';

interface MatchSuggestion {
    customer_id: string;
    customer_name: string;
    customer_gst: string | null;
    customer_mobile: string | null;
    customer_state: string | null;
    customer_op_pakka: number;
    customer_op_actual: number;
    supplier_id: string;
    supplier_name: string;
    supplier_gst: string | null;
    supplier_mobile: string | null;
    supplier_state: string | null;
    supplier_op_pakka: number;
    supplier_op_actual: number;
    match_reason: string;
    match_type: 'GST' | 'PHONE' | 'NAME';
    confidence: number;
}

interface ApprovedLink {
    link_id: string;
    customer_id: string;
    supplier_id: string;
    notes: string | null;
    linked_at: string;
    customer_name: string;
    customer_gst: string | null;
    customer_mobile: string | null;
    customer_state: string | null;
    supplier_name: string;
    supplier_gst: string | null;
    supplier_mobile: string | null;
    supplier_state: string | null;
    customer_balance_pakka: number;
    supplier_balance_pakka: number;
    net_balance_pakka: number;
    customer_balance_actual: number;
    supplier_balance_actual: number;
    net_balance_actual: number;
}

const DualEntities = () => {
    const [activeTab, setActiveTab] = useState<'SUGGESTIONS' | 'APPROVED'>('SUGGESTIONS');
    const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
    const [approvedLinks, setApprovedLinks] = useState<ApprovedLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Manual Link Modal
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [manualNotes, setManualNotes] = useState('');
    const [manualSubmitting, setManualSubmitting] = useState(false);
    const [manualError, setManualError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sugRes, appRes] = await Promise.all([
                api.get('/billing/dual/suggestions'),
                api.get('/billing/dual/linked')
            ]);
            setSuggestions(sugRes.data || []);
            setApprovedLinks(appRes.data || []);
        } catch (err) {
            console.error('Failed to load dual entities data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPartiesForManualLink = async () => {
        try {
            const [custRes, suppRes] = await Promise.all([
                api.get('/customers?statusFilter=ACTIVE'),
                api.get('/suppliers?statusFilter=ACTIVE')
            ]);
            setAllCustomers(custRes.data?.data || custRes.data || []);
            setAllSuppliers(suppRes.data?.data || suppRes.data || []);
        } catch (err) {
            console.error('Failed to load parties for manual link:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApproveMatch = async (suggestion: MatchSuggestion) => {
        const actionKey = `${suggestion.customer_id}_${suggestion.supplier_id}`;
        setActionLoadingId(actionKey);
        try {
            await api.post('/billing/dual/link', {
                customer_id: suggestion.customer_id,
                supplier_id: suggestion.supplier_id,
                notes: `Manually approved suggestion: ${suggestion.match_reason}`
            });
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to approve dual entity link');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDismissSuggestion = (suggestion: MatchSuggestion) => {
        const key = `${suggestion.customer_id}_${suggestion.supplier_id}`;
        setDismissedKeys(prev => new Set(prev).add(key));
    };

    const handleUnlink = async (linkId: string, custName: string, suppName: string) => {
        if (!window.confirm(`Are you sure you want to unlink ${custName} and ${suppName}? They will operate as separate single-role parties.`)) {
            return;
        }
        setActionLoadingId(linkId);
        try {
            await api.delete(`/billing/dual/unlink/${linkId}`);
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to unlink dual entity');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !selectedSupplier) {
            setManualError('Please select both a Customer and a Supplier to link');
            return;
        }
        setManualSubmitting(true);
        setManualError('');
        try {
            await api.post('/billing/dual/link', {
                customer_id: selectedCustomer,
                supplier_id: selectedSupplier,
                notes: manualNotes.trim() || 'Manually linked by user'
            });
            setIsManualModalOpen(false);
            setSelectedCustomer('');
            setSelectedSupplier('');
            setManualNotes('');
            await fetchData();
            setActiveTab('APPROVED');
        } catch (err: any) {
            setManualError(err.response?.data?.error || 'Failed to link entities');
        } finally {
            setManualSubmitting(false);
        }
    };

    const visibleSuggestions = suggestions.filter(s => {
        const key = `${s.customer_id}_${s.supplier_id}`;
        if (dismissedKeys.has(key)) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.customer_name.toLowerCase().includes(q) ||
               s.supplier_name.toLowerCase().includes(q) ||
               (s.customer_gst && s.customer_gst.toLowerCase().includes(q)) ||
               (s.customer_mobile && s.customer_mobile.toLowerCase().includes(q));
    });

    const visibleApproved = approvedLinks.filter(l => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return l.customer_name.toLowerCase().includes(q) ||
               l.supplier_name.toLowerCase().includes(q) ||
               (l.customer_gst && l.customer_gst.toLowerCase().includes(q)) ||
               (l.supplier_gst && l.supplier_gst.toLowerCase().includes(q));
    });

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Dual Entities & Match Approvals</h1>
                        <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            background: 'rgba(124, 58, 237, 0.1)', 
                            color: '#7c3aed', 
                            border: '1px solid rgba(124, 58, 237, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <ArrowRightLeft size={13} />
                            Customer & Supplier
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Review suggested party linkages, manually approve matches, and manage dual-role entities.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        className="primary-btn" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 700 }}
                        onClick={() => {
                            fetchPartiesForManualLink();
                            setIsManualModalOpen(true);
                            setManualError('');
                        }}
                    >
                        <PlusCircle size={18} />
                        Manual Link Entity
                    </button>
                </div>
            </div>

            {/* Navigation Bar & Search */}
            <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                    <button
                        type="button"
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'SUGGESTIONS' ? 'var(--accent-primary)' : 'transparent',
                            color: activeTab === 'SUGGESTIONS' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onClick={() => setActiveTab('SUGGESTIONS')}
                    >
                        <span>Suggested Matches</span>
                        <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            background: activeTab === 'SUGGESTIONS' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                            color: activeTab === 'SUGGESTIONS' ? '#fff' : 'var(--text-primary)',
                            fontWeight: 800
                        }}>
                            {visibleSuggestions.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'APPROVED' ? '#7c3aed' : 'transparent',
                            color: activeTab === 'APPROVED' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onClick={() => setActiveTab('APPROVED')}
                    >
                        <span>Approved Dual Parties</span>
                        <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            background: activeTab === 'APPROVED' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                            color: activeTab === 'APPROVED' ? '#fff' : 'var(--text-primary)',
                            fontWeight: 800
                        }}>
                            {visibleApproved.length}
                        </span>
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '320px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search party name, GST, or mobile..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Content Container */}
            {loading ? (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600 }}>Analyzing and loading dual entity records...</p>
                </div>
            ) : activeTab === 'SUGGESTIONS' ? (
                /* TAB 1: SUGGESTED MATCHES (PENDING APPROVAL) */
                <div>
                    {visibleSuggestions.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                            <CheckCircle2 size={44} color="#10b981" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>All Clear! No Pending Matches</h3>
                            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                                All detected matching customers and suppliers have been reviewed or approved. Any newly registered parties with identical GSTIN or phone numbers will appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ 
                                padding: '12px 18px', 
                                background: 'rgba(59, 130, 246, 0.08)', 
                                border: '1px solid rgba(59, 130, 246, 0.2)', 
                                borderRadius: '8px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px',
                                color: 'var(--accent-primary)',
                                fontSize: '0.85rem',
                                fontWeight: 600
                            }}>
                                <AlertCircle size={18} />
                                <span>
                                    Found <strong>{visibleSuggestions.length} potential customer-supplier matches</strong>. Review each pairing and click <strong>Approve & Link</strong> to connect their ledgers into a combined account.
                                </span>
                            </div>

                            {visibleSuggestions.map((sug) => {
                                const actionKey = `${sug.customer_id}_${sug.supplier_id}`;
                                const isBusy = actionLoadingId === actionKey;

                                return (
                                    <div 
                                        key={actionKey} 
                                        className="glass-panel" 
                                        style={{ 
                                            padding: '20px 24px', 
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        {/* Match Badge Banner */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    background: sug.match_type === 'GST' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                                    color: sug.match_type === 'GST' ? '#059669' : '#2563eb',
                                                    border: `1px solid ${sug.match_type === 'GST' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                                                }}>
                                                    {sug.match_reason}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                    Confidence: {sug.confidence}%
                                                </span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleDismissSuggestion(sug)}
                                                    disabled={isBusy}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 14px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'white',
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <XCircle size={15} /> Ignore
                                                </button>

                                                <button
                                                    onClick={() => handleApproveMatch(sug)}
                                                    disabled={isBusy}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 18px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        background: 'var(--brand-green)',
                                                        color: '#ffffff',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        cursor: isBusy ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                                                    }}
                                                >
                                                    {isBusy ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                                                    Approve & Link
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dual Entity Cards Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
                                            {/* Left: Customer Profile */}
                                            <div style={{ 
                                                padding: '16px', 
                                                borderRadius: '10px', 
                                                background: 'rgba(59, 130, 246, 0.03)', 
                                                border: '1px solid rgba(59, 130, 246, 0.15)' 
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <Users size={16} color="#3b82f6" />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Customer Registry
                                                    </span>
                                                </div>
                                                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                                    {sug.customer_name}
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    <div><strong>GSTIN:</strong> {sug.customer_gst || 'Unregistered'}</div>
                                                    <div><strong>Mobile:</strong> {sug.customer_mobile || 'Not Provided'}</div>
                                                    {sug.customer_state && <div><strong>State:</strong> {sug.customer_state}</div>}
                                                </div>
                                            </div>

                                            {/* Middle Icon */}
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                padding: '8px',
                                                color: 'var(--text-muted)'
                                            }}>
                                                <ArrowRightLeft size={24} color="#7c3aed" />
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', marginTop: '4px' }}>MATCH</span>
                                            </div>

                                            {/* Right: Supplier Profile */}
                                            <div style={{ 
                                                padding: '16px', 
                                                borderRadius: '10px', 
                                                background: 'rgba(124, 58, 237, 0.03)', 
                                                border: '1px solid rgba(124, 58, 237, 0.15)' 
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <Building2 size={16} color="#7c3aed" />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Supplier Registry
                                                    </span>
                                                </div>
                                                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                                    {sug.supplier_name}
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    <div><strong>GSTIN:</strong> {sug.supplier_gst || 'Unregistered'}</div>
                                                    <div><strong>Mobile:</strong> {sug.supplier_mobile || 'Not Provided'}</div>
                                                    {sug.supplier_state && <div><strong>State:</strong> {sug.supplier_state}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* TAB 2: APPROVED DUAL PARTIES */
                <div className="glass-panel" style={{ padding: '24px' }}>
                    {visibleApproved.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Building2 size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No Approved Dual Entities Yet</h3>
                            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                Use the Suggested Matches tab to approve detected pairs or click "+ Manual Link Entity" to link a customer and supplier.
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Customer Account</th>
                                        <th style={{ textAlign: 'left', padding: '12px 16px' }}>Supplier Account</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px' }}>Customer Due (Lena)</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px' }}>Supplier Due (Dena)</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px' }}>Net Position</th>
                                        <th style={{ textAlign: 'center', padding: '12px 16px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleApproved.map((link) => {
                                        const isUnlinking = actionLoadingId === link.link_id;
                                        const net = link.net_balance_pakka;

                                        return (
                                            <tr key={link.link_id}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                        {link.customer_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {link.customer_gst ? `GST: ${link.customer_gst}` : (link.customer_mobile ? `Ph: ${link.customer_mobile}` : 'Customer')}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                        {link.supplier_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {link.supplier_gst ? `GST: ${link.supplier_gst}` : (link.supplier_mobile ? `Ph: ${link.supplier_mobile}` : 'Supplier')}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 700, color: '#ef4444' }}>
                                                    ₹{Math.max(0, link.customer_balance_pakka).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>
                                                    ₹{Math.max(0, link.supplier_balance_pakka).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                                                    {net > 0 ? (
                                                        <span style={{ 
                                                            padding: '3px 8px', 
                                                            borderRadius: '6px', 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 800, 
                                                            background: 'rgba(239, 68, 68, 0.1)', 
                                                            color: '#ef4444', 
                                                            border: '1px solid rgba(239, 68, 68, 0.25)' 
                                                        }}>
                                                            ₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Lena (Dr)
                                                        </span>
                                                    ) : net < 0 ? (
                                                        <span style={{ 
                                                            padding: '3px 8px', 
                                                            borderRadius: '6px', 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 800, 
                                                            background: 'rgba(16, 185, 129, 0.1)', 
                                                            color: '#10b981', 
                                                            border: '1px solid rgba(16, 185, 129, 0.25)' 
                                                        }}>
                                                            ₹{Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Dena (Cr)
                                                        </span>
                                                    ) : (
                                                        <span style={{ 
                                                            padding: '3px 8px', 
                                                            borderRadius: '6px', 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 800, 
                                                            background: 'rgba(148, 163, 184, 0.15)', 
                                                            color: 'var(--text-muted)' 
                                                        }}>
                                                            Settled (₹0)
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                                                    <button
                                                        onClick={() => handleUnlink(link.link_id, link.customer_name, link.supplier_name)}
                                                        disabled={isUnlinking}
                                                        title="Unlink dual entity pair"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '5px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                            background: 'rgba(239, 68, 68, 0.05)',
                                                            color: '#ef4444',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: isUnlinking ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {isUnlinking ? <Loader2 size={13} className="animate-spin" /> : <Unlink size={13} />}
                                                        Unlink
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Manual Link Modal */}
            <Modal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                title="Manual Dual Party Link"
                maxWidth="600px"
            >
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Select any registered customer and supplier to connect them as a single dual-role entity.
                    </p>

                    <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                            Customer Profile *
                        </label>
                        <select
                            className="form-input"
                            value={selectedCustomer}
                            onChange={e => setSelectedCustomer(e.target.value)}
                            required
                        >
                            <option value="">-- Select Customer --</option>
                            {allCustomers.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.gstNumber ? `(GST: ${c.gstNumber})` : (c.mobile ? `(Ph: ${c.mobile})` : '')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                            Supplier Profile *
                        </label>
                        <select
                            className="form-input"
                            value={selectedSupplier}
                            onChange={e => setSelectedSupplier(e.target.value)}
                            required
                        >
                            <option value="">-- Select Supplier --</option>
                            {allSuppliers.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} {s.gstNumber ? `(GST: ${s.gstNumber})` : (s.mobile ? `(Ph: ${s.mobile})` : '')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                            Link Notes (Optional)
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Same promoter business partnership"
                            value={manualNotes}
                            onChange={e => setManualNotes(e.target.value)}
                        />
                    </div>

                    {manualError && (
                        <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>
                            {manualError}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setIsManualModalOpen(false)}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={manualSubmitting}
                            className="primary-btn"
                            style={{
                                padding: '10px 24px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {manualSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                            Confirm & Link
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DualEntities;
