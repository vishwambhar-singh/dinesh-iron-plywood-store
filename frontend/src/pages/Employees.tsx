import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { formatToDDMMYY } from '../utils/date';
import { Trash2, Edit } from 'lucide-react';


const Employees = () => {
    const { user } = useAuthStore();
    const isAllowed = user?.role === 'ADMIN' || user?.role === 'GODOWN';

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form State
    const defaultForm = { name: '', email: '', mobile: '', password: '', role: 'ACCOUNTANT' };

    const [formData, setFormData] = useState({...defaultForm});
    const [roles, setRoles] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const empRes = await api.get('/employees');
            setEmployees(empRes.data);
            // Default roles
            setRoles([{role: 'ADMIN'}, {role: 'ACCOUNTANT'}, {role: 'GODOWN'}]);
        } catch (err) { }
        setLoading(false);
    };


    useEffect(() => {
        fetchEmployees();
    }, []);

    if (!isAllowed) return <Navigate to="/" replace />;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError('');
        try {
            if (editingId) {
                await api.put(`/employees/${editingId}`, formData);
            } else {
                await api.post('/auth/register', formData);
            }
            setIsAddOpen(false);
            setFormData({...defaultForm});
            setEditingId(null);
            fetchEmployees(); // Live Refresh
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to process employee');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (row: any) => {
        setFormData({ name: row.name, email: row.email, mobile: row.mobile || '', password: '', role: row.role });
        setEditingId(row.id);
        setIsAddOpen(true);
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Email Address', accessor: 'email' },
        { header: 'System Role', accessor: 'role', render: (val: string) => (
            <span style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {val}
            </span>
        )},
        { header: 'Registered On', accessor: 'created_at', render: (val: string) => formatToDDMMYY(val) },
        { header: 'Actions', accessor: 'id', render: (val: string, row: any) => (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '0 12px', 
                        height: '32px', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)', 
                        background: 'white', 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }} 
                    onClick={() => handleEditClick(row)}
                    onMouseEnter={(e) => { 
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'; 
                        e.currentTarget.style.color = '#10b981';
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.2)';
                    }}
                    onMouseLeave={(e) => { 
                        e.currentTarget.style.background = 'white'; 
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Edit size={13} /> Edit
                </button>
                <button 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '0 12px', 
                        height: '32px', 
                        borderRadius: '6px', 
                        border: '1px solid rgba(239,68,68,0.3)', 
                        background: 'rgba(239,68,68,0.02)', 
                        color: '#ef4444', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }} 
                    onClick={async () => {
                        if (window.confirm('Delete this employee?')) {
                            await api.delete(`/employees/${val}`);
                            fetchEmployees();
                        }
                    }}
                    onMouseEnter={(e) => { 
                        e.currentTarget.style.background = '#ef4444'; 
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(239, 68, 68, 0.25)';
                    }}
                    onMouseLeave={(e) => { 
                        e.currentTarget.style.background = 'rgba(239,68,68,0.02)'; 
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Trash2 size={13} /> Delete
                </button>
            </div>
        )}

    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Employees</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage staff accounts and system access.</p>
                </div>

                <button className="primary-btn" onClick={() => { setIsAddOpen(true); setEditingId(null); setFormData({...defaultForm}); }}>+ Add Employee</button>

            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <DataTable columns={columns} data={employees} loading={loading} emptyMessage={"No employees found."} />
            </div>


            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingId ? "Update Employee" : "Add New Employee"}>

                {error && <div style={{ background: 'var(--danger)', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Full Name</label>
                        <input type="text" required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Email Address</label>
                        <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@domain.com" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Mobile Number</label>
                        <input type="text" required className="form-input" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="999-999-9999" />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Login Password {editingId && '(Leave blank to keep current)'}</label>
                        <input type="password" required={!editingId} className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>System Role Matrix</label>
                        <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            {roles.map(r => (
                                <option key={r.role} value={r.role}>{r.role}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="primary-btn" disabled={submitting} style={{ marginTop: '16px' }}>
                        {submitting ? 'Saving...' : (editingId ? 'Update' : 'Save')}
                    </button>

                </form>
            </Modal>
        </div>
    );
};

export default Employees;



