import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, useLang } from '../App';

const T = {
  rw: {
    title: 'HAVANA SHELF DEPARTMENT',
    sub: 'Urubuga Rwo Gukoreraho Ikizami Cya Provisual ',
    welcome: 'Murakaza neza ',
    email: 'Imeli yawe',
    pass: 'Ijambo banga',
    submit: 'Injira ',
    noAcc: "Nta konti ufite? Iyandikishe",
    loading: 'Loading...',
    errRequired: 'Uzuza imeli n\'ijambobanga',
    errLogin: 'Imeli cyangwa ijambobanga ntibihura',
  },
  en: {
    title: 'HAVANA SHELF DEPARTMENT',
    sub: 'Provisional Driving Licence Exam System',
    welcome: 'Welcome ',
    email: 'Your Email',
    pass: 'Password',
    submit: 'Login ',
    noAcc: "Don't have an account? Register",
    loading: 'Loading...',
    errRequired: 'Please enter email and password',
    errLogin: 'Invalid email or password',
  }
};

export default function LoginPage() {
  const { lang, setLang } = useLang();
  const { login } = useAuth();
  const navigate = useNavigate();
  const t = T[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError(t.errRequired); return; }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t.errLogin);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Language Toggle */}
      <div style={styles.langBar}>
        <div className="lang-toggle">
          <button className={`lang-btn ${lang==='rw'?'active':''}`} onClick={()=>setLang('rw')}>RW</button>
          <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={()=>setLang('en')}>EN</button>
        </div>
      </div>

      {/* Card */}
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badgeWrap}>
            <div style={styles.badge}>🦅</div>
          </div>
          <h1 style={styles.title}>{t.title}</h1>
          <p style={styles.sub}>{t.sub}</p>
          <p style={styles.welcome}>{t.welcome}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label>{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="example@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>{t.pass}</label>
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-blue"
            disabled={loading}
            style={{width:'100%', marginTop:8}}
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <p style={styles.registerLink}>
          <Link to="/register" style={{color:'#2563eb', textDecoration:'none', fontSize:13}}>
            {t.noAcc}
          </Link>
        </p>

        {/* Demo hint */}
        <p style={styles.demo}>Havana Shelf Department</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6b 60%, #0a1628 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
  },
  langBar: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  card: {
    background: 'white',
    borderRadius: 16,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
  },
  badgeWrap: {
    width: 72,
    height: 72,
    background: 'linear-gradient(135deg, #0a1628, #2563eb)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
    fontSize: 32,
  },
  badge: { fontSize: 32 },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0a1628',
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  welcome: {
    fontSize: 11,
    color: '#94a3b8',
    background: '#f8fafc',
    padding: '4px 12px',
    borderRadius: 20,
    display: 'inline-block',
  },
  form: { marginBottom: 16 },
  registerLink: { textAlign: 'center', marginTop: 12 },
  demo: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: 8,
  }
};
