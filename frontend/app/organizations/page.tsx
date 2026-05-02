'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface Organization {
  id: number;
  name: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  users?: { id: number; first_name: string; last_name: string; email: string }[];
}

export default function OrganizationsPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    admin_first_name: '', admin_last_name: '', admin_email: ''
  });
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role !== 'super_admin') { router.push('/dashboard'); return; }
    loadOrgs();
  }, [mounted, user]);

  const loadOrgs = async () => {
    const res = await api.get('/api/organizations').catch(() => ({ data: [] }));
    setOrgs(res.data);
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', address: '', admin_first_name: '', admin_last_name: '', admin_email: '' });
    setEmailSent('');
  };

  const handleCreate = async () => {
    if (!form.name || !form.admin_email || !form.admin_first_name || !form.admin_last_name) {
      alert('Байгууллагын нэр болон Админы мэдээлэл бүгдийг бөглөнө үү');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/organizations', form);
      setEmailSent(res.data.message || 'Амжилттай бүртгэгдлээ.');
      loadOrgs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editOrg || !editForm.name) return;
    setLoading(true);
    try {
      await api.put(`/api/organizations/${editOrg.id}`, editForm);
      setEditOrg(null);
      loadOrgs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  const toggleActive = async (id: number, is_active: boolean) => {
    await api.put(`/api/organizations/${id}`, { is_active: !is_active });
    loadOrgs();
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout
      title="Байгууллага удирдах"
      action={
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Байгууллага нэмэх
        </button>
      }
    >
      <style>{`
        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px}
        .stat{background:white;border:0.5px solid #e2e8f0;border-radius:14px;padding:16px}
        .stat-label{font-size:11px;color:#64748b;font-weight:500;margin-bottom:6px}
        .stat-val{font-size:24px;font-weight:700;color:#0f172a}
        .tbl{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden;overflow-x:auto}
        .th{display:grid;grid-template-columns:1.4fr 120px 160px 180px 90px 130px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;gap:8px;min-width:700px}
        .tr{display:grid;grid-template-columns:1.4fr 120px 160px 180px 90px 130px;padding:13px 16px;border-bottom:0.5px solid #f1f5f9;align-items:center;transition:background 0.1s;gap:8px;min-width:700px}
        .tr:last-child{border-bottom:none}
        .tr:hover{background:#fafafa}
        .badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;display:inline-block}
        .badge-on{background:#dcfce7;color:#166534}
        .badge-off{background:#fee2e2;color:#991b1b}
        .actions{display:flex;gap:6px}
        .btn-sm{font-size:11px;font-weight:600;padding:5px 10px;border-radius:7px;border:0.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s}
        .btn-sm:hover{border-color:#d97706;color:#d97706}
        .btn-sm.danger:hover{border-color:#ef4444;color:#ef4444}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-height:92vh;overflow-y:auto}
        .modal-title{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:16px}
        .sec-label{font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px}
        .field{margin-bottom:12px}
        .field label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px}
        .field input{width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;transition:border 0.15s}
        .field input:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .req{color:#ef4444;margin-left:2px}
        .divider{border:none;border-top:0.5px solid #f1f5f9;margin:14px 0}
        .info-box{background:#fef3c7;border:0.5px solid #fde68a;border-radius:10px;padding:10px 14px;font-size:12px;color:#4338ca;margin-bottom:14px;line-height:1.5}
        .warn-box{background:#fef9c3;border:0.5px solid #fde68a;border-radius:10px;padding:10px 14px;font-size:12px;color:#92400e;margin-bottom:14px;line-height:1.5}
        .modal-btns{display:flex;gap:10px;margin-top:16px}
        .btn-primary{flex:1;background:#d97706;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed}
        .btn-secondary{flex:1;background:white;color:#374151;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .success-box{text-align:center;padding:20px 0}
      `}</style>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">Нийт байгууллага</div>
          <div className="stat-val">{orgs.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Идэвхтэй</div>
          <div className="stat-val" style={{ color: '#059669' }}>{orgs.filter(o => o.is_active).length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Идэвхгүй</div>
          <div className="stat-val" style={{ color: '#ef4444' }}>{orgs.filter(o => !o.is_active).length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="tbl">
        <div className="th">
          <div>Байгууллагын нэр</div>
          <div>Утас</div>
          <div>Хаяг</div>
          <div>Админ</div>
          <div>Төлөв</div>
          <div>Үйлдэл</div>
        </div>
        {orgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>
            Байгууллага байхгүй байна
          </div>
        )}
        {orgs.map(org => {
          const admin = org.users?.[0];
          return (
            <div key={org.id} className="tr">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{org.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  #{org.id} · {new Date(org.created_at).toLocaleDateString('mn-MN')}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#374151' }}>{org.phone || '—'}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>{org.address || '—'}</div>
              <div>
                {admin ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{admin.last_name} {admin.first_name}</div>
                    <div style={{ fontSize: 11, color: '#d97706', marginTop: 1 }}>{admin.email}</div>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Бүртгэгдээгүй</span>
                )}
              </div>
              <div>
                <span className={`badge ${org.is_active ? 'badge-on' : 'badge-off'}`}>
                  {org.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                </span>
              </div>
              <div className="actions">
                <button className="btn-sm" onClick={() => { setEditOrg(org); setEditForm({ name: org.name, phone: org.phone || '', address: org.address || '' }); }}>
                  ✏️ Засах
                </button>
                <button className={`btn-sm ${org.is_active ? 'danger' : ''}`} onClick={() => toggleActive(org.id, org.is_active)}>
                  {org.is_active ? 'Зогсоох' : 'Идэвхжүүлэх'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* НЭМЭХ MODAL */}
      {showForm && (
        <div className="modal-bg" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {emailSent ? (
              <div className="success-box">
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Амжилттай бүртгэгдлээ!</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{emailSent}</div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setShowForm(false); resetForm(); }}>Хаах</button>
              </div>
            ) : (
              <>
                <div className="modal-title">Шинэ байгууллага нэмэх</div>
                <div className="sec-label">Байгууллагын мэдээлэл</div>
                <div className="field">
                  <label>Байгууллагын нэр <span className="req">*</span></label>
                  <input placeholder="Тавилгын цех №2" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field">
                    <label>Утасны дугаар</label>
                    <input placeholder="99001122" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Хаяг</label>
                    <input placeholder="Улаанбаатар..." value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>
                <hr className="divider" />
                <div className="sec-label">Байгууллагын Админ <span className="req">*</span></div>
                <div className="warn-box">⚠️ Байгууллага бүртгэхдээ заавал Админ бүртгэнэ. Нэвтрэх мэдээлэл имэйлээр явуулагдана.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field">
                    <label>Овог <span className="req">*</span></label>
                    <input placeholder="Батмөнх" value={form.admin_last_name} onChange={e => setForm(p => ({ ...p, admin_last_name: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Нэр <span className="req">*</span></label>
                    <input placeholder="Хонгорзул" value={form.admin_first_name} onChange={e => setForm(p => ({ ...p, admin_first_name: e.target.value }))} />
                  </div>
                </div>
                <div className="field">
                  <label>Имэйл хаяг <span className="req">*</span></label>
                  <input type="email" placeholder="admin@company.mn" value={form.admin_email} onChange={e => setForm(p => ({ ...p, admin_email: e.target.value }))} />
                </div>
                {form.admin_email && (
                  <div className="info-box">📧 Нэвтрэх нэр болон нэг удаагийн нууц үг <strong>{form.admin_email}</strong> хаяг руу автоматаар илгээгдэнэ.</div>
                )}
                <div className="modal-btns">
                  <button className="btn-primary" onClick={handleCreate} disabled={loading || !form.name || !form.admin_email || !form.admin_first_name || !form.admin_last_name}>
                    {loading ? 'Хадгалж байна...' : 'Байгууллага бүртгэх'}
                  </button>
                  <button className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Болих</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ЗАСАХ MODAL */}
      {editOrg && (
        <div className="modal-bg" onClick={() => setEditOrg(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Байгууллага засах</div>
            <div className="field">
              <label>Байгууллагын нэр <span className="req">*</span></label>
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field">
                <label>Утасны дугаар</label>
                <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="field">
                <label>Хаяг</label>
                <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
              </div>
            </div>
            {editOrg.users?.[0] && (
              <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Одоогийн Админ</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{editOrg.users[0].last_name} {editOrg.users[0].first_name}</div>
                <div style={{ fontSize: 12, color: '#d97706', marginTop: 2 }}>{editOrg.users[0].email}</div>
              </div>
            )}
            <div className="modal-btns">
              <button className="btn-primary" onClick={handleUpdate} disabled={loading || !editForm.name}>
                {loading ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
              <button className="btn-secondary" onClick={() => setEditOrg(null)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}