'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface ServiceType { id: number; name: string; description: string; is_active: boolean; services?: { id: number; name: string; unit: string; price: number }[]; }

export default function ServiceTypesPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [selected, setSelected] = useState<ServiceType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user'); const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t); else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role !== 'super_admin') { router.push('/dashboard'); return; }
    loadTypes();
  }, [mounted, user]);

  const loadTypes = async () => {
    const res = await api.get('/api/services/types').catch(() => ({ data: [] }));
    setTypes(res.data);
  };

  const createType = async () => {
    if (!name) return;
    await api.post('/api/service-types', { name, description: desc });
    setName(''); setDesc(''); setShowForm(false); loadTypes();
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout title="Үйлчилгээний төрөл"
      action={<button onClick={() => setShowForm(true)} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Төрөл нэмэх</button>}>
      <style>{`
        .layout{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .panel{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .ph{padding:14px 16px;border-bottom:0.5px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .pt{font-size:13px;font-weight:700;color:#0f172a}
        .item{padding:12px 16px;cursor:pointer;border-bottom:0.5px solid #f1f5f9;transition:background 0.1s;display:flex;align-items:center;justify-content:space-between}
        .item:last-child{border-bottom:none}
        .item:hover{background:#f8fafc}
        .item.active{background:#fef3c7;border-left:3px solid #d97706}
        .svc-row{padding:10px 16px;border-bottom:0.5px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .svc-row:last-child{border-bottom:none}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .field{margin-bottom:12px}
        .fl{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
        .fi{width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;color:#0f172a}
        .modal-btns{display:flex;gap:10px;margin-top:16px}
        .bp{flex:1;background:#d97706;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .bs{flex:1;background:white;color:#374151;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        @media(max-width:640px){.layout{grid-template-columns:1fr}}
      `}</style>

      <div className="layout">
        <div className="panel">
          <div className="ph"><span className="pt">Үйлчилгээний төрлүүд</span><span style={{ fontSize: 11, color: '#94a3b8' }}>{types.length} төрөл</span></div>
          {types.length === 0 && <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Төрөл байхгүй байна</div>}
          {types.map(t => (
            <div key={t.id} className={`item ${selected?.id === t.id ? 'active' : ''}`} onClick={() => setSelected(t)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                {t.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.description}</div>}
              </div>
              <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>{t.services?.length || 0} үйлчилгээ</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="ph">
            <span className="pt">{selected ? `${selected.name} — Үйлчилгээнүүд` : 'Үйлчилгээнүүд'}</span>
          </div>
          {!selected ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Зүүнээс төрөл сонгоно уу</div>
          ) : !selected.services?.length ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Үйлчилгээ байхгүй байна
              <div style={{ fontSize: 12, marginTop: 8 }}>Нягтлан үйлчилгээ бүртгэнэ</div>
            </div>
          ) : (
            selected.services.map(s => (
              <div key={s.id} className="svc-row">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.unit}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>₮{Number(s.price).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Шинэ үйлчилгээний төрөл</div>
            <div className="field"><label className="fl">Нэр *</label><input className="fi" placeholder="Зүсэлт" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="field"><label className="fl">Тайлбар</label><input className="fi" placeholder="..." value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div className="modal-btns">
              <button className="bp" onClick={createType}>Хадгалах</button>
              <button className="bs" onClick={() => setShowForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
