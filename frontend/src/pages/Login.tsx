import React, { useState } from 'react';
import { Package } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const loginStore = useAuthStore(state => state.loginStore);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Basic call to our Phase 1 backend
      const response = await api.post('/auth/login', { email, password });
      loginStore(response.data.user, response.data.token);
      
      if (response.data.user.role === 'GODOWN') {
        navigate('/actual');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', background: 'var(--accent-primary)', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
            <Package size={32} color="#fff" />
          </div>
          <h1 style={{ marginBottom: '8px', fontSize: '1.75rem' }}>Inventory OS</h1>
          <p style={{ color: 'var(--text-muted)' }}>Secure Database Entry</p>
        </div>

        {error && <div style={{ background: 'var(--danger)', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
            <input type="email" required className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@domain.com" />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Global Password</label>
            <input type="password" required className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Authenticating...' : 'Access System'}
          </button>
        </form>



      </div>
    </div>
  );
};

export default Login;




