import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, Package, Receipt, Warehouse, Settings, BookOpen, LogOut, ShieldAlert, Search, ArrowRightLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import pdsLogo from '../assets/pds_logo.png';
import api from '../utils/api';
import InventoryQuickSearch from './InventoryQuickSearch';

const Layout = () => {
  const { logoutStore, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [hideEmployees, setHideEmployees] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
        api.get('/employees').then(res => {
            const hasGodown = res.data.some((e: any) => e.role === 'GODOWN');
            if (hasGodown) setHideEmployees(true);
        }).catch(() => {});
    }
  }, [user?.role]);

  useKeyboardShortcuts({
    'Escape': () => navigate(-1),
    'Alt+1': () => navigate('/'),
    'Alt+2': () => navigate('/billing'),
    'Alt+3': () => navigate('/live-stock'),
    'Alt+4': () => navigate('/pakka-cashbook'),
    'Alt+5': () => navigate('/customers'),
    'Alt+6': () => navigate('/suppliers'),
    'Ctrl+K': () => setIsQuickSearchOpen(true),
    'Cmd+K': () => setIsQuickSearchOpen(true),
    'Alt+I': () => setIsQuickSearchOpen(true),
  });


  const handleLogout = () => {
    logoutStore();
    window.location.href = '/login';
  };

  const commonLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'ACCOUNTANT'] },
    { name: 'System Users', path: '/employees', icon: <Users size={20} />, roles: ['ADMIN', 'GODOWN'] },
    { name: 'Staff Management', path: '/staff', icon: <Users size={20} />, roles: ['ADMIN', 'ACCOUNTANT', 'GODOWN'] },
    { name: 'Suppliers', path: '/suppliers', icon: <Truck size={20} />, roles: ['ADMIN', 'ACCOUNTANT', 'GODOWN'] },
    { name: 'Customers', path: '/customers', icon: <Users size={20} />, roles: ['ADMIN', 'ACCOUNTANT', 'GODOWN'] },
    { name: 'Dual Entities', path: '/dual-entities', icon: <ArrowRightLeft size={20} />, roles: ['ADMIN', 'ACCOUNTANT'] },
    { name: 'Inventory Items', path: '/inventory', icon: <Package size={20} />, roles: ['ADMIN', 'ACCOUNTANT', 'GODOWN'] },
    { name: 'Live Stocks', path: '/live-stock', icon: <Warehouse size={20} />, roles: ['ADMIN', 'ACCOUNTANT', 'GODOWN'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['ADMIN'] },
  ];

  const pakkaLinks = [
    { name: 'Billing Desk', path: '/billing', icon: <Receipt size={20} /> },
    { name: 'Tax Invoices & Bills', path: '/pakka', icon: <Receipt size={20} /> },
    { name: 'Business Ledger', path: '/pakka-cashbook', icon: <BookOpen size={20} /> },
    { name: 'Stock Adjustments', path: '/adjustment-logs', icon: <ShieldAlert size={20} /> },
  ];

  const actualLinks = [
    { name: 'Inventory Accounting', path: '/actual', icon: <Warehouse size={20} /> },
    { name: 'Internal Cashbook', path: '/actual-cashbook', icon: <BookOpen size={20} /> },
    { name: 'Price Mappings', path: '/mappings', icon: <ShieldAlert size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isFormalUser = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
  const actualPaths = ['/actual', '/actual-billing', '/actual-cashbook', '/mappings'];
  const isActualMode = actualPaths.some(p => location.pathname.startsWith(p)) || user?.role === 'GODOWN';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', height: '100vh', overflowY: 'auto', zIndex: 100 }}>
        
        {/* Branding - Dynamic Switch */}
        <div style={{ padding: '0 12px 24px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '2px', borderRadius: '12px', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {!isActualMode ? (
                <img src={pdsLogo} alt="PDS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              ) : (
                <div style={{ background: '#f59e0b', padding: '10px', borderRadius: '12px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={24} color="#fff" />
                </div>
              )}
            </div>
            <div>
              <h1 style={{ fontSize: isActualMode ? '1.5rem' : '1.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {isActualMode ? 'PDS' : <>{'PLY DECORE'}<br/>{'SALES'}</>}
              </h1>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isActualMode ? '#f59e0b' : 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isActualMode ? 'Internal Godown' : 'Formal Registry'}
              </span>
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button 
            onClick={() => setIsQuickSearchOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <Search size={20} />
            <span style={{ fontWeight: 500, flex: 1 }}>Quick Search</span>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>⌘K</span>
          </button>

          {/* Base Navigation */}
          {commonLinks.filter(l => {
              if (l.name === 'System Users' && isFormalUser) return false;
              if (l.name === 'System Users' && hideEmployees) return false;
              return l.roles.includes(user?.role || '') && (isFormalUser || l.path !== '/');
          }).map((link) => (
            <Link key={link.path} to={link.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', color: isActive(link.path) ? 'var(--accent-primary)' : 'var(--text-secondary)', background: isActive(link.path) ? 'var(--accent-primary-hover)' : 'transparent' }}>
              {link.icon}
              <span style={{ fontWeight: 500 }}>{link.name}</span>
            </Link>
          ))}

          <div style={{ margin: '16px 16px 8px', height: '1px', background: 'var(--border-color)' }} />

          {/* System Specific Links - Strictly Isolated */}
          {isFormalUser ? (
            pakkaLinks.map((link) => (
              <Link key={link.path} to={link.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', color: isActive(link.path) ? 'var(--brand-maroon)' : 'var(--text-secondary)', background: isActive(link.path) ? 'rgba(121, 28, 28, 0.1)' : 'transparent' }}>
                {link.icon}
                <span style={{ fontWeight: 500 }}>{link.name}</span>
              </Link>
            ))
          ) : (
            actualLinks.map((link) => (
              <Link key={link.path} to={link.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', color: isActive(link.path) ? '#f59e0b' : 'var(--text-secondary)', background: isActive(link.path) ? 'rgba(245, 158, 11, 0.1)' : 'transparent' }}>
                {link.icon}
                <span style={{ fontWeight: 500 }}>{link.name}</span>
              </Link>
            ))
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name || 'Admin User'}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role || 'ACCOUNTANT'}</p>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '4px' }}>
            <LogOut size={20} />
          </button>
        </div>

      </aside>

      {/* Main Outlet Area */}
      <main style={{ marginLeft: '280px', flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
        <InventoryQuickSearch isOpen={isQuickSearchOpen} onClose={() => setIsQuickSearchOpen(false)} />
      </main>

    </div>
  );
};

export default Layout;
