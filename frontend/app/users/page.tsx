'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Супер Админ', admin: 'Админ', accountant: 'Нягтлан',
  order_processor: 'Захиалга боловсруулагч', worker: 'Ажилтан',
  customer: 'Хэрэглэгч', guest: 'Зочин',
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: '#fef3c7', color: '#92400e' },
  admin:       { bg: '#fef3c7', color: '#1e40af' },
  accountant:  { bg: '#e0f2fe', color: '#075985' },
  order_processor: { bg: '#fef9c3', color: '#92400e' },
  worker:      { bg: '#dcfce7', color: '#166534' },
  customer:    { bg: '#fce7f3', color: '#9d174d' },
  guest:       { bg: '#f1f5f9', color: '#475569' },
};

export default function UsersPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [emailSent, setEmailSent] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'customer', phone: '' });

  useEffect(() => {
    const u = localStorage.getItem('user'); const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t); else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['admin','super_admin'].includes(user.role)) { router.push('/dashboard'); return; }
    loadUsers();
  }, [mounted, user]);

  const loadUsers = async () => {
    const res = await api.get('/api/auth/users').catch(() => ({ data: [] }));
    setUsers(res.data);
  };

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) return;
    setLoading(true);
    try {
      await api.post('/api/auth/register', form);
      setEmailSent(`${form.last_name} ${form.first_name} амжилттай бүртгэгдлээ.`);
      loadUsers();
    } catch (err: any) { alert(err.response?.data?.message || 'Алдаа гарлаа'); }
    finally { setLoading(false); }
  };

  const toggleActive = async (id: number, is_active: boolean) => {
    await api.put(`/api/auth/users/${id}`, { is_active: !is_active });
    loadUsers();
  };

  const filtered = users.filter(u => !filterRole || u.role === filterRole);

  if (!mounted || !user) return null;

  const allowedRoles = user.role === 'super_admin'
    ? Object.keys(ROLE_LABELS)
    : ['admin','accountant','order_processor','worker','customer'];

  return (
    <AppLayout title="Хэрэглэгч удирдах"
      action={<button onClick={() => { setShowForm(true); setEmailSent(''); }} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Бүртгэх</button>}>
      <style>{`
        .filters{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
        .filter-btn{font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:0.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s}
        .filter-btn.active{background:#d97706;color:white;border-color:#d97706}
        .tbl{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .th{display:grid;grid-template-columns:1fr 160px 120px 100px 80px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:8px}
        .tr{display:grid;grid-template-columns:1fr 160px 120px 100px 80px;padding:12px 16px;border-bottom:0.5px solid #f1f5f9;align-items:center;gap:8px;transition:background 0.1s}
        .tr:last-child{border-bottom:none} .tr:hover{background:#fafafa}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-height:92vh;overflow-y:auto}
        .field{margin-bottom:12px}
        .fl{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
        .fi{width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;color:#0f172a;background:white}
        .modal-btns{display:flex;gap:10px;margin-top:16px}
        .bp{flex:1;background:#d97706;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .bs{flex:1;background:white;color:#374151;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .toggle{font-size:11px;font-weight:600;padding:4px 10px;border-radius:7px;border:0.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit}
        @media(max-width:700px){.th,.tr{grid-template-columns:1fr 100px 80px}.hide-sm{display:none}}
      `}</style>

      {/* Role filters */}
      <div className="filters">
        <button className={`filter-btn ${!filterRole ? 'active' : ''}`} onClick={() => setFilterRole('')}>
          Бүгд ({users.length})
        </button>
        {Object.entries(ROLE_LABELS).filter(([r]) => allowedRoles.includes(r)).map(([r, l]) => (
          <button key={r} className={`filter-btn ${filterRole === r ? 'active' : ''}`} onClick={() => setFilterRole(r)}>
            {l} ({users.filter(u => u.role === r).length})
          </button>
        ))}
      </div>

      <div className="tbl">
        <div className="th">
          <div>Хэрэглэгч</div>
          <div className="hide-sm">Имэйл</div>
          <div className="hide-sm">Утас</div>
          <div>Эрх</div>
          <div>Үйлдэл</div>
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Хэрэглэгч байхгүй байна</div>}
        {filtered.map(u => {
          const rc = ROLE_COLORS[u.role] || { bg: '#f1f5f9', color: '#475569' };
          return (
            <div key={u.id} className="tr">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{u.last_name} {u.first_name}</div>
                <div style={{ fontSize: 11, color: u.is_active ? '#059669' : '#ef4444', marginTop: 2 }}>
                  {u.is_active ? '● Идэвхтэй' : '○ Идэвхгүй'}
                </div>
              </div>
              <div className="hide-sm" style={{ fontSize: 12, color: '#374151' }}>{u.email}</div>
              <div className="hide-sm" style={{ fontSize: 12, color: '#374151' }}>{u.phone || '—'}</div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: rc.bg, color: rc.color }}>
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
              <div>
                <button className="toggle" onClick={() => toggleActive(u.id, u.is_active)}>
                  {u.is_active ? 'Зогсоох' : 'Идэвхжүүлэх'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {emailSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Амжилттай бүртгэгдлээ!</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{emailSent}</div>
                <button className="bp" style={{ width: '100%' }} onClick={() => setShowForm(false)}>Хаах</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Шинэ хэрэглэгч бүртгэх</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field">
                    <label className="fl">Овог *</label>
                    <input className="fi" placeholder="Батмөнх" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="fl">Нэр *</label>
                    <input className="fi" placeholder="Хонгорзул" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                  </div>
                </div>
                <div className="field">
                  <label className="fl">Имэйл *</label>
                  <input className="fi" type="email" placeholder="user@example.mn" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="fl">Утас</label>
                  <input className="fi" placeholder="99001122" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field">
                    <label className="fl">Эрх *</label>
                    <select className="fi" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                      {allowedRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="fl">Нууц үг *</label>
                    <input className="fi" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-btns">
                  <button className="bp" onClick={handleCreate} disabled={loading}>{loading ? 'Хадгалж байна...' : 'Бүртгэх'}</button>
                  <button className="bs" onClick={() => setShowForm(false)}>Болих</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
