import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../App';

const TOTAL_TIME = 20 * 60; // 20 minutes in seconds
const PASS_MARK = 12;

export default function ExamPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const token = localStorage.getItem('rnp_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: 'a'|'b'|'c'|'d' }
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(new Date().toISOString());
  const timerRef = useRef(null);

  // Load questions
  useEffect(() => {
    axios.get('/api/exam/questions', { headers })
      .then(r => {
        setQuestions(r.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load questions');
        setLoading(false);
      });
  }, []);

  // Timer countdown
  useEffect(() => {
    if (loading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, questions.length]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const selectAnswer = (questionId, option) => {
    setAnswers(prev => {
      if (prev[questionId] === option) {
        // deselect
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      }
      return { ...prev, [questionId]: option };
    });
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const questionIds = questions.map(q => q.id);
      const res = await axios.post('/api/exam/submit', {
        answers,
        startTime: startTimeRef.current,
        questionIds
      }, { headers });
      navigate('/result', { state: { result: res.data, lang } });
    } catch (err) {
      alert('Error submitting exam. Please try again.');
      setSubmitting(false);
    }
  }, [answers, questions, submitting, navigate, lang]);

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isWarning = timeLeft < 120; // 2 minutes

  if (loading) return <LoadingScreen lang={lang} />;
  if (error) return <ErrorScreen msg={error} lang={lang} />;
  if (!q) return null;

  const options = ['a', 'b', 'c', 'd'];
  const optionText = (opt) => {
    if (lang === 'en') {
      return q[`option_${opt}_en`] || q[`option_${opt}_rw`];
    }
    return q[`option_${opt}_rw`];
  };
  const questionText = lang === 'en' ? (q.question_en || q.question_rw) : q.question_rw;

  return (
    <div style={styles.page}>
      {/* ── TOP BAR ── */}
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <span style={styles.rnpIcon}>🦅</span>
          <span style={styles.rnpLabel}>HSD - Ikizamini</span>
        </div>

        {/* Question bubbles */}
        <div style={styles.bubblesWrap}>
          <div style={styles.bubblesRow}>
            {questions.slice(0, 10).map((q2, i) => (
              <div
                key={q2.id}
                className={`bubble ${i === current ? 'current' : answers[q2.id] ? 'answered' : 'unanswered'}`}
                onClick={() => setCurrent(i)}
                title={`Q${i+1}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div style={styles.bubblesRow}>
            {questions.slice(10, 20).map((q2, i) => {
              const idx = i + 10;
              return (
                <div
                  key={q2.id}
                  className={`bubble ${idx === current ? 'current' : answers[q2.id] ? 'answered' : 'unanswered'}`}
                  onClick={() => setCurrent(idx)}
                  title={`Q${idx+1}`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timer */}
        <div>
          <div className={`timer ${isWarning ? 'warning' : ''}`}>
            <div style={{fontSize:10, opacity:0.8, marginBottom:2}}>IGIHE GISIGAYE</div>
            <div style={{fontSize:18, letterSpacing:2}}>{formatTime(timeLeft)}</div>
          </div>
          <div style={styles.progress}>
            {answeredCount}/{questions.length} {lang==='rw'?'basubijwe':'answered'}
          </div>
        </div>
      </div>

      {/* ── QUESTION AREA ── */}
      <div style={styles.body}>
        <div style={styles.questionCard}>
          {/* Question number & text */}
          <div style={styles.qHeader}>
            <span style={styles.qNumber}>
              {lang==='rw' ? 'Ikibazo' : 'Question'} {current + 1} / {questions.length}
            </span>
          </div>
          <p style={styles.qText}>{questionText}</p>

          {/* Options */}
          <div style={styles.optionsWrap}>
            {options.map(opt => (
              <div
                key={opt}
                className={`option-row ${answers[q.id] === opt ? 'selected' : ''}`}
                onClick={() => selectAnswer(q.id, opt)}
              >
                <div className="option-letter">{opt}</div>
                <span style={styles.optionText}>{optionText(opt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM BUTTONS ── */}
      <div style={styles.bottomBar}>
        <button
          className="btn-orange"
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          style={{minWidth:160}}
        >
          {lang==='rw' ? 'SOZA IKIZAMINI' : 'FINISH EXAM'}
        </button>

        <div style={styles.navBtns}>
          <button
            className="btn-orange"
            onClick={() => setCurrent(c => Math.max(0, c-1))}
            disabled={current === 0}
          >
            {lang==='rw' ? '◀ Icyabanje / Previous' : '◀ Previous'}
          </button>
          <button
            className="btn-orange"
            onClick={() => setCurrent(c => Math.min(questions.length-1, c+1))}
            disabled={current === questions.length - 1}
          >
            {lang==='rw' ? 'Igikurikira / Next ▶' : 'Next ▶'}
          </button>
        </div>
      </div>

      {/* ── CONFIRM MODAL ── */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>
              {lang==='rw' ? '⚠️ Soza ikizamini?' : '⚠️ Finish Exam?'}
            </h3>
            {unansweredCount > 0 ? (
              <p style={{color:'#dc2626', fontWeight:600}}>
                {lang==='rw'
                  ? `Hari ibibazo ${unansweredCount} utarasubije! Urashaka gusoza?`
                  : `You have ${unansweredCount} unanswered question(s)! Are you sure?`}
              </p>
            ) : (
              <p>
                {lang==='rw'
                  ? 'Wasubije ibibazo byose. Urashaka gusoza ikizamini?'
                  : 'You answered all questions. Ready to submit?'}
              </p>
            )}
            <div style={{fontSize:13, color:'#64748b', marginBottom:20}}>
              {lang==='rw' ? 'Amanota yo gutsindiraho: 12/20' : 'Pass mark: 12/20'}
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={()=>setShowConfirm(false)}>
                {lang==='rw' ? 'Subira inyuma' : 'Go Back'}
              </button>
              <button
                className="btn-blue"
                onClick={() => { setShowConfirm(false); handleSubmit(); }}
                disabled={submitting}
              >
                {submitting ? '...' : (lang==='rw' ? 'Soza Ikizamini' : 'Submit Exam')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingScreen({ lang }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background: 'linear-gradient(135deg, #0a1628, #1a3a6b)'
    }}>
      <div style={{fontSize:48, marginBottom:20}}>🦅</div>
      <div style={{color:'white', fontSize:18, fontWeight:700}}>
        {lang==='rw' ? 'Gutegura ibibazo...' : 'Loading questions...'}
      </div>
      <div style={{color:'rgba(255,255,255,0.6)', marginTop:8, fontSize:13}}>
        HAVANA SHELF DEPARTMENT
      </div>
    </div>
  );
}

function ErrorScreen({ msg, lang }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', background:'#f0f4f8', padding:20
    }}>
      <div style={{fontSize:48, marginBottom:16}}>⚠️</div>
      <p style={{color:'#dc2626', fontSize:16, fontWeight:600, marginBottom:16}}>{msg}</p>
      <a href="/dashboard" style={{color:'#2563eb'}}>
        {lang==='rw' ? '← Garuka ku dashboard' : '← Back to Dashboard'}
      </a>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f0f4f8',
  },
  topBar: {
    background: 'white',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    gap: 12,
    flexWrap: 'wrap',
  },
  topLeft: {
    display: 'flex', alignItems: 'center', gap: 8,
    minWidth: 120,
  },
  rnpIcon: { fontSize: 22 },
  rnpLabel: { fontSize: 12, fontWeight: 700, color: '#0a1628' },
  bubblesWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    alignItems: 'center',
  },
  bubblesRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  progress: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  body: {
    flex: 1,
    padding: '20px 16px',
    maxWidth: 800,
    width: '100%',
    margin: '0 auto',
  },
  questionCard: {
    background: 'white',
    borderRadius: 12,
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },
  qHeader: { marginBottom: 6 },
  qNumber: {
    fontSize: 12,
    fontWeight: 700,
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  qText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1e293b',
    lineHeight: 1.6,
    marginBottom: 20,
    marginTop: 8,
  },
  optionsWrap: {},
  optionText: { fontSize: 14, color: '#374151', lineHeight: 1.5 },
  bottomBar: {
    background: 'white',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
    gap: 12,
    flexWrap: 'wrap',
  },
  navBtns: { display: 'flex', gap: 10 },
};
