'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface Service {
  id: number;
  name: string;
  unit: string;
  price: number;
  description: string;
  is_active: boolean;
  service_types: { name: string };
}

interface ServiceType { id: number; name: string; }

export default function ServicesPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ service_type_id: '', name: '', unit: 'м', price: '', description: '' });

  useEffect(() => {
    const u = localStorage.getItem('user'); const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t); else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['accountant','admin','super_admin'].includes(user.role)) { router.push('/dashboard'); return; }
    loadData();
  }, [mounted, user]);

  const loadData = async () => {
    const [s, t] = await Promise.all([
      api.get('/api/services').catch(() => ({ data: [] })),
      api.get('/api/services/types').catch(() => ({ data: [] })),
    ]);
    setServices(s.data); setTypes(t.data);
  };

  const handleCreate = async () => {
    if (!form.name || !form.service_type_id) return;
    setLoading(true);
    try {
      await api.post('/api/services', { ...form, org_id: 1, service_type_id: Number(form.service_type_id), price: Number(form.price) });
      setShowForm(false);
      setForm({ service_type_id: '', name: '', unit: 'м', price: '', description: '' });
      loadData();
    } catch (err: any) { alert(err.response?.data?.message || 'Алдаа гарлаа'); }
    finally { setLoading(false); }
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout title="Үйлчилгээ удирдах"
      action={<button onClick={() => setShowForm(true)} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Нэмэх</button>}>
      <style>{`
        .tbl{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .th{display:grid;grid-template-columns:1fr 140px 80px 100px 80px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:8px}
        .tr{display:grid;grid-template-columns:1fr 140px 80px 100px 80px;padding:12px 16px;border-bottom:0.5px solid #f1f5f9;align-items:center;gap:8px;transition:background 0.1s}
        .tr:last-child{border-bottom:none} .tr:hover{background:#fafafa}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .field{margin-bottom:12px}
        .fl{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
        .fi{width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;color:#0f172a;background:white}
        .modal-btns{display:flex;gap:10px;margin-top:16px}
        .bp{flex:1;background:#d97706;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .bs{flex:1;background:white;color:#374151;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        @media(max-width:600px){.th,.tr{grid-template-columns:1fr 80px 80px}.hide-sm{display:none}}
      `}</style>

      <div className="tbl">
        <div className="th">
          <div>Нэр</div>
          <div className="hide-sm">Төрөл</div>
          <div>Нэгж</div>
          <div>Үнэ ₮</div>
          <div>Төлөв</div>
        </div>
        {services.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Үйлчилгээ байхгүй байна</div>}
        {services.map(s => (
          <div key={s.id} className="tr">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
              {s.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.description}</div>}
            </div>
            <div className="hide-sm" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600 }}>{s.service_types?.name}</div>
            <div style={{ fontSize: 12, color: '#374151' }}>{s.unit}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{Number(s.price).toLocaleString()}</div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: s.is_active ? '#dcfce7' : '#fee2e2', color: s.is_active ? '#166534' : '#991b1b' }}>
                {s.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Шинэ үйлчилгээ нэмэх</div>
            <div className="field">
              <label className="fl">Үйлчилгээний төрөл *</label>
              <select className="fi" value={form.service_type_id} onChange={e => setForm(p => ({ ...p, service_type_id: e.target.value }))}>
                <option value="">-- Сонгоно уу --</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="fl">Нэр *</label>
              <input className="fi" placeholder="Прямой зүсэлт" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field">
                <label className="fl">Нэгж</label>
                <select className="fi" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                  {['м','м²','ш','цаг','удаа'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="fl">Үнэ ₮ *</label>
                <input className="fi" type="number" placeholder="1500" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label className="fl">Тайлбар</label>
              <input className="fi" placeholder="..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="modal-btns">
              <button className="bp" onClick={handleCreate} disabled={loading}>{loading ? 'Хадгалж байна...' : 'Хадгалах'}</button>
              <button className="bs" onClick={() => setShowForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
