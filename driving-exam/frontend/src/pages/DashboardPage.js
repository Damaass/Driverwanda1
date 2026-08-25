import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, useLang } from '../App';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [qCount, setQCount] = useState(null);

  const token = localStorage.getItem('rnp_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get('/api/exam/history', { headers })
      .then(r => setHistory(r.data))
      .catch(() => {});
    axios.get('/api/admin/stats')
      .then(r => setQCount(r.data.questions))
      .catch(() => {});
  }, []);

  const startExam = () => {
    if (qCount !== null && qCount < 20) {
      alert(lang==='rw'
        ? `Ibibazo ntibihagije muri database (${qCount}/20). Reba admin.`
        : `Not enough questions in database (${qCount}/20). Contact admin.`);
      return;
    }
    setShowModal(true);
  };

  const startTraining = () => {
    navigate('/training');
  };

  const confirmStart = () => {
    setShowModal(false);
    navigate('/exam');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '-';

  const rw = {
    title: 'DRIVE RWANDA',
    uzakora: 'IBIKURANGA',
    ikizamini: 'Ikizamini',
    amabwiriza: 'Amabwiriza',
    kodeYo: 'Kode yo Gukoreraho',
    itariki: 'Itariki yo Gukorera',
    izina: 'Izina ry\'idini',
    izinaRye: 'Izina ry\'umuryango',
    indangamuntu: 'Indangamuntu',
    telefone: 'Telefone',
    itarikiAmavuko: 'Itariki y\'amavuko',
    kategori: 'Kategori y\'uruhushya rwo gutwara',
    ibinyabiziga: 'Ibinyabiziga',
    ururimi: 'Ururimi rw\'ikizamini',
    provisional: 'Provisional',
    examType: 'Ubwoko bw\'ikizamini',
    theory: 'THEORY',
    uburyo: 'Uburyo bw\'ikizamini',
    computer: 'computerbased',
    ahoBigeze: 'Aho kwiyandikisha bigeze',
    paid: 'paid',
    umubare: 'Umubare w\'ibibazo',
    amanotaYose: 'Amanota yose',
    amanotaGutsindira: 'Amanota yo gutsindiraho',
    igihe: 'Igihe kimara',
    min20: 'Iminota 20',
    tangira: '✓ Tangira gukora ikizamini',
    history: 'Ibizami wakoze',
    noHistory: 'Nta kizamini wakoze mbere',
    score: 'Amanota',
    passed: 'Watsinze',
    failed: 'Watsinzwe',
    logout: 'Sohoka',
    modalTitle: 'Urifuza gutangira ikizamini?',
    modalText: 'Niba uteritunganya kanda Ndacyitunganya, niba wifuza gutangira kanda Ndashaka gutangira. Ubundi ujye ukenda kuri Next kujya ku kindi kibazo cyangwa ukande Previous gusubira inyuma.',
    ndacyi: 'Ndacyitunganya',
    ndashaka: 'Ndashaka gutangira',
    instructions: [
      'Ibibazo ni 20, buri kibazo gifite igisubizo kimwe gusa cy\'ukuri',
      'Igihe imara ni iminota 20 - Ugomba gusubiza ibibazo byose mbere y\'igihe',
      'Amanota yo gutsindiraho: 12/20 (60%)',
      'Niba igihe kirangiye, ikizamini gisozwa vuba',
      'Ushobora guhinduka hagati y\'ibibazo ukoresha imbuto',
    ]
  };

  const en = {
    title: 'Provisional Driving Licence Exam',
    uzakora: 'Personal Profile',
    ikizamini: 'Exam',
    amabwiriza: 'Instructions',
    kodeYo: 'Registration Code',
    itariki: 'Registration Date',
    izina: 'First Name',
    izinaRye: 'Family Name',
    indangamuntu: 'National ID',
    telefone: 'Phone',
    itarikiAmavuko: 'Date of Birth',
    kategori: 'Licence Category',
    ibinyabiziga: 'Vehicle Type',
    ururimi: 'Exam Language',
    provisional: 'Provisional',
    examType: 'Exam Type',
    theory: 'THEORY',
    uburyo: 'Exam Method',
    computer: 'Computer-based',
    ahoBigeze: 'Payment Status',
    paid: 'PAID',
    umubare: 'Number of Questions',
    amanotaYose: 'Total Marks',
    amanotaGutsindira: 'Pass Mark',
    igihe: 'Time Limit',
    min20: '20 Minutes',
    tangira: '✓ Start Exam',
    history: 'Exam History',
    noHistory: 'No previous exams',
    score: 'Score',
    passed: 'PASSED',
    failed: 'FAILED',
    logout: 'Logout',
    modalTitle: 'Start the exam?',
    modalText: 'If you are not ready click "Not Ready". If you want to start click "Start Now". You can use Next/Previous to navigate between questions.',
    ndacyi: 'Not Ready',
    ndashaka: 'Start Now',
    instructions: [
      '20 questions, each with only one correct answer',
      'Time limit: 20 minutes - answer all questions before time expires',
      'Pass mark: 12/20 (60%)',
      'When time expires, the exam is automatically submitted',
      'You can navigate between questions using the number bubbles',
    ]
  };

  const t = lang === 'rw' ? rw : en;
  const names = user?.names || '';
  const nameParts = names.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div style={styles.page}>
      {/* Top Nav */}
      <div style={styles.nav}>
        <div style={styles.navLeft}>
          <span style={styles.navIcon}>🦅</span>
          <span style={styles.navTitle}>HAVANA SHELF DEPARTMENT</span>
        </div>
        <div style={styles.navRight}>
          <div className="lang-toggle">
            <button className={`lang-btn ${lang==='rw'?'active':''}`} onClick={()=>setLang('rw')}>RW</button>
            <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={()=>setLang('en')}>EN</button>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>
            {t.logout} →
          </button>
        </div>
      </div>

      <div style={styles.container}>
        {/* Page Title */}
        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>{t.title}</h2>
        </div>

        <div style={styles.mainGrid}>
          {/* LEFT: Candidate Info */}
          <div style={styles.infoCard}>
            <h3 style={styles.cardTitle}>{t.uzakora}</h3>
            <div style={styles.infoGrid}>
              <InfoRow label={t.kodeYo} value={`RNP${user?.id?.toString().padStart(8,'0') || '00000001'}`} />
              <InfoRow label={t.itariki} value={formatDate(user?.created_at)} />
              <InfoRow label={t.izina} value={firstName} />
              <InfoRow label={t.izinaRye} value={lastName || user?.names} />
              <InfoRow label={t.indangamuntu} value={user?.national_id || '-'} />
              <InfoRow label={t.telefone} value={user?.phone || '-'} />
              <InfoRow label={t.itarikiAmavuko} value={user?.date_of_birth || '-'} />
              <InfoRow label={t.kategori} value="B" />
              <InfoRow label={t.ibinyabiziga} value={t.provisional} />
              <InfoRow label={t.ururimi} value={lang === 'rw' ? 'Ikinyarwanda' : 'English'} />
            </div>

            {/* Instructions */}
            <div style={styles.instructBox}>
              <p style={styles.instructTitle}>📋 {t.amabwiriza}</p>
              {t.instructions.map((ins, i) => (
                <p key={i} style={styles.instructItem}>• {ins}</p>
              ))}
            </div>
          </div>

          {/* RIGHT: Exam Info */}
          <div style={styles.rightCol}>
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>{t.ikizamini}</h3>
              <div style={styles.infoGrid}>
                <InfoRow label={t.examType} value={t.theory} highlight />
                <InfoRow label={t.uburyo} value={t.computer} />
                <InfoRow label={t.ahoBigeze} value={t.paid} highlight />
                <InfoRow label={t.umubare} value="20" />
                <InfoRow label={t.amanotaYose} value="20" />
                <InfoRow label={t.amanotaGutsindira} value="12" highlight />
                <InfoRow label={t.igihe} value={t.min20} />
              </div>

               {/* Start button */}
               <button onClick={startExam} className="btn-blue" style={styles.startBtn}>
                 {t.tangira}
               </button>
               <button onClick={startTraining} className="btn-orange" style={{...styles.startBtn, marginTop:10}}>
                 {lang==='rw' ? '📚 SOMA AMATEGEKO YUMUHANDA' : '📚 Start Training'}
               </button>
            </div>

            {/* Exam History */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>📊 {t.history}</h3>
              {history.length === 0 ? (
                <p style={styles.noHistory}>{t.noHistory}</p>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>{t.score}</th>
                        <th style={styles.th}></th>
                        <th style={styles.th}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={h.id} style={i%2===0?{background:'#f8fafc'}:{}}>
                          <td style={styles.td}>{i+1}</td>
                          <td style={styles.td}><strong>{h.score}/{h.total_questions}</strong></td>
                          <td style={styles.td}>
                            <span className={h.passed ? 'badge-pass' : 'badge-fail'}>
                              {h.passed ? t.passed : t.failed}
                            </span>
                          </td>
                          <td style={styles.td}>{new Date(h.start_time).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>🎯 {t.modalTitle}</h3>
            <p>{t.modalText}</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={()=>setShowModal(false)}>{t.ndacyi}</button>
              <button className="btn-blue" onClick={confirmStart}>{t.ndashaka}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13
    }}>
      <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
      <span style={{
        color: highlight ? '#1d4ed8' : '#1e293b',
        fontWeight: highlight ? 700 : 600
      }}>{value}</span>
    </div>
  );
}

function formatDate(d) { return d ? new Date(d).toLocaleString() : '-'; }

const styles = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  nav: {
    background: 'linear-gradient(90deg, #0a1628, #1a3a6b)',
    padding: '12px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  navIcon: { fontSize: 24 },
  navTitle: { color: 'white', fontWeight: 700, fontSize: 16 },
  navRight: { display: 'flex', alignItems: 'center', gap: 14 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)', color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
  },
  container: { maxWidth: 1100, margin: '0 auto', padding: '20px 16px' },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 20, fontWeight: 800, color: '#0a1628' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  infoCard: {
    background: 'white', borderRadius: 12, padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#0a1628', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoGrid: { marginBottom: 16 },
  instructBox: { background: '#f8fafc', borderRadius: 8, padding: '12px', marginTop: 8 },
  instructTitle: { fontWeight: 700, color: '#1e293b', fontSize: 13, marginBottom: 8 },
  instructItem: { fontSize: 12, color: '#64748b', marginBottom: 4, lineHeight: 1.5 },
  rightCol: {},
  startBtn: {
    width: '100%', marginTop: 20,
    padding: '16px',
    fontSize: 16,
    borderRadius: 10,
  },
  noHistory: { color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0' },
  td: { padding: '8px 10px', color: '#1e293b' },
};
