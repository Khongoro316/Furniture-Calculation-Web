'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ last_name:'', first_name:'', email:'', phone:'', password:'', confirm:'' });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const handleRegister = async () => {
    if (!form.last_name || !form.first_name || !form.email || !form.password) {
      setError('Бүх талбарыг бөглөнө үү'); return;
    }
    if (form.password.length < 6) { setError('Нууц үг хамгийн багадаа 6 тэмдэгт байна'); return; }
    if (form.password !== form.confirm) { setError('Нууц үг таарахгүй байна'); return; }
    if (!agreed) { setError('Үйлчилгээний нөхцлийг зөвшөөрнө үү'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/register', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setDone(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  const strength = form.password.length < 6 ? 1 : form.password.length < 8 ? 2 : form.password.length < 12 ? 3 : 4;
  const strengthColor = ['','#ef4444','#f59e0b','#10b981','#d97706'][strength];
  const strengthLabel = ['','Хэт богино','Дунд зэрэг','Хүчтэй','🔒 Маш хүчтэй'][strength];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif}
        .root{min-height:100vh;background:linear-gradient(135deg,#f8f7ff,#f0f4ff,#faf5ff);display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden}
        .orb{position:fixed;border-radius:50%;pointer-events:none}
        .card{background:white;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.1),0 0 0 1px rgba(0,0,0,0.04);padding:40px;width:100%;max-width:460px;position:relative;z-index:1}
        .back-btn{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#6b7280;cursor:pointer;border:none;background:none;font-family:inherit;margin-bottom:20px;padding:0;transition:color 0.15s}
        .back-btn:hover{color:#1c1917}
        .brand{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:20px}
        .b-logo{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:20px}
        .b-name{font-size:18px;font-weight:800;color:#1c1917;letter-spacing:-0.02em}
        .title{font-size:20px;font-weight:800;color:#1c1917;text-align:center;margin-bottom:4px;letter-spacing:-0.02em}
        .sub{font-size:13px;color:#9ca3af;text-align:center;margin-bottom:22px}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .field{margin-bottom:12px}
        .fl{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:flex;align-items:center;gap:4px}
        .req{color:#ef4444;font-size:12px}
        .inp-wrap{position:relative;display:flex;align-items:center}
        .inp{width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 40px 10px 13px;font-size:13px;color:#1c1917;outline:none;font-family:inherit;transition:all 0.2s;background:white}
        .inp:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .inp.err{border-color:#ef4444}
        .inp-ic{position:absolute;right:11px;font-size:15px;color:#9ca3af;cursor:pointer;user-select:none}
        .inp-ic:hover{color:#d97706}
        .err-box{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:13px;border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:6px}
        .pass-bar{height:3px;border-radius:2px;margin-top:5px;background:#e5e7eb;overflow:hidden}
        .pb-fill{height:100%;border-radius:2px;transition:all 0.3s}
        .pb-label{font-size:11px;margin-top:3px}
        .agree-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:16px;cursor:pointer}
        .agree-box{width:18px;height:18px;border-radius:5px;border:1.5px solid #e5e7eb;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all 0.2s;background:white}
        .agree-box.on{background:#d97706;border-color:#d97706;color:white}
        .agree-text{font-size:12px;color:#6b7280;line-height:1.6}
        .agree-link{color:#d97706;font-weight:600;cursor:pointer}
        .primary-btn{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 6px 20px rgba(217,119,6,0.3);margin-bottom:10px}
        .primary-btn:hover:not(:disabled){transform:translateY(-1px)}
        .primary-btn:disabled{opacity:0.5;cursor:not-allowed}
        .login-row{text-align:center;font-size:13px;color:#9ca3af}
        .login-link{color:#d97706;font-weight:700;cursor:pointer;border:none;background:none;font-family:inherit;font-size:13px}
        .login-link:hover{text-decoration:underline}
        .success-wrap{text-align:center;padding:16px 0}
        .s-icon{font-size:56px;margin-bottom:14px}
        .s-title{font-size:20px;font-weight:800;color:#1c1917;margin-bottom:8px}
        .s-sub{font-size:13px;color:#9ca3af;margin-bottom:24px;line-height:1.6}
        .s-email{font-weight:700;color:#d97706}
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

          {done ? (
            <div className="success-wrap">
              <div className="s-icon">🎉</div>
              <div className="s-title">Бүртгэл амжилттай!</div>
              <p className="s-sub">
                <span className="s-email">{form.email}</span> хаяг руу<br />
                баталгаажуулах мэдээлэл илгээгдлээ.<br />
                Одоо нэвтрэн системийг ашиглана уу.
              </p>
              <button className="primary-btn" onClick={() => router.push('/auth/login')}>
                Нэвтрэх →
              </button>
            </div>
          ) : (
            <>
              <div className="title">Шинэ бүртгэл үүсгэх</div>
              <p className="sub">Тавилгын тооцооны системд бүртгүүлнэ үү</p>

              {error && <div className="err-box">⚠️ {error}</div>}

              <div className="grid-2">
                <div className="field">
                  <div className="fl">Овог <span className="req">*</span></div>
                  <div className="inp-wrap">
                    <input className="inp" placeholder="Батмөнх" value={form.last_name} onChange={set('last_name')} />
                  </div>
                </div>
                <div className="field">
                  <div className="fl">Нэр <span className="req">*</span></div>
                  <div className="inp-wrap">
                    <input className="inp" placeholder="Хонгорзул" value={form.first_name} onChange={set('first_name')} />
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="fl">Имэйл хаяг <span className="req">*</span></div>
                <div className="inp-wrap">
                  <input className="inp" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} />
                  <span className="inp-ic" style={{ cursor:'default' }}>✉️</span>
                </div>
              </div>

              <div className="field">
                <div className="fl">Утасны дугаар</div>
                <div className="inp-wrap">
                  <input className="inp" placeholder="99001122" value={form.phone} onChange={set('phone')} />
                  <span className="inp-ic" style={{ cursor:'default' }}>📱</span>
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <div className="fl">Нууц үг <span className="req">*</span></div>
                  <div className="inp-wrap">
                    <input className="inp" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                      value={form.password} onChange={set('password')} />
                    <span className="inp-ic" onClick={() => setShowPass(!showPass)}>{showPass ? '🙈' : '👁️'}</span>
                  </div>
                  {form.password && (
                    <>
                      <div className="pass-bar">
                        <div className="pb-fill" style={{ width:`${strength*25}%`, background:strengthColor }} />
                      </div>
                      <div className="pb-label" style={{ color:strengthColor }}>{strengthLabel}</div>
                    </>
                  )}
                </div>
                <div className="field">
                  <div className="fl">Давтах <span className="req">*</span></div>
                  <div className="inp-wrap">
                    <input className={`inp ${form.confirm && form.confirm !== form.password ? 'err' : ''}`}
                      type={showPass ? 'text' : 'password'} placeholder="••••••••"
                      value={form.confirm} onChange={set('confirm')} />
                    <span className="inp-ic" style={{ cursor:'default' }}>
                      {form.confirm ? (form.confirm === form.password ? '✅' : '❌') : '🔒'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="agree-row" onClick={() => setAgreed(!agreed)}>
                <div className={`agree-box ${agreed ? 'on' : ''}`}>{agreed ? '✓' : ''}</div>
                <div className="agree-text">
                  <span className="agree-link">Үйлчилгээний нөхцөл</span> болон{' '}
                  <span className="agree-link">Нууцлалын бодлого</span>-г уншиж зөвшөөрч байна
                </div>
              </div>

              <button className="primary-btn" onClick={handleRegister}
                disabled={loading || !form.last_name || !form.first_name || !form.email || !form.password || form.password !== form.confirm || !agreed}>
                {loading ? '⏳ Бүртгэж байна...' : '✍️ Бүртгүүлэх →'}
              </button>

              <div className="login-row">
                Бүртгэлтэй юу?{' '}
                <button className="login-link" onClick={() => router.push('/auth/login')}>Нэвтрэх</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}