import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, useLang } from '../App';

const emptyQuestion = {
  question_rw: '',
  question_en: '',
  question_fr: '',
  option_a_rw: '',
  option_b_rw: '',
  option_c_rw: '',
  option_d_rw: '',
  option_a_en: '',
  option_b_en: '',
  option_c_en: '',
  option_d_en: '',
  option_a_fr: '',
  option_b_fr: '',
  option_c_fr: '',
  option_d_fr: '',
  correct_answer: 'a',
  category: 'road_signs',
  language: 'rw'
};

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const token = localStorage.getItem('rnp_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [system, setSystem] = useState(null);
  const [settings, setSettings] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userExams, setUserExams] = useState([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [questionLanguageFilter, setQuestionLanguageFilter] = useState('all');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('all');
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeExamCount, setActiveExamCount] = useState(0);

  const t = lang === 'rw' ? rw : en;
  const api = (method, url, data) => axios({ method, url, data, headers });

  const loadOverview = async () => setOverview((await api('get', '/api/admin/overview')).data);
  const loadUsers = async () => setUsers((await api('get', '/api/admin/users')).data);
  const loadQuestions = async () => setQuestions((await api('get', '/api/admin/questions')).data);
  const loadExams = async () => setExams((await api('get', '/api/admin/exams')).data);
  const loadSystem = async () => setSystem((await api('get', '/api/admin/system')).data);
  const loadSettings = async () => {
    const s = await api('get', '/api/admin/settings');
    setSettings(s.data);
    setSettingForm({
      pass_mark: s.data.pass_mark || 12,
      exam_duration: s.data.exam_duration || 18,
      questions_per_exam: s.data.questions_per_exam || 20,
      enabled_languages: s.data.enabled_languages || ['rw', 'en', 'fr']
    });
  };
  const loadStatistics = async () => setStatistics((await api('get', '/api/admin/statistics')).data);
  const loadNotifications = async () => setNotifications((await api('get', '/api/admin/notifications')).data);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadOverview(), loadUsers(), loadQuestions(), loadExams(), loadSystem(), loadSettings(), loadStatistics(), loadNotifications()]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveExamCount = async () => {
    try {
      const res = await api('get', '/api/admin/active-exams');
      setActiveExamCount(res.data.count || 0);
    } catch {}
  };

  useEffect(() => { loadAll(); loadActiveExamCount(); }, []);

  const fmtDate = d => d ? new Date(d).toLocaleString() : '-';
  const fmtScore = n => Number(n || 0).toFixed(2);
  const pct = n => `${Math.max(0, Math.min(100, Number(n || 0)))}%`;

  const clientUsers = users.filter(u => u.role !== 'admin');
  const topUsers = [...clientUsers].sort((a, b) => Number(b.exams_taken) - Number(a.exams_taken)).slice(0, 6);
  const weakUsers = [...clientUsers].filter(u => Number(u.exams_taken) > 0).sort((a, b) => Number(a.avg_score) - Number(b.avg_score)).slice(0, 6);
  const categorySummary = questions.reduce((acc, q) => {
    acc[q.category || 'general'] = (acc[q.category || 'general'] || 0) + 1;
    return acc;
  }, {});
  const scoreBuckets = [
    ['0-5', exams.filter(e => Number(e.score) <= 5).length],
    ['6-11', exams.filter(e => Number(e.score) >= 6 && Number(e.score) <= 11).length],
    ['12-15', exams.filter(e => Number(e.score) >= 12 && Number(e.score) <= 15).length],
    ['16-20', exams.filter(e => Number(e.score) >= 16).length]
  ];
  const [examLanguageFilter, setExamLanguageFilter] = useState('all');

  const filteredQuestions = questions.filter(q => questionLanguageFilter === 'all' || q.language === questionLanguageFilter)
    .filter(q => questionCategoryFilter === 'all' || q.category === questionCategoryFilter)
    .sort((a, b) => b.id - a.id);

  const filteredExams = exams.filter(ex => examLanguageFilter === 'all' || ex.language === examLanguageFilter)
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const loadUserExams = async (userId) => {
    const res = await api('get', `/api/admin/users/${userId}/exams`);
    setUserExams(res.data);
    setSelectedUser(userId);
  };

  const [pdfQuestions, setPdfQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/admin/questions/pdf-extract', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setPdfQuestions(res.data);
      setShowPreview(true);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to extract PDF');
    }
  };

  const confirmImport = async () => {
    try {
      await api('post', '/api/admin/questions/bulk', { questions: pdfQuestions });
      setMessage(`${pdfQuestions.length} questions imported`);
      setShowPreview(false);
      setPdfQuestions([]);
      await loadQuestions();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to import');
    }
  };

  const qChange = (key) => (e) => setQuestionForm(f => ({ ...f, [key]: e.target.value }));
  const resetQuestionForm = () => { setQuestionForm(emptyQuestion); setEditingQuestion(null); };

  const saveQuestion = async (e) => {
    e.preventDefault();
    try {
      if (!questionForm.question_rw || !questionForm.option_a_rw || !questionForm.option_b_rw || !questionForm.option_c_rw || !questionForm.option_d_rw) {
        setMessage('Kinyarwanda question and all options are required');
        return;
      }
      if (editingQuestion) await api('put', `/api/admin/questions/${editingQuestion}`, questionForm);
      resetQuestionForm();
      await loadQuestions();
      await loadOverview();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save question');
    }
  };

  const editQuestion = (q) => { setQuestionForm(q); setEditingQuestion(q.id); };

  const deleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api('delete', `/api/admin/questions/${id}`);
      await loadQuestions();
      await loadOverview();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const resetUserPassword = async (u) => {
    const password = window.prompt('Enter new password:');
    if (!password) return;
    try {
      await api('post', `/api/admin/users/${u.id}/reset-password`, { password });
      setMessage(`${u.email}: password reset`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const updateUser = async (u, role) => {
    if (!window.confirm('Change this user role?')) return;
    try {
      await api('put', `/api/admin/users/${u.id}`, { ...u, role });
      await loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update role');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm('Delete this user and their exams?')) return;
    try {
      await api('delete', `/api/admin/users/${u.id}`);
      await loadUsers();
      await loadOverview();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const deleteExam = async (id) => {
    if (!window.confirm('Delete this exam record?')) return;
    try {
      await api('delete', `/api/admin/exams/${id}`);
      await loadExams();
      await loadOverview();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  const clearExams = async () => {
    if (!window.confirm('Clear all exam records?')) return;
    try { await api('post', '/api/admin/system/clear-exams'); await loadAll(); }
    catch (err) { setMessage(err.response?.data?.message || 'Failed to clear exams'); }
  };

const clearUsers = async () => {
    if (!window.confirm('Clear all client users and exams?')) return;
    try { await api('post', '/api/admin/system/clear-users'); await loadAll(); }
    catch (err) { setMessage(err.response?.data?.message || 'Failed to clear users'); }
  };

  const addCandidate = async (e) => {
    e.preventDefault();
    try {
      const res = await api('post', '/api/admin/users', {
        names: newUser.names,
        email: newUser.email,
        phone: newUser.phone,
        national_id: newUser.national_id,
        date_of_birth: newUser.date_of_birth,
        password: newUser.password
      });
      setMessage(`${res.data.registration_code}: User created`);
      setNewUser({ names: '', email: '', phone: '', national_id: '', date_of_birth: '', password: '' });
      await loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create user');
    }
  };

  const [newUser, setNewUser] = useState({ names: '', email: '', phone: '', national_id: '', date_of_birth: '', password: '' });
  const newUserChange = (k) => (e) => setNewUser(f => ({ ...f, [k]: e.target.value }));

  const updateUserStatus = async (u, status) => {
    if (u.role === 'admin') return;
    try {
      await api('put', `/api/admin/users/${u.id}/status`, { status });
      await loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update status');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await api('put', '/api/admin/settings', settingForm);
      setMessage('Settings saved');
      await loadSettings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save settings');
    }
  };

  const [settingForm, setSettingForm] = useState({ pass_mark: 12, exam_duration: 18, questions_per_exam: 20, enabled_languages: ['rw', 'en', 'fr'] });
  const settingChange = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettingForm(f => ({ ...f, [key]: val }));
  };

  const toggleLanguage = (lang) => {
    setSettingForm(f => ({
      ...f,
      enabled_languages: f.enabled_languages.includes(lang)
        ? f.enabled_languages.filter(l => l !== lang)
        : [...f.enabled_languages, lang]
    }));
  };

  const exportReport = async (format) => {
    try {
      const res = await api('get', `/api/admin/reports?format=${format}`, null);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format}`;
      a.click();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to export report');
    }
  };

  const toggleNotification = async (type, enabled) => {
    try {
      await api('post', '/api/admin/notifications', { type, enabled });
      await loadNotifications();
    } catch (err) {}
  };

  const viewExamDetails = (ex) => {
    setSelectedExam(ex);
  };

  const closeExamDetails = () => {
    setSelectedExam(null);
  };

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const tabs = [
    ['reports', t.reports],
    ['users', t.users],
    ['questions', t.questions],
    ['exams', t.exams],
    ['settings', t.settings],
    ['notifications', t.notifications]
  ];

  return (
    <div style={styles.page}>
      <div style={styles.controlPanel}>
        <aside style={styles.sidebar}>
          <div style={styles.brandBlock}>
            <div style={styles.brandMark}>HSD</div>
            <div>
              <div style={styles.brandTitle}>HAVANA SHELF DEPARTMENT</div>
              <div style={styles.brandSub}>HAVANA ADMIN CONTROL PANEL</div>
            </div>
          </div>
          <div style={styles.sideSection}>
            <div style={styles.sideLabel}>{t.navigation}</div>
            {tabs.map(([key, label]) => (
              <button key={key} style={{ ...styles.sideTab, background: tab === key ? '#2563eb' : 'transparent', color: tab === key ? 'white' : '#cbd5e1' }} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>
          <div style={styles.sideSection}>
            <div style={styles.sideLabel}>{t.adminUser}</div>
            <div style={styles.adminMini}>{user?.names || 'Admin'}<span>{user?.email || ''}</span></div>
          </div>
          <div style={styles.sideFooter}>
            <div className="lang-toggle">
              <button className={`lang-btn ${lang === 'rw' ? 'active' : ''}`} onClick={() => setLang('rw')}>RW</button>
              <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
            </div>
            <button onClick={logout} style={styles.sidebarLogout}>{t.logout}</button>
          </div>
        </aside>

        <main style={styles.main}>
          <div style={styles.topbar}>
            <div>
              <h1 style={styles.pageTitle}>{t.title}</h1>
              <p style={styles.sub}>{t.sub}</p>
            </div>
            <div style={styles.topActions}>
              <button className="btn-outline" onClick={loadAll}>{t.refresh}</button>
              <button className="btn-orange" onClick={() => navigate('/dashboard')}>{t.clientDashboard}</button>
            </div>
          </div>

          {message && <div style={styles.message}>{message}</div>}

          {loading ? (
            <div style={styles.loading}>{lang === 'rw' ? 'Gutegura amakuru...' : 'Loading control panel...'}</div>
          ) : (
            <div>
              {tab === 'reports' && overview && (
                <div>
                  <div style={styles.statGrid}>
                    <StatCard label={t.clients} value={overview.userCount} tone="blue" />
                    <StatCard label={t.exams} value={overview.exams} tone="purple" />
                    <StatCard label={t.passRate} value={`${overview.passRate}%`} tone="green" />
                    <StatCard label={t.avgScore} value={fmtScore(overview.avgScore)} tone="orange" />
                    <StatCard label={t.questions} value={overview.questions} tone="blue" />
                    <StatCard label={t.activeUsers} value={overview.activeUsers} tone="purple" />
                    <StatCard label={t.passed} value={overview.passed} tone="green" />
                    <StatCard label={t.failed} value={overview.failed} tone="red" />
                  </div>

                  <div style={styles.reportGrid}>
                    <ReportCard title={t.examPerformance} wide>
                      <ProgressBar label={t.passRate} value={overview.passRate} color="#22c55e" />
                      <div style={styles.bucketGrid}>
                        {scoreBuckets.map(([label, count]) => <MiniMetric key={label} label={label} value={count} />)}
                      </div>
                    </ReportCard>

                    <ReportCard title={t.questionBankHealth} wide>
                      <ProgressBar label={t.readyForExam} value={overview.questions >= 20 ? 100 : Math.round((overview.questions / 20) * 100)} color={overview.questions >= 20 ? '#22c55e' : '#f97316'} />
                      <div style={styles.categoryGrid}>
                        {Object.keys(categorySummary).map(cat => <MiniMetric key={cat} label={cat} value={categorySummary[cat]} />)}
                      </div>
                    </ReportCard>

                    <ReportCard title={t.clientActivityReport}>
                      {topUsers.length === 0 ? <Empty /> : topUsers.map(u => (
                        <ReportRow key={u.id} title={u.names} subtitle={u.email} value={`${u.exams_taken} ${t.exams.toLowerCase()}`} />
                      ))}
                    </ReportCard>

                    <ReportCard title={t.weakPerformanceReport}>
                      {weakUsers.length === 0 ? <Empty /> : weakUsers.map(u => (
                        <ReportRow key={u.id} title={u.names} subtitle={u.email} value={`${fmtScore(u.avg_score)} avg`} danger />
                      ))}
                    </ReportCard>

                    <ReportCard title={t.recentExamActivity} wide>
                      {exams.length === 0 ? <Empty /> : exams.slice(0, 8).map(ex => (
                        <ReportRow key={ex.id} title={`${ex.names} - ${ex.score}/${ex.total_questions}`} subtitle={fmtDate(ex.start_time)} value={ex.passed ? t.pass : t.fail} success={ex.passed} danger={!ex.passed} />
                      ))}
                    </ReportCard>

                    <ReportCard title={t.systemHealth}>
                      <Info label="Node" value={system?.nodeVersion || '-'} />
                      <Info label="Platform" value={system?.platform || '-'} />
                      <Info label="Uptime" value={`${system?.uptimeSeconds || 0}s`} />
                      <Info label="Database" value={system?.counts?.exam_sessions || 0} />
                    </ReportCard>
                  </div>
                </div>
              )}

              {tab === 'users' && (
                <div>
                  <div style={styles.sectionHeader}>
                    <div><h2 style={styles.sectionTitle}>{t.clients}</h2><p style={styles.sectionSub}>{clientUsers.length} {t.registeredClients}</p></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input placeholder={t.searchPlaceholder} value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ ...styles.selectFull, width: 200 }} />
                      <button className="btn-orange" onClick={() => document.getElementById('addUserModal').style.display = 'flex'}>{t.add}</button>
                    </div>
                  </div>
                  <div style={styles.card}>
                    <div style={styles.tableWrap}><table style={styles.table}>
                      <thead><tr><th style={styles.th}>{t.name}</th><th style={styles.th}>{t.email}</th><th style={styles.th}>{t.registrationCode}</th><th style={styles.th}>{t.examTaken}</th><th style={styles.th}>{t.lastExam}</th><th style={styles.th}>{t.lastScore}</th><th style={styles.th}>{t.status}</th><th style={styles.th}>{t.actions}</th></tr></thead>
                      <tbody>
                        {clientUsers.filter(u => 
                          !userSearch || 
                          u.names?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.registration_code?.includes(userSearch)
                        ).map(u => <tr key={u.id}>
                          <td style={styles.td}>{u.names}<br /><span style={styles.muted}>{fmtDate(u.created_at)}</span></td>
                          <td style={styles.td}>{u.email}</td>
                          <td style={styles.td}>{u.registration_code || '-'}</td>
                          <td style={styles.td}>{u.exams_taken}</td>
                          <td style={styles.td}>{fmtDate(u.last_exam_date) || '-'}</td>
                          <td style={styles.td}>{u.last_exam ? u.avg_score : '-'}</td>
                          <td style={styles.td}><select value={u.status || 'active'} onChange={(e) => updateUserStatus(u, e.target.value)} style={styles.select}><option value="active">{t.active}</option><option value="inactive">{t.inactive}</option></select></td>
                          <td style={styles.td}><div style={styles.actions}><button className="btn-sm" onClick={() => loadUserExams(u.id)}>{t.history}</button><button className="btn-sm outline" onClick={() => resetUserPassword(u)}>{t.resetPassword}</button><button className="btn-sm danger" onClick={() => deleteUser(u)}>{t.delete}</button></div></td>
                        </tr>)}
                      </tbody>
                    </table></div>
                  </div>
                  {selectedUser && <UserExamPanel userExams={userExams} fmtDate={fmtDate} t={t} />}
                  <div id="addUserModal" style={{ ...styles.modalOverlay, display: 'none' }}>
                    <div style={styles.modalBox}>
                      <h3>{t.addCandidate}</h3>
                      <form onSubmit={addCandidate} style={styles.form}>
                        <Input label={t.name} value={newUser.names} onChange={newUserChange('names')} required />
                        <Input label={t.email} type="email" value={newUser.email} onChange={newUserChange('email')} required />
                        <Input label={t.phone} value={newUser.phone} onChange={newUserChange('phone')} />
                        <Input label={t.nationalId} value={newUser.national_id} onChange={newUserChange('national_id')} />
                        <Input label={t.password} type="password" value={newUser.password} onChange={newUserChange('password')} required />
                        <div style={styles.modalActions}>
                          <button type="submit" className="btn-blue">{t.save}</button>
                          <button type="button" className="btn-outline" onClick={() => { document.getElementById('addUserModal').style.display = 'none'; setNewUser({ names: '', email: '', phone: '', national_id: '', date_of_birth: '', password: '' }); }}>{t.cancel}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'questions' && (
                <div>
                  <div style={styles.sectionHeader}>
                    <div><h2 style={styles.sectionTitle}>{t.questionBank}</h2><p style={styles.sectionSub}>{questions.length} {t.questions.toLowerCase()}</p></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ ...styles.select, cursor: 'pointer', marginBottom: 0 }}>
                        <input type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
                        {t.importPdf}
                      </label>
                      <select value={questionLanguageFilter} onChange={e => setQuestionLanguageFilter(e.target.value)} style={styles.select}>
                        <option value="all">{t.allLanguages}</option>
                        <option value="rw">{t.kinyarwanda}</option>
                        <option value="en">{t.english}</option>
                        <option value="fr">{t.french}</option>
                      </select>
                      <select value={questionCategoryFilter} onChange={e => setQuestionCategoryFilter(e.target.value)} style={styles.select}>
                        <option value="all">{t.allCategories}</option>
                        <option value="road_signs">{t.roadSigns}</option>
                        <option value="right_of_way">{t.rightOfWay}</option>
                        <option value="speed_limits">{t.speedLimits}</option>
                        <option value="road_markings">{t.roadMarkings}</option>
                        <option value="general_rules">{t.generalRules}</option>
                        <option value="alcohol_safety">{t.alcoholSafety}</option>
                      </select>
                    </div>
                  </div>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>{t.questionList}</h3>
                    <div style={styles.tableWrap}><table style={styles.table}>
                      <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>{t.language}</th><th style={styles.th}>{t.category}</th><th style={styles.th}>{t.hasImage}</th><th style={styles.th}>{t.correct}</th><th style={styles.th}>{t.question}</th><th style={styles.th}>{t.actions}</th></tr></thead>
                      <tbody>
                        {filteredQuestions.length === 0 ? <tr><td colSpan="7" style={styles.td}><Empty /></td></tr> : filteredQuestions.map(q => <tr key={q.id}>
                          <td style={styles.td}>{q.id}</td>
                          <td style={styles.td}>{q.language?.toUpperCase()}</td>
                          <td style={styles.td}>{t[q.category]?.split(' ').pop() || q.category}</td>
                          <td style={styles.td}>{q.image_path ? t.yes : t.no}</td>
                          <td style={styles.td}>{q.correct_answer.toUpperCase()}</td>
                          <td style={styles.td}>{q.question_rw}<br /><span style={styles.muted}>{q.question_en}</span></td>
                          <td style={styles.td}><div style={styles.actions}><button className="btn-sm" onClick={() => editQuestion(q)}>{t.edit}</button><button className="btn-sm danger" onClick={() => deleteQuestion(q.id)}>{t.delete}</button></div></td>
                        </tr>)}
                      </tbody>
                    </table></div>
                  </div>
                  {editingQuestion && editingQuestion !== null && (
                    <div style={styles.modalOverlay}>
                      <div style={styles.modalBox}>
                        <h3 style={styles.cardTitle}>{t.editQuestion}</h3>
                        <form onSubmit={saveQuestion} style={styles.form}>
                          <div style={styles.grid2}><Input label={t.questionRw} value={questionForm.question_rw} onChange={qChange('question_rw')} required /><Input label={t.questionEn} value={questionForm.question_en} onChange={qChange('question_en')} /></div>
                          <div style={styles.grid2}><Input label={t.questionFr} value={questionForm.question_fr} onChange={qChange('question_fr')} /></div>
                          <div style={styles.grid2}><Input label="A RW" value={questionForm.option_a_rw} onChange={qChange('option_a_rw')} required /><Input label="B RW" value={questionForm.option_b_rw} onChange={qChange('option_b_rw')} required /><Input label="C RW" value={questionForm.option_c_rw} onChange={qChange('option_c_rw')} required /><Input label="D RW" value={questionForm.option_d_rw} onChange={qChange('option_d_rw')} required /></div>
                          <div style={styles.grid2}><Input label="A EN" value={questionForm.option_a_en} onChange={qChange('option_a_en')} /><Input label="B EN" value={questionForm.option_b_en} onChange={qChange('option_b_en')} /><Input label="C EN" value={questionForm.option_c_en} onChange={qChange('option_c_en')} /><Input label="D EN" value={questionForm.option_d_en} onChange={qChange('option_d_en')} /></div>
                          <div style={styles.grid2}><Input label="A FR" value={questionForm.option_a_fr} onChange={qChange('option_a_fr')} /><Input label="B FR" value={questionForm.option_b_fr} onChange={qChange('option_b_fr')} /><Input label="C FR" value={questionForm.option_c_fr} onChange={qChange('option_c_fr')} /><Input label="D FR" value={questionForm.option_d_fr} onChange={qChange('option_d_fr')} /></div>
                          <div style={styles.grid2}>
                            <div className="form-group"><label>{t.correct}</label><select value={questionForm.correct_answer} onChange={qChange('correct_answer')} style={styles.selectFull}><option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option></select></div>
                            <div className="form-group"><label>{t.category}</label><select value={questionForm.category} onChange={qChange('category')} style={styles.selectFull}>
                              <option value="road_signs">{t.roadSigns}</option>
                              <option value="right_of_way">{t.rightOfWay}</option>
                              <option value="speed_limits">{t.speedLimits}</option>
                              <option value="road_markings">{t.roadMarkings}</option>
                              <option value="general_rules">{t.generalRules}</option>
                              <option value="alcohol_safety">{t.alcoholSafety}</option>
                            </select></div>
                            <div className="form-group"><label>{t.language}</label><select value={questionForm.language} onChange={qChange('language')} style={styles.selectFull}>
                              <option value="rw">{t.kinyarwanda}</option>
                              <option value="en">{t.english}</option>
                              <option value="fr">{t.french}</option>
                            </select></div>
                          </div>
                          <div style={styles.modalActions}><button type="submit" className="btn-blue">{t.save}</button><button type="button" className="btn-outline" onClick={resetQuestionForm}>{t.cancel}</button></div>
                        </form>
                      </div>
                    </div>
                  )}
                  {showPreview && (
                    <div style={styles.modalOverlay}>
                      <div style={{ ...styles.modalBox, maxWidth: 700 }}>
                        <h3 style={styles.cardTitle}>{t.preview}: {pdfQuestions.length} {t.questions.toLowerCase()}</h3>
                        <div style={{ maxHeight: '40vh', overflow: 'auto' }}>
                          {pdfQuestions.slice(0, 5).map((q, i) => <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                            <strong>{i+1}. {q.question_rw}</strong><br />
                            <span style={{ fontSize: 11 }}>{t.a}: {q.option_a_rw} | {t.b}: {q.option_b_rw}</span>
                          </div>)}
                          {pdfQuestions.length > 5 && <div style={{ padding: '10px', textAlign: 'center' }}>{t.andMore}: {pdfQuestions.length - 5}</div>}
                        </div>
                        <div style={styles.modalActions}>
                          <button className="btn-blue" onClick={confirmImport}>{t.confirmImport}</button>
                          <button className="btn-outline" onClick={() => setShowPreview(false)}>{t.cancel}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'exams' && (
                <div>
                  <div style={styles.sectionHeader}>
                    <div><h2 style={styles.sectionTitle}>{t.examRecords}</h2><p style={styles.sectionSub}>{exams.length} {t.records.toLowerCase()}</p></div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={examLanguageFilter} onChange={e => setExamLanguageFilter(e.target.value)} style={styles.select}>
                        <option value="all">{t.allLanguages}</option>
                        <option value="rw">{t.kinyarwanda}</option>
                        <option value="en">{t.english}</option>
                        <option value="fr">{t.french}</option>
                      </select>
                      <span className="badge-orange">{t.activeExams}: {activeExamCount}</span>
                    </div>
                  </div>
                  <div style={styles.card}><div style={styles.tableWrap}><table style={styles.table}>
                    <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>{t.user}</th><th style={styles.th}>{t.datetime}</th><th style={styles.th}>{t.language}</th><th style={styles.th}>{t.score}</th><th style={styles.th}>{t.timeTaken}</th><th style={styles.th}>{t.status}</th><th style={styles.th}>{t.actions}</th></tr></thead>
                    <tbody>{filteredExams.length === 0 ? <tr><td colSpan="8" style={styles.td}><Empty /></td></tr> : filteredExams.map(ex => <tr key={ex.id}>
                      <td style={styles.td}>{ex.id}</td>
                      <td style={styles.td}>{ex.names}<br /><span style={styles.muted}>{ex.email}</span></td>
                      <td style={styles.td}>{fmtDate(ex.start_time)}</td>
                      <td style={styles.td}>{ex.language?.toUpperCase()}</td>
                      <td style={styles.td}>{ex.score}/{ex.total_questions}</td>
                      <td style={styles.td}>{ex.time_taken ? Math.round(ex.time_taken/60) + 'm' : '-'}</td>
                      <td style={styles.td}><span className={ex.passed ? 'badge-pass' : 'badge-fail'}>{ex.passed ? t.pass : t.fail}</span></td>
                      <td style={styles.td}><div style={styles.actions}><button className="btn-sm" onClick={() => viewExamDetails(ex)}>{t.view}</button><button className="btn-sm danger" onClick={() => deleteExam(ex.id)}>{t.delete}</button></div></td>
                    </tr>)}</tbody>
                  </table></div></div>
                  {selectedExam && <ExamDetailPanel exam={selectedExam} questions={questions} fmtDate={fmtDate} t={t} onClose={closeExamDetails} />}
                </div>
              )}

              {tab === 'settings' && settings && (
                <div>
                  <div style={styles.sectionHeader}><div><h2 style={styles.sectionTitle}>{t.settings}</h2><p style={styles.sectionSub}>{t.configureSystem}</p></div></div>
                  <div style={styles.twoColumn}>
                    <div style={styles.card}>
                      <h3 style={styles.cardTitle}>{t.examSettings}</h3>
                      <form onSubmit={saveSettings} style={styles.form}>
                        <div className="form-group"><label>{t.passMark}</label><input type="number" min="1" max="20" value={settingForm.pass_mark} onChange={settingChange('pass_mark')} style={styles.selectFull} /></div>
                        <div className="form-group"><label>{t.examDuration} ({t.minutes})</label><input type="number" min="1" max="120" value={settingForm.exam_duration} onChange={settingChange('exam_duration')} style={styles.selectFull} /></div>
                        <div className="form-group"><label>{t.questionsPerExam}</label><input type="number" min="1" max="100" value={settingForm.questions_per_exam} onChange={settingChange('questions_per_exam')} style={styles.selectFull} /></div>
                        <div style={styles.actions}><button type="submit" className="btn-blue">{t.save}</button></div>
                      </form>
                    </div>
                    <div style={styles.card}>
                      <h3 style={styles.cardTitle}>{t.languages}</h3>
                      <div style={styles.languageGrid}>
                        <label style={styles.languageToggle}><input type="checkbox" checked={settingForm.enabled_languages?.includes('rw')} onChange={() => toggleLanguage('rw')} /> {t.kinyarwanda}</label>
                        <label style={styles.languageToggle}><input type="checkbox" checked={settingForm.enabled_languages?.includes('en')} onChange={() => toggleLanguage('en')} /> {t.english}</label>
                        <label style={styles.languageToggle}><input type="checkbox" checked={settingForm.enabled_languages?.includes('fr')} onChange={() => toggleLanguage('fr')} /> {t.french}</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'notifications' && (
                <div>
                  <div style={styles.sectionHeader}><div><h2 style={styles.sectionTitle}>{t.notifications}</h2><p style={styles.sectionSub}>{t.reportNotifications}</p></div></div>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>{t.dailySummary}</h3>
                    <div style={styles.notificationRow}>
                      <span>{t.dailySummaryEmail}</span>
                      <button className={notifications.find(n => n.type === 'daily')?.enabled ? 'btn-sm' : 'btn-sm outline'} 
                        onClick={() => toggleNotification('daily', !notifications.find(n => n.type === 'daily')?.enabled)}>
                        {notifications.find(n => n.type === 'daily')?.enabled ? t.enabled : t.disabled}
                      </button>
                    </div>
                  </div>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>{t.weeklySummary}</h3>
                    <div style={styles.notificationRow}>
                      <span>{t.weeklySummaryEmail}</span>
                      <button className={notifications.find(n => n.type === 'weekly')?.enabled ? 'btn-sm' : 'btn-sm outline'} 
                        onClick={() => toggleNotification('weekly', !notifications.find(n => n.type === 'weekly')?.enabled)}>
                        {notifications.find(n => n.type === 'weekly')?.enabled ? t.enabled : t.disabled}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, tone }) => {
  const val = typeof value === 'number' ? value : parseInt(value) || 0;
  return <div style={{ ...styles.statCard, borderLeft: `4px solid ${toneColor(tone)}` }}><div style={styles.statLabel}>{label}</div><div style={styles.statValue}>{value}</div></div>;
};

function ReportCard({ title, children, wide }) {
  return <div style={{ ...styles.reportCard, gridColumn: wide ? 'span 2' : 'span 1' }}><div style={styles.reportTitle}>{title}</div>{children}</div>;
}

function ProgressBar({ label, value, color }) {
  return <div style={styles.progressBlock}><div style={styles.progressMeta}><span>{label}</span><strong>{pctLocal(value)}</strong></div><div style={styles.progressBg}><div style={{ ...styles.progressFill, width: pctLocal(value), background: color }} /></div></div>;
}

function MiniMetric({ label, value }) {
  return <div style={styles.miniMetric}><span>{label}</span><strong>{value}</strong></div>;
}

function ReportRow({ title, subtitle, value, success, danger }) {
  return <div style={styles.reportRow}><div><strong style={styles.reportTitleText}>{title}</strong><span style={styles.muted}>{subtitle}</span></div><span style={{ ...styles.rowValue, color: danger ? '#dc2626' : success ? '#16a34a' : '#2563eb' }}>{value}</span></div>;
}

function Empty() {
  return <div style={styles.empty}>No data available</div>;
}

function UserExamPanel({ userExams, fmtDate, t }) {
  return <div style={{ ...styles.card, marginTop: 16 }}><h3 style={styles.cardTitle}>{t.userExamHistory}</h3>{userExams.length === 0 ? <Empty /> : <div style={styles.tableWrap}><table style={styles.table}>
    <thead><tr><th style={styles.th}>#</th><th style={styles.th}>{t.date}</th><th style={styles.th}>{t.score}</th><th style={styles.th}>{t.status}</th></tr></thead>
    <tbody>{userExams.map((ex, i) => <tr key={ex.id}><td style={styles.td}>{i + 1}</td><td style={styles.td}>{fmtDate(ex.start_time)}</td><td style={styles.td}>{ex.score}/{ex.total_questions}</td><td style={styles.td}><span className={ex.passed ? 'badge-pass' : 'badge-fail'}>{ex.passed ? t.pass : t.fail}</span></td></tr>)}</tbody>
  </table></div>}</div>;
}

function ExamDetailPanel({ exam, questions, fmtDate, t, onClose }) {
  const answers = typeof exam.answers === 'string' ? JSON.parse(exam.answers) : exam.answers || {};
  const answerEntries = Object.entries(answers);
  return <div style={styles.modalOverlay}>
    <div style={{ ...styles.modalBox, maxWidth: 600 }}>
      <h3 style={styles.cardTitle}>{t.examDetails}: {exam.names} - {exam.score}/{exam.total_questions}</h3>
      <p>{t.date}: {fmtDate(exam.start_time)} | {t.language}: {exam.language?.toUpperCase()}</p>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>#</th><th style={styles.th}>{t.question}</th><th style={styles.th}>{t.yourAnswer}</th><th style={styles.th}>{t.correct}</th></tr></thead>
          <tbody>
            {answerEntries.map(([qid, ans], i) => {
              const q = questions.find(x => x.id === parseInt(qid));
              return <tr key={qid}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>{q ? (q.question_rw || q.question_en) : '-'}</td>
                <td style={styles.td}>{ans?.toUpperCase()}</td>
                <td style={styles.td}>{q?.correct_answer?.toUpperCase()}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, textAlign: 'right' }}><button className="btn-outline" onClick={onClose}>{t.close}</button></div>
    </div>
  </div>;
}

function Input({ label, value, onChange, required, type }) {
  return <div className="form-group"><label>{label}</label><input type={type || 'text'} value={value} onChange={onChange} required={required} /></div>;
}

function Info({ label, value }) {
  return <div style={styles.infoRow}><span style={styles.muted}>{label}</span><strong style={{ color: '#1e293b' }}>{value}</strong></div>;
}

function toneColor(tone) {
  return { blue: '#2563eb', purple: '#7c3aed', green: '#22c55e', orange: '#f97316', red: '#dc2626' }[tone] || '#2563eb';
}

function pctLocal(value) {
  return `${Math.max(0, Math.min(100, Number(value || 0)))}%`;
}

const rw = {
  reports: 'Reports', users: 'Users', questions: 'Questions', exams: 'Exams', settings: 'Settings', notifications: 'Notifications',
  title: 'Admin Dashboard', sub: 'Manage candidates, questions, exam sessions, statistics, and settings',
  clientDashboard: 'Client Dashboard', logout: 'Logout', refresh: 'Refresh', navigation: 'Navigation', adminUser: 'Admin User',
  clients: 'Candidates', registeredClients: 'registered candidates', examTaken: 'Exams', lastExam: 'Last Exam', lastScore: 'Last Score',
  registrationCode: 'Registration Code', nationalId: 'ID Number', searchPlaceholder: 'Search name, ID, or reg code...',
  exams: 'Exams', records: 'records', passed: 'Passed', failed: 'Failed', passRate: 'Pass Rate',
  avgScore: 'Average Score', activeUsers: 'Active Users', questionBankHealth: 'Question Bank Health', readyForExam: 'Ready for exam',
  examPerformance: 'Exam Performance', clientActivityReport: 'Most Active Candidates', weakPerformanceReport: 'Low Performance Candidates',
  recentExamActivity: 'Recent Exams', systemHealth: 'System Health', name: 'Name', email: 'Email', phone: 'Phone',
  totalExamsToday: 'Total Exams Today', totalExamsWeek: 'Total Exams This Week', totalExamsMonth: 'Total Exams This Month',
  newUsersToday: 'New Users Today', newUsersWeek: 'New Users This Week', newUsersMonth: 'New Users This Month',
  questionsPerExam: 'Questions per Exam', examDuration: 'Exam Duration', minutes: 'minutes',
  passMark: 'Pass Mark', languages: 'Languages', enabledLanguages: 'Enabled Languages', save: 'Save', add: 'Add', cancel: 'Cancel',
  view: 'View', close: 'Close', datetime: 'Date/Time', timeTaken: 'Time Taken', yourAnswer: 'Your Answer', examDetails: 'Exam Details',
  activeExams: 'Active Exams', reportNotifications: 'Report Notifications', dailySummary: 'Daily Summary', weeklySummary: 'Weekly Summary',
dailySummaryEmail: 'Daily summary email at end of day', weeklySummaryEmail: 'Weekly summary email every Monday',
   enabled: 'Enabled', disabled: 'Disabled', configureSystem: 'Configure system settings',
   questionBank: 'Question Bank', questionList: 'Question List', editQuestion: 'Edit Question', addQuestion: 'Add Question',
   questionRw: 'Question (RW)', questionEn: 'Question (EN)', questionFr: 'Question (FR)', correct: 'Correct', category: 'Category',
   hasImage: 'Has Image', yes: 'Yes', no: 'No',
   kinyarwanda: 'Kinyarwanda', english: 'English', french: 'Français',
   allLanguages: 'All Languages', allCategories: 'All Categories',
   roadSigns: 'Road Signs', rightOfWay: 'Right of Way', speedLimits: 'Speed Limits',
   roadMarkings: 'Road Markings', generalRules: 'General Rules', alcoholSafety: 'Alcohol & Safety',
   addCandidate: 'Add Candidate', active: 'Active', inactive: 'Inactive',
   history: 'History', resetPassword: 'Reset Password', delete: 'Delete', userExamHistory: 'User Exam History', answers: 'Answers',
   examRecords: 'Exam Records', user: 'User', score: 'Score', status: 'Status', date: 'Date', pass: 'PASS', fail: 'FAIL',
   systemControl: 'System Control', databaseAndRuntime: 'Database tables and runtime environment', systemInfo: 'System Information', tableCounts: 'Table Counts',
   dangerZone: 'Danger Zone', dangerText: 'These actions delete data permanently.', clearExams: 'Clear All Exams', clearUsers: 'Clear All Candidates',
   languageGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
   languageToggle: { display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#f8fafc', borderRadius: 8 },
   notificationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0' },
   examSettings: 'Exam Settings', configureSystem: 'Configure system parameters',
   importPdf: 'Import PDF', preview: 'Preview', confirmImport: 'Confirm Import', andMore: '...and more',
   a: 'A', b: 'B'
};

const en = rw;

const styles = {
  page: { minHeight: '100vh', background: '#0f172a' },
  controlPanel: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '280px 1fr', background: '#eef2f7' },
  sidebar: { background: 'linear-gradient(180deg, #07111f 0%, #0f172a 100%)', color: 'white', padding: 22, display: 'flex', flexDirection: 'column', gap: 24 },
  brandBlock: { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.12)' },
  brandMark: { width: 48, height: 48, borderRadius: 14, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 10px 24px rgba(37,99,235,0.35)' },
  brandTitle: { fontWeight: 900, letterSpacing: '0.5px' },
  brandSub: { color: '#94a3b8', fontSize: 11, fontWeight: 800, marginTop: 2 },
  sideSection: {},
  sideLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.8px' },
  sideTab: { width: '100%', textAlign: 'left', border: '1px solid transparent', padding: '11px 12px', borderRadius: 10, color: '#cbd5e1', cursor: 'pointer', fontWeight: 800, marginBottom: 6, transition: 'all 0.2s' },
  adminMini: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, fontSize: 13 },
  sideFooter: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 },
  sidebarLogout: { width: '100%', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'white', padding: 10, borderRadius: 10, cursor: 'pointer', fontWeight: 800 },
  main: { padding: 24, overflow: 'auto' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' },
  pageTitle: { fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 4 },
  sub: { color: '#64748b', fontSize: 13 },
  topActions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  message: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 },
  loading: { background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: '#64748b', boxShadow: '0 12px 30px rgba(15,23,42,0.06)' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 16 },
  statCard: { background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 12px 30px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0' },
  statLabel: { color: '#64748b', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px' },
  statValue: { fontSize: 30, fontWeight: 900, color: '#0f172a', marginTop: 8 },
  reportGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 },
  reportCard: { background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 12px 30px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0', minHeight: 230 },
  reportTitle: { fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' },
  progressBlock: { marginBottom: 14 },
  progressMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', fontWeight: 800, marginBottom: 8 },
  progressBg: { height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, transition: 'width 0.3s' },
  bucketGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  miniMetric: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 10, textAlign: 'center' },
  miniMetricSpan: { display: 'block', color: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  miniMetricStrong: { display: 'block', color: '#0f172a', fontSize: 18, fontWeight: 900, marginTop: 4 },
  reportRow: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' },
  reportTitleText: { display: 'block', color: '#1e293b', fontSize: 12 },
  rowValue: { fontWeight: 900, fontSize: 12, whiteSpace: 'nowrap' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 4 },
  sectionSub: { color: '#64748b', fontSize: 12 },
  card: { background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 12px 30px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 900, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' },
  td: { padding: '10px 8px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' },
  muted: { color: '#94a3b8', fontSize: 11 },
  select: { padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 },
  selectFull: { width: '100%', padding: '11px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' },
  actions: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  empty: { color: '#94a3b8', textAlign: 'center', padding: 24 },
  pre: { whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 8, borderRadius: 8, margin: 0, maxWidth: 260, fontSize: 11, color: '#334155' },
  twoColumn: { display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, alignItems: 'start' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  warning: { color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12 },
  infoRow: { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: '1px solid #e2e8f0', alignItems: 'center' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: 'white', borderRadius: 16, padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto' },
  modalActions: { display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 },
  languageGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  languageToggle: { display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#f8fafc', borderRadius: 8 }
};
