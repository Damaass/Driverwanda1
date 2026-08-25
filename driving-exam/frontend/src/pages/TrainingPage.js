import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../App';

export default function TrainingPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const token = localStorage.getItem('rnp_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/exam/training', { headers })
      .then(r => { setQuestions(r.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Failed to load questions'); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f0f4f8' }}>
      <div style={{fontSize:48, marginBottom:20}}>🦅</div>
      <div style={{color:'#1e293b', fontSize:18, fontWeight:700}}>{lang==='rw'?'Gutegura ibibazo...':'Loading questions...'}</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f0f4f8', padding:20 }}>
      <div style={{fontSize:48, marginBottom:16}}>⚠️</div>
      <p style={{color:'#dc2626', fontSize:16, fontWeight:600, marginBottom:16}}>{error}</p>
      <a href="/dashboard" style={{color:'#2563eb'}}>{lang==='rw' ? '← Garuka ku dashboard' : '← Back to Dashboard'}</a>
    </div>
  );

  const options = ['a', 'b', 'c', 'd'];
  const optionText = (q, opt) => {
    if (lang === 'en') return q[`option_${opt}_en`] || q[`option_${opt}_rw`];
    return q[`option_${opt}_rw`];
  };
  const questionText = (q) => lang === 'en' ? (q.question_en || q.question_rw) : q.question_rw;

  return (
    <div>
      <div style={{ background:'white', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:120 }}>
          <span style={{fontSize:22}}>🦅</span>
          <span style={{ fontSize:12, fontWeight:700, color:'#0a1628' }}>HSP - {lang==='rw'?'AMATEGEKO YUMUHANDA':'Training'}</span>
        </div>
        <div style={{ fontSize:13, color:'#64748b' }}>
          {questions.length} {lang==='rw'?'bibazo':'questions'}
        </div>
      </div>

      <div style={{ flex:1, padding:'20px 16px', maxWidth:900, width:'100%', margin:'0 auto', maxHeight:'calc(100vh - 140px)', overflowY:'auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {questions.map((q, idx) => {
            const actualIndex = idx + 1;
            return (
              <div key={q.id} style={{ background:'white', borderRadius:12, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
                <div style={{ marginBottom:8 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                    {lang==='rw' ? 'Ikibazo' : 'Question'} {actualIndex}
                  </span>
                </div>
                <p style={{ fontSize:16, fontWeight:600, color:'#1e293b', lineHeight:1.6, marginBottom:16, marginTop:4 }}>{questionText(q)}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {options.map(opt => {
                    const correct = q.correct_answer === opt;
                    return (
                      <div key={opt} style={{
                        padding:'12px 16px',
                        borderRadius:8,
                        background: correct ? '#dcfce7' : '#f9fafb',
                        border: correct ? '2px solid #16a34a' : '1px solid #e5e7eb',
                        display:'flex',
                        alignItems:'flex-start',
                        gap:12
                      }}>
                        <div style={{
                          minWidth:24,
                          height:24,
                          borderRadius:'50%',
                          background: correct ? '#16a34a' : '#d1d5db',
                          color:'white',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          fontSize:12,
                          fontWeight:700
                        }}>
                          {opt}
                        </div>
                        <span style={{ fontSize:14, color:'#374151', lineHeight:1.5, flex:1 }}>{optionText(q, opt)}</span>
                        {correct && <span style={{ fontSize:14, color:'#16a34a', fontWeight:700, marginLeft:8 }}>✓ {lang==='rw'?'Ibisubizo':'Correct'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background:'white', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'flex-end', boxShadow:'0 -2px 8px rgba(0,0,0,0.06)', gap:12, flexWrap:'wrap' }}>
        <button className="btn-orange" onClick={()=>navigate('/dashboard')}>
          {lang==='rw'?'Garuka kuri dashboard':'Back to Dashboard'}
        </button>
      </div>
    </div>
  );
}