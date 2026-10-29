import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { User, Key, ShieldCheck } from 'lucide-react';
import api from '../utils/api';


const Settings = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState('BUSINESS');

    // Business Data
    const [settings, setSettings] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profilePassword, setProfilePassword] = useState('');

    useEffect(() => {
        fetchConfigs();
        if (user) {
            setProfileName(user.name);
            setProfileEmail(user.email); 
        }
    }, [user]);

    if (!isAdmin) return <Navigate to="/" replace />;

    const fetchConfigs = async () => {
        try {
            const [setRes] = await Promise.all([
                api.get('/settings/variables')
            ]);
            setSettings(setRes.data);
        } catch (e) { }
    };

    const handleSettingChange = (key: string, value: string) => {
        const temp = [...settings];
        const idx = temp.findIndex(s => s.key === key);
        if (idx > -1) {
            temp[idx].value = value;
            setSettings(temp);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            handleSettingChange(key, reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const saveSettings = async () => {
        setLoading(true); setMsg('');
        try {
            await api.post('/settings/variables', { settings_array: settings });
            setMsg('Business information saved and synced.');
        } catch (e) {
            setMsg('Failed to save settings.');
        }
        setLoading(false);
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.75rem' }}>Core Control Panel</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Configure formal business identity and security settings.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveTab('BUSINESS')}
                    style={{ 
                        background: activeTab === 'BUSINESS' ? 'var(--accent-primary)' : 'transparent', 
                        color: activeTab === 'BUSINESS' ? '#fff' : 'var(--text-muted)', 
                        border: '1px solid var(--border-color)', 
                        padding: '12px 24px', 
                        borderRadius: '10px', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: '0.3s'
                    }}
                >
                    Business Profile & Bills
                </button>
                <button
                    onClick={() => setActiveTab('SECURITY')}
                    style={{ 
                        background: activeTab === 'SECURITY' ? '#ef4444' : 'transparent', 
                        color: activeTab === 'SECURITY' ? '#fff' : 'var(--text-muted)', 
                        border: '1px solid var(--border-color)', 
                        padding: '12px 24px', 
                        borderRadius: '10px', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: '0.3s'
                    }}
                >
                    Account & Password
                </button>
            </div>


            {msg && <div style={{ padding: '12px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: '8px', marginBottom: '24px' }}>{msg}</div>}

            <div className="glass-panel" style={{ padding: '32px' }}>
                {activeTab === 'BUSINESS' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Formal Invoice & Business Identity</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>These details will appear on your formal tax invoices.</p>
                            </div>
                            <button className="primary-btn" onClick={saveSettings} disabled={loading}>
                                {loading ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>

                        <div style={{ maxWidth: '600px' }}>
                            <div style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <h3 style={{ color: '#3b82f6', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldCheck size={20} /> Formal Bill Details (Pakka)
                                </h3>
                                
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>BUSINESS LOGO</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        {settings.find(s => s.key === 'pakka_logo_url')?.value && (
                                            <img src={settings.find(s => s.key === 'pakka_logo_url')?.value} style={{ width: '60px', height: '60px', objectFit: 'contain', background: '#fff', padding: '4px', borderRadius: '8px' }} alt="Logo" />
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'pakka_logo_url')} style={{ fontSize: '0.8rem' }} />
                                    </div>
                                </div>

                                {['pakka_company_name', 'pakka_gst_number', 'pakka_mobile', 'pakka_email', 'pakka_address'].map(key => {
                                    const s = settings.find(orig => orig.key === key);
                                    if (!s) return null;
                                    return (
                                        <div key={key} style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
                                                {key.replace('pakka_', '').replace(/_/g, ' ').toUpperCase()}
                                            </label>
                                            {key === 'pakka_address' ? (
                                                <textarea
                                                    className="form-input"
                                                    rows={3}
                                                    value={s.value}
                                                    onChange={(e) => handleSettingChange(key, e.target.value)}
                                                    placeholder={`Enter ${key.replace('pakka_', '').replace(/_/g, ' ')}`}
                                                />
                                            ) : (
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={s.value} 
                                                    onChange={(e) => handleSettingChange(key, e.target.value)} 
                                                    placeholder={`Enter ${key.replace('pakka_', '').replace(/_/g, ' ')}`} 
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <h3 style={{ color: '#3b82f6', marginBottom: '8px', fontSize: '1rem', fontWeight: 700 }}>
                                    🖨️ Default Bill Print Format
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
                                    Select the layout format when printing a customer invoice or supplier bill.
                                </p>
                                <select 
                                    className="form-input" 
                                    style={{ width: '100%', padding: '10px', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    value={settings.find(s => s.key === 'default_print_format')?.value || 'STANDARD'}
                                    onChange={(e) => handleSettingChange('default_print_format', e.target.value)}
                                >
                                    <option value="STANDARD">Standard (Full Page with Borders)</option>
                                    <option value="COMPACT">Compact (Half Page / Tight Layout)</option>
                                </select>
                            </div>

                            <div style={{ marginTop: '32px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 600 }}>INVOICE FOOTER TERMS & CONDITIONS</label>
                                <textarea 
                                    className="form-input" 
                                    rows={4} 
                                    style={{ width: '100%', resize: 'vertical' }}
                                    value={settings.find(s => s.key === 'invoice_terms')?.value || ''}
                                    onChange={(e) => handleSettingChange('invoice_terms', e.target.value)}
                                    placeholder="Terms mentioned at the bottom of bills..."
                                />
                            </div>

                            {/* Invoice Starting Number */}
                            <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                <h3 style={{ color: '#10b981', marginBottom: '8px', fontSize: '1rem', fontWeight: 700 }}>
                                    📋 Invoice Numbering Control
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
                                    Set karo ki <strong>Next invoice number</strong> kya hoga. Jo bhi number aap yahan set karenge, aapka <strong>Agla Naya Bill</strong> wahin se generate hoga.
                                    <br />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Note: Bill banne ke baad ye number automatic aage badh jayega.</span>
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            INVOICE STARTING NUMBER
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-input"
                                                style={{ maxWidth: '160px', fontSize: '1.1rem', fontWeight: 700 }}
                                                value={settings.find(s => s.key === 'invoice_start_number')?.value || '1'}
                                                onChange={(e) => handleSettingChange('invoice_start_number', e.target.value)}
                                            />
                                            <div style={{ padding: '10px 20px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preview: </span>
                                                <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'monospace', fontSize: '1rem' }}>
                                                    PDS-{(settings.find(s => s.key === 'invoice_start_number')?.value || '1').toString().padStart(4, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'SECURITY' ? (
                    <div style={{ maxWidth: '600px' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Manage Profile & Password</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>Update your identity and password for the system.</p>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-muted)' }}>YOUR NAME</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="form-input" style={{ paddingLeft: '44px' }} value={profileName} onChange={e => setProfileName(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-muted)' }}>LOGIN EMAIL</label>
                            <div style={{ position: 'relative' }}>
                                <ShieldCheck size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="email" className="form-input" style={{ paddingLeft: '44px' }} value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '40px', padding: '24px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <h4 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}> <Key size={18} /> Change Password</h4>
                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-muted)' }}>NEW PASSWORD (LEAVE BLANK TO KEEP CURRENT)</label>
                            <input 
                                type="password" 
                                className="form-input" 
                                placeholder="••••••••" 
                                value={profilePassword} 
                                onChange={e => setProfilePassword(e.target.value)} 
                            />
                        </div>

                        <button 
                            className="primary-btn" 
                            style={{ background: '#ef4444', width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 600 }} 
                            onClick={async () => {
                                setLoading(true); setMsg('');
                                try {
                                    await api.post('/auth/update-profile', { 
                                        userId: user?.id, 
                                        name: profileName, 
                                        email: profileEmail, 
                                        password: profilePassword 
                                    });
                                    setMsg('Profile and credentials updated successfully.');
                                    setProfilePassword('');
                                } catch(e) {
                                    setMsg('Update failed. Ensure session is active.');
                                }
                                setLoading(false);
                            }} 
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Apply Security Changes'}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Settings;
