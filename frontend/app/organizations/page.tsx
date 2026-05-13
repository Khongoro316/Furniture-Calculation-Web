'use client';

import { useState, useEffect, useRef } from 'react';
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
  phone?: string;
  is_active: boolean;
  created_at: string;
}

interface Organization {
  id: number;
  name: string;
  phone: string;
  address: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  users?: User[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Админ', accountant: 'Нягтлан',
  order_processor: 'Захиалга боловсруулагч', worker: 'Ажилтан', customer: 'Хэрэглэгч',
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:           { bg: '#eff6ff', color: '#1d4ed8' },
  accountant:      { bg: '#f0fdf4', color: '#15803d' },
  order_processor: { bg: '#fef3c7', color: '#b45309' },
  worker:          { bg: '#f5f3ff', color: '#7c3aed' },
  customer:        { bg: '#fdf2f8', color: '#be185d' },
};

const avatarColors = ['#d97706','#0891b2','#059669','#7c3aed','#db2777','#ea580c'];

export default function OrganizationsPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Бүртгэх form (super_admin)
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    admin_first_name: '', admin_last_name: '', admin_email: '',
  });

  // Засах form
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });

  // Дэлгэрэнгүй
  const [detailOrg, setDetailOrg] = useState<Organization | null>(null);
  const [detailUsers, setDetailUsers] = useState<User[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'users'>('info');

  // Устгах
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['super_admin', 'admin'].includes(user.role)) { router.push('/dashboard'); return; }
    loadOrgs();
  }, [mounted, user]);

  const loadOrgs = async () => {
    setTableLoading(true);
    try {
      if (isAdmin) {
        // Admin зөвхөн өөрийн байгууллагыг харна
        const res = await api.get(`/api/organizations/${(user as any).org_id}`);
        setOrgs(res.data ? [res.data] : []);
        // Автоматаар дэлгэрэнгүй харуулна
        if (res.data) {
          setDetailOrg(res.data);
          loadOrgUsers(res.data.id);
        }
      } else {
        // Super admin бүгдийг харна
        const res = await api.get('/api/organizations');
        setOrgs(res.data || []);
      }
    } catch {
      setOrgs([]);
    } finally {
      setTableLoading(false);
    }
  };

  const loadOrgUsers = async (orgId: number) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/organizations/${orgId}/users`);
      setDetailUsers(res.data || []);
    } catch {
      setDetailUsers([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (org: Organization) => {
    setDetailOrg(org);
    setActiveTab('info');
    loadOrgUsers(org.id);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (isEdit) { setEditImageFile(file); setEditImagePreview(url); }
    else { setImageFile(file); setImagePreview(url); }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', address: '', admin_first_name: '', admin_last_name: '', admin_email: '' });
    setImageFile(null); setImagePreview(null); setEmailSent('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // Бүртгэх (super_admin)
  const handleCreate = async () => {
    if (!form.name || !form.admin_email || !form.admin_first_name || !form.admin_last_name) {
      alert('Байгууллагын нэр болон Админы мэдээлэл бүгдийг бөглөнө үү'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      const res = await api.post('/api/organizations', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEmailSent(res.data.message || 'Амжилттай бүртгэгдлээ.');
      loadOrgs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Алдаа гарлаа');
    } finally { setSaving(false); }
  };

  // Засах
  const handleUpdate = async () => {
    if (!editOrg) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
      if (editImageFile) fd.append('image', editImageFile);
      await api.put(`/api/organizations/${editOrg.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditOrg(null);
      loadOrgs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Алдаа гарлаа');
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: number, is_active: boolean) => {
    await api.put(`/api/organizations/${id}`, { is_active: String(!is_active) });
    loadOrgs();
    if (detailOrg?.id === id) setDetailOrg(p => p ? { ...p, is_active: !p.is_active } : null);
  };

  if (!mounted || !user) return null;

  // ── ADMIN: өөрийн байгууллагыг шууд харуулна ─────────────────────────────────
  if (isAdmin) {
    return (
      <AppLayout
        title="Байгууллагын мэдээлэл"
        action={
          detailOrg ? (
            <button
              onClick={() => {
                setEditOrg(detailOrg);
                setEditForm({ name: detailOrg.name, phone: detailOrg.phone || '', address: detailOrg.address || '' });
                setEditImageFile(null); setEditImagePreview(null);
              }}
              style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ✏️ Мэдээлэл засах
            </button>
          ) : undefined
        }
      >
        <style>{`
          .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
          .info-item{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px}
          .info-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px}
          .info-val{font-size:14px;font-weight:600;color:#0f172a}
          .tab-row{display:flex;border-bottom:1px solid #e2e8f0;margin-bottom:20px;background:white;border-radius:12px 12px 0 0;overflow:hidden}
          .tab{flex:1;padding:14px;text-align:center;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border:none;background:none;font-family:inherit;border-bottom:2px solid transparent;transition:all 0.15s}
          .tab.on{color:#d97706;border-bottom-color:#d97706;background:#fffbf5}
          .wk-card{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9}
          .wk-card:last-child{border-bottom:none}
          .wk-av{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0}
          .card{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:20px}
          .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
          .modal{background:white;border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.2);display:flex;flex-direction:column}
          .modal-head{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2}
          .modal-title{font-size:15px;font-weight:800;color:#0f172a}
          .mclose{width:28px;height:28px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:16px;color:#64748b;display:flex;align-items:center;justify-content:center}
          .modal-body{padding:20px}
          .modal-foot{display:flex;gap:10px;padding:14px 20px;border-top:1px solid #f1f5f9;background:white;position:sticky;bottom:0}
          .btn-save{flex:1;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
          .btn-cancel{background:#f1f5f9;color:#374151;border:none;border-radius:10px;padding:11px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
          .field{margin-bottom:12px}
          .fl{font-size:11px;font-weight:700;color:#374151;display:block;margin-bottom:5px}
          .fi{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;transition:border-color 0.15s;background:white}
          .fi:focus{border-color:#d97706}
          .frow2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
          .img-upload{border:2px dashed #e2e8f0;border-radius:12px;padding:16px;text-align:center;cursor:pointer;transition:all 0.2s;background:#fafafa}
          .img-upload:hover{border-color:#d97706;background:#fffbf5}
          .img-preview{width:100%;height:130px;object-fit:cover;border-radius:10px;display:block}
          @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
          .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}
        `}</style>

        {tableLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#94a3b8' }}>
            Ачааллаж байна...
          </div>
        ) : !detailOrg ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            Байгууллагын мэдээлэл олдсонгүй
          </div>
        ) : (
          <>
            {/* Hero */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: 160, background: detailOrg.image_url ? 'transparent' : 'linear-gradient(135deg,#d97706,#b45309)', position: 'relative' }}>
                {detailOrg.image_url ? (
                  <img src={detailOrg.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
                      {detailOrg.name.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.5),transparent)' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 20, color: 'white' }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{detailOrg.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                    {detailOrg.is_active ? '✅ Идэвхтэй' : '❌ Идэвхгүй'}
                    {detailOrg.address && ` · 📍 ${detailOrg.address}`}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tab-row">
                <button className={`tab ${activeTab === 'info' ? 'on' : ''}`} onClick={() => setActiveTab('info')}>
                  📋 Дэлгэрэнгүй мэдээлэл
                </button>
                <button className={`tab ${activeTab === 'users' ? 'on' : ''}`} onClick={() => setActiveTab('users')}>
                  👥 Ажилчид ({detailLoading ? '...' : detailUsers.length})
                </button>
              </div>

              <div style={{ padding: 20 }}>
                {activeTab === 'info' && (
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Байгууллагын нэр</div>
                      <div className="info-val">{detailOrg.name}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Утас</div>
                      <div className="info-val">{detailOrg.phone || '—'}</div>
                    </div>
                    <div className="info-item" style={{ gridColumn: '1/-1' }}>
                      <div className="info-label">Хаяг</div>
                      <div className="info-val">{detailOrg.address || '—'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Бүртгэсэн огноо</div>
                      <div className="info-val">{new Date(detailOrg.created_at).toLocaleDateString('mn-MN')}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Төлөв</div>
                      <div className="info-val">
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: detailOrg.is_active ? '#dcfce7' : '#fee2e2', color: detailOrg.is_active ? '#166534' : '#991b1b' }}>
                          {detailOrg.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div>
                    {detailLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                          <div className="skel" style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div className="skel" style={{ height: 13, width: '60%', marginBottom: 8 }} />
                            <div className="skel" style={{ height: 10, width: '40%' }} />
                          </div>
                        </div>
                      ))
                    ) : detailUsers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
                        <div style={{ fontWeight: 600, color: '#64748b' }}>Ажилтан бүртгэгдээгүй байна</div>
                      </div>
                    ) : detailUsers.map((u, i) => {
                      const rs = ROLE_COLORS[u.role] || { bg: '#f1f5f9', color: '#374151' };
                      return (
                        <div key={u.id} className="wk-card">
                          <div className="wk-av" style={{ background: avatarColors[i % avatarColors.length] }}>
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{u.last_name} {u.first_name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: rs.bg, color: rs.color }}>
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#166534' : '#991b1b' }}>
                              {u.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Засах modal */}
        {editOrg && (
          <div className="modal-bg" onClick={() => setEditOrg(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">✏️ Байгууллага засах</div>
                <button className="mclose" onClick={() => setEditOrg(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="field">
                  <label className="fl">Лого / Зураг</label>
                  {(editImagePreview || editOrg.image_url) ? (
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <img src={editImagePreview || editOrg.image_url || ''} className="img-preview" alt="" />
                      <button
                        onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}
                        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                      >×</button>
                    </div>
                  ) : (
                    <div className="img-upload" onClick={() => editFileRef.current?.click()}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Зураг солих</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>JPG, PNG, WEBP · 5MB</div>
                    </div>
                  )}
                  <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageSelect(e, true)} />
                </div>
                <div className="field">
                  <label className="fl">Байгууллагын нэр</label>
                  <input className="fi" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="frow2">
                  <div className="field">
                    <label className="fl">Утас</label>
                    <input className="fi" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="fl">Хаяг</label>
                    <input className="fi" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button className="btn-cancel" onClick={() => setEditOrg(null)}>Болих</button>
                <button className="btn-save" onClick={handleUpdate} disabled={saving}>
                  {saving ? '⏳ Хадгалж байна...' : '💾 Хадгалах'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  // ── SUPER ADMIN: бүх байгууллага ─────────────────────────────────────────────
  return (
    <AppLayout
      title="Байгууллага удирдах"
      action={
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Байгууллага нэмэх
        </button>
      }
    >
      <style>{`
        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px}
        .stat-card{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px}
        .stat-label{font-size:12px;color:#64748b;font-weight:500;margin-bottom:6px}
        .stat-val{font-size:26px;font-weight:800;color:#0f172a}
        .tbl{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
        .tbl-head{display:grid;grid-template-columns:56px 1fr 120px 160px 90px 150px;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:10px;align-items:center}
        .tbl-row{display:grid;grid-template-columns:56px 1fr 120px 160px 90px 150px;padding:11px 16px;border-bottom:1px solid #f1f5f9;align-items:center;gap:10px;transition:background 0.12s;cursor:pointer}
        .tbl-row:last-child{border-bottom:none}
        .tbl-row:hover{background:#fafbfc}
        .org-av{width:40px;height:40px;border-radius:12px;overflow:hidden;border:1.5px solid #e5e7eb;flex-shrink:0}
        .org-av img{width:100%;height:100%;object-fit:cover;display:block}
        .org-av-ph{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:white;flex-shrink:0}
        .badge-on{background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px}
        .badge-off{background:#fee2e2;color:#991b1b;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px}
        .act-btn{font-size:11px;font-weight:600;padding:5px 10px;border-radius:7px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-family:inherit;color:#374151;transition:all 0.15s;white-space:nowrap}
        .act-btn:hover{border-color:#d97706;color:#d97706}
        .act-btn.danger:hover{border-color:#ef4444;color:#ef4444;background:#fef2f2}
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:20px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.2);display:flex;flex-direction:column}
        .modal-head{padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2}
        .modal-title{font-size:16px;font-weight:800;color:#0f172a}
        .mclose{width:30px;height:30px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:18px;color:#64748b;display:flex;align-items:center;justify-content:center;transition:all 0.15s;line-height:1}
        .modal-body{padding:22px;flex:1}
        .modal-foot{display:flex;gap:10px;padding:16px 22px;border-top:1px solid #f1f5f9;background:white;position:sticky;bottom:0}
        .btn-save{flex:1;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:11px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-save:disabled{opacity:0.55;cursor:not-allowed}
        .btn-cancel{background:#f1f5f9;color:#374151;border:none;border-radius:11px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
        .sec-div{font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:8px;border-bottom:1px solid #f1f5f9;margin:16px 0 14px}
        .sec-div:first-child{margin-top:0}
        .field{margin-bottom:12px}
        .fl{font-size:11px;font-weight:700;color:#374151;display:block;margin-bottom:5px}
        .req{color:#ef4444;margin-left:2px}
        .fi{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;transition:border-color 0.15s;background:white}
        .fi:focus{border-color:#d97706}
        .frow2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .img-upload{border:2px dashed #e2e8f0;border-radius:12px;padding:16px;text-align:center;cursor:pointer;transition:all 0.2s;background:#fafafa}
        .img-upload:hover{border-color:#d97706;background:#fffbf5}
        .img-preview{width:100%;height:140px;object-fit:cover;border-radius:10px;display:block}
        .detail-modal{background:white;border-radius:24px;width:100%;max-width:700px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 32px 100px rgba(0,0,0,0.22)}
        .dm-hero{position:relative;height:170px;overflow:hidden;flex-shrink:0}
        .dm-hero img{width:100%;height:100%;object-fit:cover}
        .dm-hero-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:800;color:rgba(255,255,255,0.85)}
        .dm-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55),transparent)}
        .dm-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;border:none;background:rgba(255,255,255,0.2);color:white;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
        .dm-title{position:absolute;bottom:14px;left:18px;color:white}
        .dm-name{font-size:20px;font-weight:800}
        .dm-sub{font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px}
        .dm-tabs{display:flex;border-bottom:1px solid #f1f5f9;flex-shrink:0}
        .dm-tab{flex:1;padding:13px;text-align:center;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border:none;background:none;font-family:inherit;border-bottom:2px solid transparent;transition:all 0.15s}
        .dm-tab.on{color:#d97706;border-bottom-color:#d97706}
        .dm-body{overflow-y:auto;padding:20px 22px;flex:1}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .info-item{background:#f8fafc;border-radius:12px;padding:14px 16px}
        .info-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px}
        .info-val{font-size:14px;font-weight:600;color:#0f172a}
        .wk-card{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #f1f5f9}
        .wk-card:last-child{border-bottom:none}
        .wk-av{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0}
        .empty{padding:48px 0;text-align:center;color:#94a3b8}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
      `}</style>

      {/* Статистик */}
      <div className="stats-row">
        <div className="stat-card"><div className="stat-label">Нийт байгууллага</div><div className="stat-val">{orgs.length}</div></div>
        <div className="stat-card"><div className="stat-label">Идэвхтэй</div><div className="stat-val" style={{ color: '#059669' }}>{orgs.filter(o => o.is_active).length}</div></div>
        <div className="stat-card"><div className="stat-label">Идэвхгүй</div><div className="stat-val" style={{ color: '#ef4444' }}>{orgs.filter(o => !o.is_active).length}</div></div>
      </div>

      {/* Хүснэгт */}
      <div className="tbl">
        <div className="tbl-head">
          <div></div><div>Байгууллагын нэр</div><div>Утас</div><div>Админ</div><div>Төлөв</div><div>Үйлдэл</div>
        </div>
        {tableLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 120px 160px 90px 150px', padding: '12px 16px', gap: 10, alignItems: 'center' }}>
              <div className="skel" style={{ width: 40, height: 40, borderRadius: 12 }} />
              {[120,80,130,60,110].map((w,j) => <div key={j} className="skel" style={{ height: 13, width: w }} />)}
            </div>
          ))
        ) : orgs.length === 0 ? (
          <div className="empty">Байгууллага байхгүй байна</div>
        ) : orgs.map(org => {
          const admin = org.users?.[0];
          const color = avatarColors[org.id % avatarColors.length];
          return (
            <div key={org.id} className="tbl-row" onClick={() => openDetail(org)}>
              <div>
                {org.image_url ? (
                  <div className="org-av"><img src={org.image_url} alt={org.name} /></div>
                ) : (
                  <div className="org-av-ph" style={{ background: color }}>{org.name.slice(0,2).toUpperCase()}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{org.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{org.address || '—'}</div>
              </div>
              <div style={{ fontSize: 12, color: '#374151' }}>{org.phone || '—'}</div>
              <div>
                {admin ? (
                  <><div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{admin.last_name} {admin.first_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{admin.email}</div></>
                ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>Бүртгэгдээгүй</span>}
              </div>
              <div onClick={e => e.stopPropagation()}>
                <span className={org.is_active ? 'badge-on' : 'badge-off'}>{org.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
              </div>
              <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                <button className="act-btn" onClick={() => { setEditOrg(org); setEditForm({ name: org.name, phone: org.phone||'', address: org.address||'' }); setEditImageFile(null); setEditImagePreview(null); }}>✏️ Засах</button>
                <button className={`act-btn ${org.is_active ? 'danger' : ''}`} onClick={() => toggleActive(org.id, org.is_active)}>
                  {org.is_active ? 'Зогсоох' : 'Идэвхжүүлэх'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Бүртгэх modal */}
      {showForm && (
        <div className="modal-bg" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">🏢 Шинэ байгууллага бүртгэх</div>
              <button className="mclose" onClick={() => { setShowForm(false); resetForm(); }}>×</button>
            </div>
            {emailSent ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '48px 22px' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Амжилттай!</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>{emailSent}</div>
                <button onClick={() => { setShowForm(false); resetForm(); }} style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 11, padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Хаах</button>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <div className="sec-div">Байгууллагын мэдээлэл</div>
                  <div className="field">
                    <label className="fl">Лого / Зураг</label>
                    {imagePreview ? (
                      <div style={{ position: 'relative', marginBottom: 8 }}>
                        <img src={imagePreview} className="img-preview" alt="" />
                        <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
                      </div>
                    ) : (
                      <div className="img-upload" onClick={() => fileRef.current?.click()}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Зураг оруулах</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>JPG, PNG, WEBP · 5MB</div>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageSelect(e, false)} />
                  </div>
                  <div className="field"><label className="fl">Байгууллагын нэр <span className="req">*</span></label><input className="fi" placeholder="Дархан Мод ХХК" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="frow2">
                    <div className="field"><label className="fl">Утас</label><input className="fi" placeholder="+976 9900-0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div className="field"><label className="fl">Хаяг</label><input className="fi" placeholder="Дархан хот" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
                  </div>
                  <div className="sec-div">Байгууллагын Админ</div>
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 14, lineHeight: 1.6 }}>
                    💡 Нэвтрэх мэдээлэл автоматаар имэйлээр илгээгдэнэ
                  </div>
                  <div className="frow2">
                    <div className="field"><label className="fl">Овог <span className="req">*</span></label><input className="fi" placeholder="Батбаяр" value={form.admin_last_name} onChange={e => setForm(p => ({ ...p, admin_last_name: e.target.value }))} /></div>
                    <div className="field"><label className="fl">Нэр <span className="req">*</span></label><input className="fi" placeholder="Нарантуяа" value={form.admin_first_name} onChange={e => setForm(p => ({ ...p, admin_first_name: e.target.value }))} /></div>
                  </div>
                  <div className="field"><label className="fl">Имэйл <span className="req">*</span></label><input className="fi" type="email" placeholder="admin@company.mn" value={form.admin_email} onChange={e => setForm(p => ({ ...p, admin_email: e.target.value }))} /></div>
                </div>
                <div className="modal-foot">
                  <button className="btn-cancel" onClick={() => { setShowForm(false); resetForm(); }}>Болих</button>
                  <button className="btn-save" onClick={handleCreate} disabled={saving}>{saving ? '⏳ Бүртгэж байна...' : '🏢 Байгууллага бүртгэх'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Засах modal */}
      {editOrg && (
        <div className="modal-bg" onClick={() => setEditOrg(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><div className="modal-title">✏️ Байгууллага засах</div><button className="mclose" onClick={() => setEditOrg(null)}>×</button></div>
            <div className="modal-body">
              <div className="field">
                <label className="fl">Лого / Зураг</label>
                {(editImagePreview || editOrg.image_url) ? (
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <img src={editImagePreview || editOrg.image_url || ''} className="img-preview" alt="" />
                    <button onClick={() => { setEditImageFile(null); setEditImagePreview(null); }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
                  </div>
                ) : (
                  <div className="img-upload" onClick={() => editFileRef.current?.click()}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Зураг солих</div>
                  </div>
                )}
                <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageSelect(e, true)} />
              </div>
              <div className="field"><label className="fl">Байгууллагын нэр</label><input className="fi" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="frow2">
                <div className="field"><label className="fl">Утас</label><input className="fi" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div className="field"><label className="fl">Хаяг</label><input className="fi" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-cancel" onClick={() => setEditOrg(null)}>Болих</button>
              <button className="btn-save" onClick={handleUpdate} disabled={saving}>{saving ? '⏳ Хадгалж байна...' : '💾 Хадгалах'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Дэлгэрэнгүй modal */}
      {detailOrg && (
        <div className="modal-bg" onClick={() => setDetailOrg(null)}>
          <div className="detail-modal" style={{ animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div className="dm-hero">
              {detailOrg.image_url ? <img src={detailOrg.image_url} alt="" /> : (
                <div className="dm-hero-ph" style={{ background: `linear-gradient(135deg,${avatarColors[detailOrg.id % avatarColors.length]},#1c1917)` }}>{detailOrg.name.slice(0,2).toUpperCase()}</div>
              )}
              <div className="dm-overlay" />
              <button className="dm-close" onClick={() => setDetailOrg(null)}>×</button>
              <div className="dm-title">
                <div className="dm-name">{detailOrg.name}</div>
                <div className="dm-sub">{detailOrg.is_active ? '✅ Идэвхтэй' : '❌ Идэвхгүй'}{detailOrg.address && ` · 📍 ${detailOrg.address}`}</div>
              </div>
            </div>
            <div className="dm-tabs">
              <button className={`dm-tab ${activeTab==='info'?'on':''}`} onClick={() => setActiveTab('info')}>📋 Мэдээлэл</button>
              <button className={`dm-tab ${activeTab==='users'?'on':''}`} onClick={() => setActiveTab('users')}>👥 Ажилчид ({detailLoading?'...':detailUsers.length})</button>
            </div>
            <div className="dm-body">
              {activeTab === 'info' && (
                <>
                  <div className="info-grid">
                    <div className="info-item"><div className="info-label">Нэр</div><div className="info-val">{detailOrg.name}</div></div>
                    <div className="info-item"><div className="info-label">Утас</div><div className="info-val">{detailOrg.phone||'—'}</div></div>
                    <div className="info-item" style={{ gridColumn:'1/-1' }}><div className="info-label">Хаяг</div><div className="info-val">{detailOrg.address||'—'}</div></div>
                    <div className="info-item"><div className="info-label">Бүртгэсэн</div><div className="info-val">{new Date(detailOrg.created_at).toLocaleDateString('mn-MN')}</div></div>
                    <div className="info-item"><div className="info-label">Төлөв</div><div className="info-val"><span className={detailOrg.is_active?'badge-on':'badge-off'}>{detailOrg.is_active?'Идэвхтэй':'Идэвхгүй'}</span></div></div>
                  </div>
                  <div style={{ display:'flex', gap:10, marginTop:16 }}>
                    <button onClick={() => { setDetailOrg(null); setEditOrg(detailOrg); setEditForm({name:detailOrg.name,phone:detailOrg.phone||'',address:detailOrg.address||''}); setEditImageFile(null); setEditImagePreview(null); }} style={{ flex:1, background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:10, padding:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#374151' }}>✏️ Засах</button>
                    <button onClick={() => toggleActive(detailOrg.id, detailOrg.is_active)} style={{ flex:1, background:detailOrg.is_active?'#fef2f2':'#f0fdf4', border:`1.5px solid ${detailOrg.is_active?'#fca5a5':'#86efac'}`, borderRadius:10, padding:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:detailOrg.is_active?'#dc2626':'#16a34a' }}>
                      {detailOrg.is_active?'🚫 Зогсоох':'✅ Идэвхжүүлэх'}
                    </button>
                  </div>
                </>
              )}
              {activeTab === 'users' && (
                detailLoading ? Array.from({length:3}).map((_,i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid #f1f5f9', alignItems:'center' }}>
                    <div className="skel" style={{ width:38,height:38,borderRadius:11,flexShrink:0 }}/>
                    <div style={{ flex:1 }}><div className="skel" style={{ height:13,width:'60%',marginBottom:8 }}/><div className="skel" style={{ height:10,width:'40%' }}/></div>
                  </div>
                )) : detailUsers.length === 0 ? (
                  <div className="empty"><div style={{ fontSize:32,marginBottom:10 }}>👥</div><div style={{ fontWeight:600,color:'#64748b' }}>Ажилтан бүртгэгдээгүй байна</div></div>
                ) : detailUsers.map((u,i) => {
                  const rs = ROLE_COLORS[u.role] || { bg:'#f1f5f9', color:'#374151' };
                  return (
                    <div key={u.id} className="wk-card">
                      <div className="wk-av" style={{ background:avatarColors[i%avatarColors.length] }}>{u.first_name?.[0]}{u.last_name?.[0]}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{u.last_name} {u.first_name}</div>
                        <div style={{ fontSize:11,color:'#94a3b8' }}>{u.email}</div>
                      </div>
                      <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4 }}>
                        <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:100,background:rs.bg,color:rs.color }}>{ROLE_LABELS[u.role]||u.role}</span>
                        <span style={{ fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:100,background:u.is_active?'#dcfce7':'#fee2e2',color:u.is_active?'#166534':'#991b1b' }}>{u.is_active?'Идэвхтэй':'Идэвхгүй'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}