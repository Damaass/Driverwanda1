import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, useLang } from '../App';

export default function RegisterPage() {
  const { lang, setLang } = useLang();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    names: '', email: '', password: '', confirmPassword: '',
    phone: '', national_id: '', date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.names || !form.email || !form.password) {
      setError(lang==='rw' ? 'Uzuza amakuru yose asabwa' : 'Please fill all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(lang==='rw' ? 'Amagambo banga ntabuhura' : 'Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError(lang==='rw' ? 'Ijambobanga rigomba kuba rigufi nibura inyuguti 6' : 'Password must be at least 6 characters');
      return;
    }
    setError(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', {
        names: form.names, email: form.email, password: form.password,
        phone: form.phone, national_id: form.national_id, date_of_birth: form.date_of_birth
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Ikosa rya server');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.langBar}>
        <div className="lang-toggle">
          <button className={`lang-btn ${lang==='rw'?'active':''}`} onClick={()=>setLang('rw')}>RW</button>
          <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={()=>setLang('en')}>EN</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🦅</div>
          <h2 style={styles.title}>
            {lang==='rw' ? 'Iyandikishe' : 'Register'}
          </h2>
          <p style={styles.sub}>HAVANA SHELF DEPARTMENT - Driving Exam</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}

          <div style={styles.grid2}>
            <div className="form-group">
              <label>{lang==='rw' ? 'Amazina yose *' : 'Full Names *'}</label>
              <input value={form.names} onChange={change('names')} placeholder="Amazina y'inzuzi" />
            </div>
            <div className="form-group">
              <label>{lang==='rw' ? 'Numero y\'indangamuntu' : 'National ID'}</label>
              <input value={form.national_id} onChange={change('national_id')} placeholder="1199XXXXXXXXXXX" />
            </div>
          </div>

          <div className="form-group">
            <label>{lang==='rw' ? 'Imeli *' : 'Email *'}</label>
            <input type="email" value={form.email} onChange={change('email')} placeholder="imeli@example.com" />
          </div>

          <div style={styles.grid2}>
            <div className="form-group">
              <label>{lang==='rw' ? 'Telefone' : 'Phone'}</label>
              <input value={form.phone} onChange={change('phone')} placeholder="07XXXXXXXX" />
            </div>
            <div className="form-group">
              <label>{lang==='rw' ? 'Itariki y\'amavuko' : 'Date of Birth'}</label>
              <input type="date" value={form.date_of_birth} onChange={change('date_of_birth')} />
            </div>
          </div>

          <div style={styles.grid2}>
            <div className="form-group">
              <label>{lang==='rw' ? 'Ijambobanga *' : 'Password *'}</label>
              <input type="password" value={form.password} onChange={change('password')} placeholder="••••••" />
            </div>
            <div className="form-group">
              <label>{lang==='rw' ? 'Subiramo ijambobanga *' : 'Confirm Password *'}</label>
              <input type="password" value={form.confirmPassword} onChange={change('confirmPassword')} placeholder="••••••" />
            </div>
          </div>

          <button type="submit" className="btn-blue" disabled={loading} style={{width:'100%', marginTop:8}}>
            {loading ? '...' : (lang==='rw' ? 'Iyandikishe' : 'Register')}
          </button>
        </form>

        <p style={{textAlign:'center', marginTop:14, fontSize:13}}>
          <Link to="/" style={{color:'#2563eb', textDecoration:'none'}}>
            {lang==='rw' ? '← Garuka ku injira' : '← Back to Login'}
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6b 60%, #0a1628 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', position: 'relative',
  },
  langBar: { position: 'absolute', top: 20, right: 20 },
  card: {
    background: 'white', borderRadius: 16, padding: '32px 28px',
    width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  header: { textAlign: 'center', marginBottom: 24 },
  icon: {
    width: 60, height: 60,
    background: 'linear-gradient(135deg, #0a1628, #2563eb)',
    borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', margin: '0 auto 12px', fontSize: 28,
  },
  title: { fontSize: 22, fontWeight: 800, color: '#0a1628', marginBottom: 4 },
  sub: { fontSize: 12, color: '#94a3b8' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
};
