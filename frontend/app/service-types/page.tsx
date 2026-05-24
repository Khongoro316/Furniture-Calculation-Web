'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../components/ui/ToastProvider';

interface ServiceType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  services?: { id: number; name: string; unit: string; price: number; is_active: boolean }[];
}

const initialForm = { name: '', description: '' };

export default function ServiceTypesPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { notify } = useToast();
  const [mounted, setMounted] = useState(false);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [selected, setSelected] = useState<ServiceType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ServiceType | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) setAuth(JSON.parse(storedUser), token);
    else {
      router.push('/auth/login');
      return;
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadTypes();
  }, [mounted, user]);

  const loadTypes = async () => {
    const res = await api.get('/api/services/types').catch(() => ({ data: [] }));
    setTypes(res.data || []);
    if (selected) {
      const updated = (res.data || []).find((item: ServiceType) => item.id === selected.id);
      setSelected(updated || null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEdit = (type: ServiceType) => {
    setEditing(type);
    setForm({ name: type.name, description: type.description || '' });
    setShowForm(true);
  };

  const saveType = async () => {
    if (!form.name.trim()) {
      notify('Төрлийн нэрээ оруулна уу', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        const res = await api.put(`/api/services/types/${editing.id}`, form);
        notify(res.data?.message || 'Үйлчилгээний төрөл шинэчлэгдлээ', 'success');
      } else {
        const res = await api.post('/api/services/types', form);
        notify(res.data?.message || 'Үйлчилгээний төрөл нэмэгдлээ', 'success');
      }
      setShowForm(false);
      setForm(initialForm);
      setEditing(null);
      loadTypes();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Хадгалах үед алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const archiveType = async (type: ServiceType) => {
    if (!confirm(`"${type.name}" төрлийг идэвхгүй болгох уу?`)) return;

    try {
      const res = await api.delete(`/api/services/types/${type.id}`);
      if (selected?.id === type.id) setSelected(null);
      notify(res.data?.message || 'Үйлчилгээний төрөл идэвхгүй боллоо', 'success');
      loadTypes();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Устгах үед алдаа гарлаа', 'error');
    }
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout
      title="Үйлчилгээний төрөл"
      action={
        <button
          onClick={openCreate}
          style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Төрөл нэмэх
        </button>
      }
    >
      <style>{`
        .layout{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .panel{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .ph{padding:14px 16px;border-bottom:0.5px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .pt{font-size:13px;font-weight:700;color:#0f172a}
        .item{padding:12px 16px;border-bottom:0.5px solid #f1f5f9;transition:background 0.1s}
        .item:last-child{border-bottom:none}
        .item:hover{background:#f8fafc}
        .item.active{background:#fef3c7;border-left:3px solid #d97706}
        .row-actions{display:flex;gap:8px;margin-top:10px}
        .action{font-size:11px;font-weight:700;padding:5px 10px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-family:inherit}
        .action.danger{color:#dc2626;border-color:#fecaca;background:#fff7f7}
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
          <div className="ph">
            <span className="pt">Үйлчилгээний төрлүүд</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{types.length} төрөл</span>
          </div>
          {types.length === 0 && <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Төрөл байхгүй байна</div>}
          {types.map((type) => (
            <div
              key={type.id}
              className={`item ${selected?.id === type.id ? 'active' : ''}`}
              onClick={() => setSelected(type)}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{type.name}</div>
              {type.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{type.description}</div>}
              <div className="row-actions">
                <button className="action" onClick={(event) => { event.stopPropagation(); openEdit(type); }}>Засах</button>
                <button className="action danger" onClick={(event) => { event.stopPropagation(); archiveType(type); }}>Идэвхгүй болгох</button>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="ph">
            <span className="pt">{selected ? `${selected.name} үйлчилгээ` : 'Үйлчилгээнүүд'}</span>
          </div>
          {!selected ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Зүүнээс төрөл сонгоно уу</div>
          ) : !(selected.services || []).length ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Үйлчилгээ бүртгэгдээгүй байна</div>
          ) : (
            (selected.services || []).map((service) => (
              <div key={service.id} className="svc-row">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{service.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{service.unit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{Number(service.price).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: service.is_active ? '#166534' : '#991b1b' }}>
                    {service.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              {editing ? 'Төрөл засах' : 'Шинэ үйлчилгээний төрөл'}
            </div>
            <div className="field">
              <label className="fl">Нэр *</label>
              <input className="fi" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="field">
              <label className="fl">Тайлбар</label>
              <input className="fi" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="modal-btns">
              <button className="bp" onClick={saveType} disabled={loading}>{loading ? 'Хадгалж байна...' : 'Хадгалах'}</button>
              <button className="bs" onClick={() => setShowForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
