'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';

type Step = 'email' | 'otp' | 'newpass' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setStep('otp');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('6 оронтой код оруулна уу'); return; }
    setStep('newpass'); setError('');
  };

  const resetPass = async () => {
    if (newPass.length < 6) { setError('Нууц үг хамгийн багадаа 6 тэмдэгт байна'); return; }
    if (newPass !== confirm) { setError('Нууц үг таарахгүй байна'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { email, otp, newPassword: newPass });
      setStep('done');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  const STEPS = ['email', 'otp', 'newpass', 'done'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif}
        .root{min-height:100vh;background:linear-gradient(135deg,#f8f7ff,#f0f4ff,#faf5ff);display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden}
        .orb{position:fixed;border-radius:50%;pointer-events:none}
        .card{background:white;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.1),0 0 0 1px rgba(0,0,0,0.04);padding:40px;width:100%;max-width:420px;position:relative;z-index:1}
        .back-btn{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#6b7280;cursor:pointer;border:none;background:none;font-family:inherit;margin-bottom:24px;padding:0;transition:color 0.15s}
        .back-btn:hover{color:#1c1917}
        .brand{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px}
        .b-logo{width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:22px}
        .b-name{font-size:20px;font-weight:800;color:#1c1917;letter-spacing:-0.02em}
        /* Progress */
        .progress{display:flex;align-items:center;gap:0;margin-bottom:28px}
        .p-step{display:flex;flex-direction:column;align-items:center;flex:1}
        .p-circle{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;transition:all 0.3s;border:2px solid transparent}
        .p-circle.done{background:#d97706;color:white;border-color:#d97706}
        .p-circle.active{background:white;color:#d97706;border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.15)}
        .p-circle.todo{background:#f9fafb;color:#d1d5db;border-color:#e5e7eb}
        .p-label{font-size:10px;font-weight:600;margin-top:5px;color:#9ca3af;text-align:center}
        .p-label.active{color:#d97706}
        .p-line{flex:1;height:1.5px;background:#e5e7eb;margin:0 4px;margin-top:-16px;transition:background 0.3s}
        .p-line.done{background:#d97706}
        .title{font-size:20px;font-weight:800;color:#1c1917;text-align:center;margin-bottom:6px;letter-spacing:-0.02em}
        .sub{font-size:13px;color:#9ca3af;text-align:center;margin-bottom:24px;line-height:1.6}
        .sub strong{color:#374151}
        .field{margin-bottom:14px}
        .fl{font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
        .inp-wrap{position:relative;display:flex;align-items:center}
        .inp{width:100%;border:1.5px solid #e5e7eb;border-radius:11px;padding:11px 44px 11px 14px;font-size:14px;color:#1c1917;outline:none;font-family:inherit;transition:all 0.2s;background:white}
        .inp:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .inp.err{border-color:#ef4444}
        .inp-ic{position:absolute;right:12px;font-size:16px;color:#9ca3af;cursor:pointer;user-select:none}
        .inp-ic:hover{color:#d97706}
        /* OTP input */
        .otp-wrap{display:flex;gap:8px;justify-content:center;margin-bottom:8px}
        .otp-inp{width:48px;height:56px;border:1.5px solid #e5e7eb;border-radius:12px;text-align:center;font-size:22px;font-weight:800;color:#1c1917;outline:none;font-family:inherit;transition:all 0.2s;background:white}
        .otp-inp:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .err-box{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:13px;border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:6px}
        .primary-btn{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 6px 20px rgba(217,119,6,0.3);margin-bottom:10px}
        .primary-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 28px rgba(217,119,6,0.4)}
        .primary-btn:disabled{opacity:0.6;cursor:not-allowed}
        .sec-btn{width:100%;background:#f9fafb;color:#6b7280;border:1.5px solid #f3f4f6;border-radius:11px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .sec-btn:hover{background:#f3f4f6;color:#374151}
        .pass-strength{height:4px;border-radius:2px;margin-top:6px;transition:all 0.3s;background:#e5e7eb;overflow:hidden}
        .ps-fill{height:100%;border-radius:2px;transition:all 0.3s}
        .ps-label{font-size:11px;margin-top:4px}
        .success-wrap{text-align:center;padding:8px 0}
        .success-icon{font-size:56px;margin-bottom:16px}
        .success-title{font-size:20px;font-weight:800;color:#1c1917;margin-bottom:8px}
        .success-sub{font-size:13px;color:#9ca3af;margin-bottom:24px;line-height:1.6}
        .hint{font-size:12px;color:#9ca3af;text-align:center;margin-top:8px}
        .resend-btn{font-size:12px;color:#d97706;background:none;border:none;cursor:pointer;font-family:inherit;font-weight:600;padding:0}
        .resend-btn:hover{text-decoration:underline}
      `}</style>

      <div className="root">
        <div className="orb" style={{ width:500, height:500, background:'radial-gradient(circle,rgba(217,119,6,0.15),transparent 70%)', top:-150, right:-100 }} />
        <div className="orb" style={{ width:400, height:400, background:'radial-gradient(circle,rgba(118,75,162,0.1),transparent 70%)', bottom:-100, left:-80 }} />

        <div className="card">
          <button className="back-btn" onClick={() => router.push('/auth/login')}>
            ← Нэвтрэх хуудас руу буцах
          </button>

          <div className="brand">
            <div className="b-logo">🪑</div>
            <div className="b-name">FurniCalc</div>
          </div>

          {/* Progress */}
          {step !== 'done' && (
            <div className="progress">
              {[
                { label: 'Имэйл', idx: 0 },
                { label: 'OTP код', idx: 1 },
                { label: 'Нууц үг', idx: 2 },
              ].map((s, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', flex: i < 2 ? 1 : 'none' }}>
                  <div className="p-step">
                    <div className={`p-circle ${stepIdx > s.idx ? 'done' : stepIdx === s.idx ? 'active' : 'todo'}`}>
                      {stepIdx > s.idx ? '✓' : s.idx + 1}
                    </div>
                    <div className={`p-label ${stepIdx === s.idx ? 'active' : ''}`}>{s.label}</div>
                  </div>
                  {i < 2 && <div className={`p-line ${stepIdx > s.idx ? 'done' : ''}`} />}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="err-box">⚠️ {error}</div>
          )}

          {/* STEP 1: Email */}
          {step === 'email' && (
            <>
              <div className="title">Нууц үг сэргээх</div>
              <p className="sub">Бүртгэлтэй имэйл хаягаа оруулна уу.<br />OTP код илгээгдэнэ.</p>
              <div className="field">
                <label className="fl">Имэйл хаяг</label>
                <div className="inp-wrap">
                  <input className={`inp ${error ? 'err' : ''}`} type="email" placeholder="email@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()} />
                  <span className="inp-ic" style={{ cursor:'default' }}>✉️</span>
                </div>
              </div>
              <button className="primary-btn" onClick={sendOtp} disabled={loading || !email}>
                {loading ? '⏳ Илгээж байна...' : 'OTP код илгээх →'}
              </button>
              <button className="sec-btn" onClick={() => router.push('/auth/login')}>Болих</button>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <>
              <div className="title">OTP код оруулна уу</div>
              <p className="sub"><strong>{email}</strong> хаяг руу<br />6 оронтой код илгээгдлээ.</p>
              <div className="otp-wrap">
                {Array.from({length:6}).map((_, i) => (
                  <input
                    key={i}
                    className="otp-inp"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/,'');
                      const arr = otp.split('');
                      arr[i] = val;
                      setOtp(arr.join('').slice(0,6));
                      if (val && i < 5) {
                        const next = document.getElementById(`otp-${i+1}`);
                        next?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) {
                        const prev = document.getElementById(`otp-${i-1}`);
                        prev?.focus();
                      }
                    }}
                    id={`otp-${i}`}
                  />
                ))}
              </div>
              <p className="hint" style={{ marginBottom:16 }}>
                Код ирээгүй юу?{' '}
                <button className="resend-btn" onClick={sendOtp}>Дахин илгээх</button>
              </p>
              <button className="primary-btn" onClick={verifyOtp} disabled={otp.length !== 6}>
                Баталгаажуулах →
              </button>
              <button className="sec-btn" onClick={() => setStep('email')}>← Буцах</button>
            </>
          )}

          {/* STEP 3: New password */}
          {step === 'newpass' && (
            <>
              <div className="title">Шинэ нууц үг</div>
              <p className="sub">Аюулгүй нууц үг тохируулна уу</p>

              <div className="field">
                <label className="fl">Шинэ нууц үг</label>
                <div className="inp-wrap">
                  <input className={`inp ${error ? 'err' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Хамгийн багадаа 6 тэмдэгт"
                    value={newPass} onChange={e => setNewPass(e.target.value)} />
                  <span className="inp-ic" onClick={() => setShowPass(!showPass)}>{showPass ? '🙈' : '👁️'}</span>
                </div>
                {/* Strength */}
                {newPass && (
                  <>
                    <div className="pass-strength">
                      <div className="ps-fill" style={{
                        width: newPass.length < 6 ? '25%' : newPass.length < 8 ? '50%' : newPass.length < 12 ? '75%' : '100%',
                        background: newPass.length < 6 ? '#ef4444' : newPass.length < 8 ? '#f59e0b' : newPass.length < 12 ? '#10b981' : '#d97706'
                      }} />
                    </div>
                    <div className="ps-label" style={{ color: newPass.length < 6 ? '#ef4444' : newPass.length < 8 ? '#f59e0b' : '#10b981' }}>
                      {newPass.length < 6 ? 'Хэт богино' : newPass.length < 8 ? 'Дунд зэрэг' : newPass.length < 12 ? 'Хүчтэй' : '🔒 Маш хүчтэй'}
                    </div>
                  </>
                )}
              </div>

              <div className="field">
                <label className="fl">Нууц үг давтах</label>
                <div className="inp-wrap">
                  <input className={`inp ${confirm && confirm !== newPass ? 'err' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Дахин оруулна уу"
                    value={confirm} onChange={e => setConfirm(e.target.value)} />
                  <span className="inp-ic" style={{ cursor:'default' }}>
                    {confirm ? (confirm === newPass ? '✅' : '❌') : '🔒'}
                  </span>
                </div>
              </div>

              <button className="primary-btn" onClick={resetPass}
                disabled={loading || !newPass || newPass !== confirm || newPass.length < 6}>
                {loading ? '⏳ Хадгалж байна...' : '✅ Нууц үг солих'}
              </button>
              <button className="sec-btn" onClick={() => setStep('otp')}>← Буцах</button>
            </>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <div className="success-wrap">
              <div className="success-icon">🎉</div>
              <div className="success-title">Амжилттай!</div>
              <p className="success-sub">Нууц үг амжилттай солигдлоо.<br />Шинэ нууц үгээрээ нэвтэрнэ үү.</p>
              <button className="primary-btn" onClick={() => router.push('/auth/login')}>
                Нэвтрэх →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}