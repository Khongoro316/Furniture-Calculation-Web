'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
setAuth(res.data.user, res.data.token);

const role = res.data.user.role;
if (role === 'customer') {
  router.push('/');
} else {
  router.push('/dashboard');
}
    } catch (err: any) {
      setError(err.response?.data?.message || 'Имэйл эсвэл нууц үг буруу байна');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif}
        .login-root{min-height:100vh;background:linear-gradient(135deg,#f8f7ff 0%,#f0f4ff 50%,#faf5ff 100%);display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden}
        .orb1{position:fixed;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(217,119,6,0.15),transparent 70%);top:-150px;right:-100px;pointer-events:none}
        .orb2{position:fixed;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(118,75,162,0.1),transparent 70%);bottom:-100px;left:-80px;pointer-events:none}
        .card{background:white;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.1),0 0 0 1px rgba(0,0,0,0.04);padding:40px;width:100%;max-width:420px;position:relative;z-index:1}
        .brand{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:28px;cursor:pointer}
        .brand-logo{width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:22px}
        .brand-name{font-size:20px;font-weight:800;color:#1c1917;letter-spacing:-0.02em}
        .card-title{font-size:22px;font-weight:800;color:#1c1917;text-align:center;margin-bottom:6px;letter-spacing:-0.02em}
        .card-sub{font-size:13px;color:#9ca3af;text-align:center;margin-bottom:28px}
        .field{margin-bottom:16px}
        .field-label{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
        .label-text{font-size:13px;font-weight:600;color:#374151}
        .inp-wrap{position:relative;display:flex;align-items:center}
        .inp{width:100%;border:1.5px solid #e5e7eb;border-radius:11px;padding:11px 44px 11px 14px;font-size:14px;color:#1c1917;outline:none;font-family:inherit;transition:all 0.2s;background:white}
        .inp:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .inp.err{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,0.1)}
        .inp-icon{position:absolute;right:12px;cursor:pointer;font-size:16px;color:#9ca3af;user-select:none;transition:color 0.15s}
        .inp-icon:hover{color:#d97706}
        .err-box{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:13px;border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .login-btn{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 6px 20px rgba(217,119,6,0.35);margin-bottom:14px;letter-spacing:-0.01em}
        .login-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 28px rgba(217,119,6,0.45)}
        .login-btn:disabled{opacity:0.6;cursor:not-allowed}
        .row-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
        .outline-btn{background:white;color:#374151;border:1.5px solid #e5e7eb;border-radius:11px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;text-align:center}
        .outline-btn:hover{border-color:#d97706;color:#d97706;background:#f8f7ff}
        .divider{display:flex;align-items:center;gap:12px;margin-bottom:18px}
        .div-line{flex:1;height:1px;background:#f3f4f6}
        .div-text{font-size:12px;color:#d1d5db;font-weight:500}
        .guest-btn{width:100%;background:#f9fafb;color:#6b7280;border:1.5px solid #f3f4f6;border-radius:11px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .guest-btn:hover{background:#f3f4f6;color:#374151}
        .footer-note{text-align:center;font-size:12px;color:#d1d5db;margin-top:20px}
      `}</style>

      <div className="login-root">
        <div className="orb1" />
        <div className="orb2" />

        <div className="card">
          {/* Brand */}
          <div className="brand" onClick={() => router.push('/')}>
            <div className="brand-logo">🪑</div>
            <div className="brand-name">FurniCalc</div>
          </div>

          <h1 className="card-title">Системд нэвтрэх</h1>
          <p className="card-sub">Тавилгын материалын тооцооны систем</p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="field">
              <div className="field-label">
                <span className="label-text">Имэйл хаяг</span>
              </div>
              <div className="inp-wrap">
                <input
                  className={`inp ${error ? 'err' : ''}`}
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <div className="field-label">
                <span className="label-text">Нууц үг</span>
              </div>
              <div className="inp-wrap">
                <input
                  className={`inp ${error ? 'err' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <span className="inp-icon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '' : ''}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="err-box">
                <span></span> {error}
              </div>
            )}

            {/* Login button */}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? '⏳ Нэвтэрч байна...' : 'Нэвтрэх →'}
            </button>

            {/* Нууц үг мартсан | Бүртгүүлэх */}
            <div className="row-btns">
              <button
                type="button"
                className="outline-btn"
                onClick={() => router.push('/auth/forgot-password')}
              >
                Нууц үг мартсан
              </button>
              <button
                type="button"
                className="outline-btn"
                onClick={() => router.push('/auth/register')}
              >
                Бүртгүүлэх
              </button>
            </div>
          </form>

          <div className="divider">
            <div className="div-line" />
            <span className="div-text">эсвэл</span>
            <div className="div-line" />
          </div>

          <button className="guest-btn" onClick={() => router.push('/')}>
            👀 Зочин горимоор үзэх
          </button>

          <div className="footer-note">
            Нэвтэрснээр үйлчилгээний нөхцлийг зөвшөөрч байна
          </div>
        </div>
      </div>
    </>
  );
}