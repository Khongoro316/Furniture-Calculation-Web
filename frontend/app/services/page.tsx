'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../components/ui/ToastProvider';

interface Service {
  id: number;
  name: string;
  unit: string;
  price: number;
  description: string;
  is_active: boolean;
  service_type_id: number;
  service_types: { name: string };
}

interface ServiceType {
  id: number;
  name: string;
}

const emptyForm = { service_type_id: '', name: '', unit: 'м', price: '', description: '' };

export default function ServicesPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { notify } = useToast();
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);

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
    if (!['accountant', 'admin', 'super_admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [mounted, user]);

  const loadData = async () => {
    const [servicesRes, typesRes] = await Promise.all([
      api.get('/api/services').catch(() => ({ data: [] })),
      api.get('/api/services/types').catch(() => ({ data: [] })),
    ]);

    setServices(servicesRes.data || []);
    setTypes((typesRes.data || []).filter((type: any) => type.is_active !== false));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      service_type_id: String(service.service_type_id),
      name: service.name,
      unit: service.unit,
      price: String(service.price),
      description: service.description || '',
    });
    setShowForm(true);
  };

  const saveService = async () => {
    if (!form.name.trim() || !form.service_type_id) {
      notify('Үйлчилгээний төрөл болон нэрээ оруулна уу', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        service_type_id: Number(form.service_type_id),
        price: Number(form.price || 0),
      };

      if (editing) {
        const res = await api.put(`/api/services/${editing.id}`, payload);
        notify(res.data?.message || 'Үйлчилгээ шинэчлэгдлээ', 'success');
      } else {
        const res = await api.post('/api/services', payload);
        notify(res.data?.message || 'Үйлчилгээ нэмэгдлээ', 'success');
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      loadData();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Хадгалах үед алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const archiveService = async (service: Service) => {
    if (!confirm(`"${service.name}" үйлчилгээг идэвхгүй болгох уу?`)) return;

    try {
      const res = await api.delete(`/api/services/${service.id}`);
      notify(res.data?.message || 'Үйлчилгээ идэвхгүй боллоо', 'success');
      loadData();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Устгах үед алдаа гарлаа', 'error');
    }
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout
      title="Үйлчилгээ удирдах"
      action={
        <button onClick={openCreate} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Нэмэх
        </button>
      }
    >
      <style>{`
        .tbl{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .th{display:grid;grid-template-columns:1fr 140px 80px 100px 100px 150px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:8px}
        .tr{display:grid;grid-template-columns:1fr 140px 80px 100px 100px 150px;padding:12px 16px;border-bottom:0.5px solid #f1f5f9;align-items:center;gap:8px;transition:background 0.1s}
        .tr:last-child{border-bottom:none}.tr:hover{background:#fafafa}
        .actions{display:flex;gap:8px}
        .action{font-size:11px;font-weight:700;padding:5px 10px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-family:inherit}
        .danger{color:#dc2626;border-color:#fecaca;background:#fff7f7}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .field{margin-bottom:12px}
        .fl{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
        .fi{width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;color:#0f172a;background:white}
        .modal-btns{display:flex;gap:10px;margin-top:16px}
        .bp{flex:1;background:#d97706;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .bs{flex:1;background:white;color:#374151;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        @media(max-width:700px){.th,.tr{grid-template-columns:1fr 100px 120px}.hide-sm{display:none}}
      `}</style>

      <div className="tbl">
        <div className="th">
          <div>Нэр</div>
          <div className="hide-sm">Төрөл</div>
          <div>Нэгж</div>
          <div>Үнэ</div>
          <div>Төлөв</div>
          <div>Үйлдэл</div>
        </div>
        {services.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Үйлчилгээ байхгүй байна</div>}
        {services.map((service) => (
          <div key={service.id} className="tr">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{service.name}</div>
              {service.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{service.description}</div>}
            </div>
            <div className="hide-sm" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600 }}>{service.service_types?.name}</div>
            <div style={{ fontSize: 12, color: '#374151' }}>{service.unit}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{Number(service.price).toLocaleString()}</div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: service.is_active ? '#dcfce7' : '#fee2e2', color: service.is_active ? '#166534' : '#991b1b' }}>
                {service.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
              </span>
            </div>
            <div className="actions">
              <button className="action" onClick={() => openEdit(service)}>Засах</button>
              <button className="action danger" onClick={() => archiveService(service)}>Идэвхгүй болгох</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
              {editing ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ нэмэх'}
            </div>
            <div className="field">
              <label className="fl">Үйлчилгээний төрөл *</label>
              <select className="fi" value={form.service_type_id} onChange={(event) => setForm((current) => ({ ...current, service_type_id: event.target.value }))}>
                <option value="">-- Сонгоно уу --</option>
                {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="fl">Нэр *</label>
              <input className="fi" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field">
                <label className="fl">Нэгж</label>
                <select className="fi" value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}>
                  {['м', 'м²', 'ш', 'цаг', 'удаа'].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="fl">Үнэ *</label>
                <input className="fi" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label className="fl">Тайлбар</label>
              <input className="fi" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="modal-btns">
              <button className="bp" onClick={saveService} disabled={loading}>{loading ? 'Хадгалж байна...' : 'Хадгалах'}</button>
              <button className="bs" onClick={() => setShowForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
