import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '../App';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const [showReview, setShowReview] = useState(false);

  const result = location.state?.result;
  if (!result) {
    navigate('/dashboard');
    return null;
  }

  const { score, total, passed, results } = result;
  const percent = Math.round((score / total) * 100);

  const t = {
    rw: {
      title: passed ? '🎉 Wtsinzwe!' : '😔 Watsinzwe',
      sub: passed
        ? 'Wasubije neza ikizamini cya provisonal!'
        : 'Wagize amanota make. Gerageza nanone.',
      score: 'Amanota yawe',
      outOf: 'kuri',
      percent: 'Umusaruro',
      passmark: 'Ngo utsinde ugomba: 12/20',
      review: '📋 Reba ibisubizo',
      hideReview: '🔼 Hisha ibisubizo',
      tryAgain: '🔄 Gerageza nanone',
      dashboard: '🏠 Ongera Wige',
      correct: '✓ Ibisubizo by\'ukuri',
      wrong: '✗ Ibisubizo by\'ikosa',
      yourAnswer: 'Wasubije:',
      correctAnswer: 'Igisubizo cy\'ukuri:',
      noAnswer: 'Ntagasubizo',
      question: 'Ikibazo',
    },
    en: {
      title: passed ? '🎉 You Passed!' : '😔 Not Passed',
      sub: passed
        ? 'Congratulations! You passed the provisional licence exam!'
        : 'You did not reach the pass mark. Please try again.',
      score: 'Your Score',
      outOf: 'out of',
      percent: 'Percentage',
      passmark: 'Pass mark required: 12/20',
      review: '📋 Review Answers',
      hideReview: '🔼 Hide Review',
      tryAgain: '🔄 Try Again',
      dashboard: '🏠 Back to Dashboard',
      correct: '✓ Correct answers',
      wrong: '✗ Wrong answers',
      yourAnswer: 'Your answer:',
      correctAnswer: 'Correct answer:',
      noAnswer: 'No answer',
      question: 'Question',
    }
  };
  const tx = t[lang];

  const optionText = (q, opt) => {
    if (!opt) return tx.noAnswer;
    const key = lang === 'en' ? `option_${opt}_en` : `option_${opt}_rw`;
    return q[key] || q[`option_${opt}_rw`] || opt.toUpperCase();
  };

  return (
    <div style={styles.page}>
      {/* Nav */}
      <div style={styles.nav}>
        <div style={styles.navLeft}>
          <span style={{fontSize:22}}>🦅</span>
          <span style={{color:'white', fontWeight:700, fontSize:16}}>HAVANA SHELF DEPARTMENT</span>
        </div>
        <div className="lang-toggle">
          <button className={`lang-btn ${lang==='rw'?'active':''}`} onClick={()=>setLang('rw')}>RW</button>
          <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={()=>setLang('en')}>EN</button>
        </div>
      </div>

      <div style={styles.container}>
        {/* Score Card */}
        <div style={{
          ...styles.scoreCard,
          borderTop: `6px solid ${passed ? '#22c55e' : '#dc2626'}`
        }}>
          <div style={styles.resultIcon}>{passed ? '🏆' : '📚'}</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800,
            color: passed ? '#16a34a' : '#dc2626',
            marginBottom: 8
          }}>{tx.title}</h1>
          <p style={styles.subText}>{tx.sub}</p>

          {/* Big score */}
          <div style={styles.scoreBig}>
            <div style={{
              ...styles.scoreCircle,
              borderColor: passed ? '#22c55e' : '#dc2626',
              color: passed ? '#16a34a' : '#dc2626',
            }}>
              <span style={styles.scoreNum}>{score}</span>
              <span style={styles.scoreTotal}>/{total}</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={styles.statsRow}>
            <StatBox
              label={tx.score}
              value={`${score}/${total}`}
              color={passed ? '#16a34a' : '#dc2626'}
            />
            <StatBox
              label={tx.percent}
              value={`${percent}%`}
              color={passed ? '#16a34a' : '#dc2626'}
            />
            <StatBox
              label={tx.correct}
              value={score}
              color="#16a34a"
            />
            <StatBox
              label={tx.wrong}
              value={total - score}
              color="#dc2626"
            />
          </div>

          <p style={styles.passmark}>{tx.passmark}</p>

          {/* Progress bar */}
          <div style={styles.barBg}>
            <div style={{
              ...styles.barFill,
              width: `${percent}%`,
              background: passed ? '#22c55e' : '#dc2626',
            }} />
            <div style={{...styles.barMark, left:'60%'}} />
          </div>
          <div style={styles.barLabels}>
            <span>0%</span>
            <span style={{position:'absolute', left:'60%', transform:'translateX(-50%)', color:'#94a3b8', fontSize:11}}>60% (pass)</span>
            <span>100%</span>
          </div>

          {/* Action buttons */}
          <div style={styles.actions}>
            <button className="btn-orange" onClick={() => navigate('/exam')}>
              {tx.tryAgain}
            </button>
            <button className="btn-blue" onClick={() => navigate('/dashboard')}>
              {tx.dashboard}
            </button>
          </div>
        </div>

        {/* Review toggle */}
        <div style={{textAlign:'center', marginBottom:16}}>
          <button
            className="btn-outline"
            onClick={() => setShowReview(v => !v)}
          >
            {showReview ? tx.hideReview : tx.review}
          </button>
        </div>

        {/* Review section */}
        {showReview && (
          <div style={styles.reviewWrap}>
            {results.map((q, i) => {
              const qText = lang === 'en' ? (q.question_en || q.question_rw) : q.question_rw;
              return (
                <div
                  key={q.id}
                  style={{
                    ...styles.reviewCard,
                    borderLeft: `4px solid ${q.is_correct ? '#22c55e' : '#dc2626'}`
                  }}
                >
                  <div style={styles.reviewHeader}>
                    <span style={styles.reviewNum}>
                      {tx.question} {i + 1}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: q.is_correct ? '#16a34a' : '#dc2626'
                    }}>
                      {q.is_correct ? '✓' : '✗'}
                    </span>
                  </div>
                  <p style={styles.reviewQ}>{qText}</p>

                  {/* Options */}
                  {['a','b','c','d'].map(opt => {
                    const text = optionText(q, opt);
                    const isCorrect = opt === q.correct_answer;
                    const isSelected = opt === q.selected_answer;
                    let cls = 'option-row';
                    if (isCorrect && isSelected) cls += ' correct';
                    else if (isSelected && !isCorrect) cls += ' wrong';
                    else if (isCorrect) cls += ' missed';

                    return (
                      <div key={opt} className={cls} style={{cursor:'default'}}>
                        <div className="option-letter">{opt}</div>
                        <span style={{fontSize:13}}>{text}</span>
                        {isCorrect && <span style={{marginLeft:'auto', color:'#16a34a', fontSize:12, fontWeight:700}}>✓</span>}
                        {isSelected && !isCorrect && <span style={{marginLeft:'auto', color:'#dc2626', fontSize:12, fontWeight:700}}>✗</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: '#f8fafc', borderRadius: 10, padding: '12px 16px',
      textAlign: 'center', minWidth: 80,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  nav: {
    background: 'linear-gradient(90deg, #0a1628, #1a3a6b)',
    padding: '12px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  container: { maxWidth: 760, margin: '0 auto', padding: '24px 16px' },
  scoreCard: {
    background: 'white', borderRadius: 16, padding: '32px 28px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: 20, textAlign: 'center',
  },
  resultIcon: { fontSize: 56, marginBottom: 12 },
  subText: { color: '#64748b', fontSize: 14, marginBottom: 24 },
  scoreBig: { margin: '8px auto 24px', display: 'flex', justifyContent: 'center' },
  scoreCircle: {
    width: 110, height: 110, borderRadius: '50%',
    border: '6px solid', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row',
  },
  scoreNum: { fontSize: 38, fontWeight: 900 },
  scoreTotal: { fontSize: 18, fontWeight: 600, marginTop: 10, opacity: 0.6 },
  statsRow: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 },
  passmark: { fontSize: 12, color: '#94a3b8', marginBottom: 16 },
  barBg: {
    height: 12, background: '#e2e8f0', borderRadius: 6,
    margin: '0 auto 4px', maxWidth: 400, position: 'relative',
  },
  barFill: { height: '100%', borderRadius: 6, transition: 'width 0.5s ease' },
  barMark: {
    position: 'absolute', top: -3, width: 2, height: 18,
    background: '#64748b',
  },
  barLabels: {
    display: 'flex', justifyContent: 'space-between',
    maxWidth: 400, margin: '0 auto 20px', fontSize: 11,
    color: '#94a3b8', position: 'relative',
  },
  actions: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 },
  reviewWrap: {},
  reviewCard: {
    background: 'white', borderRadius: 10, padding: '16px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 14,
  },
  reviewHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  reviewNum: { fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' },
  reviewQ: { fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 12, lineHeight: 1.5 },
};
