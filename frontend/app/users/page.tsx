'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../components/ui/ToastProvider';

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

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Супер админ',
  admin: 'Админ',
  accountant: 'Нягтлан',
  order_processor: 'Захиалга боловсруулагч',
  worker: 'Ажилтан',
  customer: 'Хэрэглэгч',
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: '#fef3c7', color: '#92400e' },
  admin: { bg: '#eff6ff', color: '#1d4ed8' },
  accountant: { bg: '#e0f2fe', color: '#075985' },
  order_processor: { bg: '#fef9c3', color: '#92400e' },
  worker: { bg: '#dcfce7', color: '#166534' },
  customer: { bg: '#fce7f3', color: '#9d174d' },
};

const ADMIN_ONLY_ROLES = [{ value: 'admin', label: 'Админ' }];
const WORKER_ROLES = [
  { value: 'accountant', label: 'Нягтлан' },
  { value: 'order_processor', label: 'Захиалга боловсруулагч' },
  { value: 'worker', label: 'Ажилтан' },
];
const ADMIN_VISIBLE_ROLES = [
  { value: 'accountant', label: 'Нягтлан' },
  { value: 'order_processor', label: 'Захиалга боловсруулагч' },
  { value: 'worker', label: 'Ажилтан' },
];

const avatarColors = ['#d97706', '#0891b2', '#059669', '#7c3aed', '#db2777', '#ea580c'];

export default function UsersPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { notify } = useToast();

  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: user?.role === 'super_admin' ? 'admin' : 'worker',
    password: '',
  });

  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('worker');
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (!savedUser || !savedToken) {
      router.push('/auth/login');
      return;
    }

    setAuth(JSON.parse(savedUser), savedToken);
    setMounted(true);
  }, [router, setAuth]);

  useEffect(() => {
    if (!mounted || !user) {
      return;
    }

    if (!['admin', 'super_admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    void loadUsers();
  }, [mounted, user]);

  const loadUsers = async () => {
    setTableLoading(true);
    try {
      const res = await api.get('/api/auth/users');
      setUsers(res.data || []);
    } catch {
      setUsers([]);
      notify('Хэрэглэгчдийн мэдээлэл ачаалагдсангүй', 'error');
    } finally {
      setTableLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: user?.role === 'super_admin' ? 'admin' : 'worker',
      password: '',
    });
    setSuccessMsg('');
  };

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      notify('Овог, нэр, имэйлээ бүрэн оруулна уу', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/api/auth/create-worker', form);
      setSuccessMsg(res.data.message || 'Амжилттай бүртгэгдлээ.');
      await loadUsers();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Бүртгэх үед алдаа гарлаа', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleModal) {
      return;
    }

    setRoleSaving(true);
    try {
      await api.put(`/api/auth/users/${roleModal.id}/role`, { role: newRole });
      setRoleModal(null);
      await loadUsers();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Эрх өөрчлөх үед алдаа гарлаа', 'error');
    } finally {
      setRoleSaving(false);
    }
  };

  const toggleActive = async (id: number, is_active: boolean) => {
    try {
      await api.put(`/api/auth/users/${id}`, { is_active: !is_active });
      await loadUsers();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Төлөв өөрчлөхөд алдаа гарлаа', 'error');
    }
  };

  const filtered = users.filter((item) => {
    const matchRole = !filterRole || item.role === filterRole;
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      item.first_name.toLowerCase().includes(query) ||
      item.last_name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query);

    return matchRole && matchSearch;
  });

  if (!mounted || !user) {
    return null;
  }

  const assignableRoles = user.role === 'super_admin' ? ADMIN_ONLY_ROLES : WORKER_ROLES;
  const visibleRoles = user.role === 'super_admin' ? ADMIN_ONLY_ROLES : ADMIN_VISIBLE_ROLES;

  const statCards =
    user.role === 'super_admin'
      ? [
          {
            label: 'Нийт админ',
            value: users.length,
            icon: '👤',
            className: 'orange',
            helper: 'Системд бүртгэлтэй бүх админ account',
          },
          {
            label: 'Идэвхтэй админ',
            value: users.filter((item) => item.is_active).length,
            icon: '✅',
            className: 'green',
            helper: 'Одоо нэвтрэх боломжтой админууд',
          },
          {
            label: 'Идэвхгүй админ',
            value: users.filter((item) => !item.is_active).length,
            icon: '⏸️',
            className: 'red',
            helper: 'Түр зогсоосон account',
          },
        ]
      : [
          {
            label: 'Нийт ажилтан',
            value: users.length,
            icon: '👥',
            className: 'orange',
            helper: 'Удирдаж буй бүх account',
          },
          {
            label: 'Нягтлан',
            value: users.filter((item) => item.role === 'accountant').length,
            icon: '🧾',
            className: 'blue',
            helper: 'Санхүү, орлогын урсгал',
          },
          {
            label: 'Зах. боловсруулагч',
            value: users.filter((item) => item.role === 'order_processor').length,
            icon: '📋',
            className: 'orange',
            helper: 'Захиалга хүлээн авах ба оноох',
          },
          {
            label: 'Ажилтан',
            value: users.filter((item) => item.role === 'worker').length,
            icon: '🔨',
            className: 'green',
            helper: 'Гүйцэтгэлийн ажилтнууд',
          },
          {
            label: 'Идэвхтэй',
            value: users.filter((item) => item.is_active).length,
            icon: '✅',
            className: 'blue',
            helper: 'Одоогоор ажиллаж буй account',
          },
        ];

  return (
    <AppLayout
      title={user.role === 'super_admin' ? 'Админ удирдах' : 'Ажилтан удирдах'}
      action={
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={{
            background: 'linear-gradient(135deg,#d97706,#b45309)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
          }}
        >
          {user.role === 'super_admin' ? '+ Админ бүртгэх' : '+ Ажилтан бүртгэх'}
        </button>
      }
    >
      <style>{`
        .stats-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
        .stats-row.super-admin{grid-template-columns:repeat(3,minmax(0,1fr));max-width:980px}
        .stat-card{background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%);border:1px solid #dbe4f0;border-radius:18px;padding:18px;box-shadow:0 10px 24px rgba(15,23,42,0.05);position:relative;overflow:hidden}
        .stat-card:before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#d97706,#f59e0b)}
        .stat-card.blue:before{background:linear-gradient(90deg,#2563eb,#60a5fa)}
        .stat-card.green:before{background:linear-gradient(90deg,#059669,#34d399)}
        .stat-card.red:before{background:linear-gradient(90deg,#ef4444,#fca5a5)}
        .stat-card.orange:before{background:linear-gradient(90deg,#d97706,#fb923c)}
        .stat-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
        .stat-label{font-size:11px;color:#64748b;font-weight:700;line-height:1.45;text-transform:uppercase;letter-spacing:.04em}
        .stat-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;background:#fff7ed}
        .stat-card.blue .stat-icon{background:#eff6ff}
        .stat-card.green .stat-icon{background:#ecfdf5}
        .stat-card.red .stat-icon{background:#fef2f2}
        .stat-card.orange .stat-icon{background:#fff7ed}
        .stat-val{font-size:32px;font-weight:900;color:#0f172a;line-height:1}
        .stat-sub{margin-top:8px;font-size:11px;font-weight:600;color:#94a3b8;line-height:1.5}

        .filter-bar{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
        .search-inp{border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 14px;font-size:13px;outline:none;font-family:inherit;width:240px;transition:border-color 0.15s}
        .search-inp:focus{border-color:#d97706}
        .flt-btn{font-size:12px;font-weight:600;padding:7px 14px;border-radius:100px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s;white-space:nowrap}
        .flt-btn.on{background:#1c1917;color:white;border-color:#1c1917}
        .flt-btn:hover:not(.on){border-color:#d97706;color:#d97706}

        .tbl{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
        .tbl-head{display:grid;grid-template-columns:48px 1fr 120px 180px 90px 140px;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:10px;align-items:center}
        .tbl-row{display:grid;grid-template-columns:48px 1fr 120px 180px 90px 140px;padding:11px 16px;border-bottom:1px solid #f1f5f9;align-items:center;gap:10px;transition:background 0.12s}
        .tbl-row:last-child{border-bottom:none}
        .tbl-row:hover{background:#fafbfc}
        .u-av{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0}
        .act-btn{font-size:11px;font-weight:600;padding:5px 10px;border-radius:7px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-family:inherit;color:#374151;transition:all 0.15s;white-space:nowrap}
        .act-btn:hover{border-color:#d97706;color:#d97706}
        .act-btn.danger:hover{border-color:#ef4444;color:#ef4444;background:#fef2f2}
        .act-btn.purple:hover{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff}

        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:20px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.2);display:flex;flex-direction:column}
        .modal-head{padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2}
        .modal-title{font-size:16px;font-weight:800;color:#0f172a}
        .mclose{width:30px;height:30px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:18px;color:#64748b;display:flex;align-items:center;justify-content:center;line-height:1}
        .mclose:hover{background:#e2e8f0}
        .modal-body{padding:22px;flex:1}
        .modal-foot{display:flex;gap:10px;padding:16px 22px;border-top:1px solid #f1f5f9;background:white;position:sticky;bottom:0}
        .btn-save{flex:1;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:11px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-save:disabled{opacity:0.55;cursor:not-allowed}
        .btn-cancel{background:#f1f5f9;color:#374151;border:none;border-radius:11px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-cancel:hover{background:#e2e8f0}

        .sec-div{font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:8px;border-bottom:1px solid #f1f5f9;margin:16px 0 14px}
        .sec-div:first-child{margin-top:0}
        .field{margin-bottom:12px}
        .fl{font-size:11px;font-weight:700;color:#374151;display:block;margin-bottom:5px}
        .req{color:#ef4444;margin-left:2px}
        .fi{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;transition:border-color 0.15s;background:white}
        .fi:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.08)}
        .fi::placeholder{color:#94a3b8}
        .frow2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

        .role-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:4px}
        .role-card{border:2px solid #e2e8f0;border-radius:11px;padding:12px 10px;cursor:pointer;text-align:center;transition:all 0.15s}
        .role-card:hover{border-color:#d97706}
        .role-card.selected{border-color:#d97706;background:#fffbf5}
        .role-card-icon{font-size:20px;margin-bottom:5px}
        .role-card-label{font-size:11px;font-weight:700;color:#374151}
        .role-card.selected .role-card-label{color:#d97706}

        .empty{padding:56px 0;text-align:center;color:#94a3b8}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}

        @media(max-width:900px){
          .tbl-head,.tbl-row{grid-template-columns:40px 1fr 110px 80px}
          .hide-md{display:none}
          .stats-row,.stats-row.super-admin{grid-template-columns:1fr 1fr}
        }
        @media(max-width:640px){
          .stats-row,.stats-row.super-admin{grid-template-columns:1fr}
        }
      `}</style>

      <div
        className={`stats-row ${user.role === 'super_admin' ? 'super-admin' : ''}`}
        style={user.role === 'admin' ? { gridTemplateColumns: 'repeat(5,minmax(0,1fr))' } : undefined}
      >
        {statCards.map((card) => (
          <div key={card.label} className={`stat-card ${card.className}`}>
            <div className="stat-top">
              <div className="stat-label">{card.label}</div>
              <div className="stat-icon">{card.icon}</div>
            </div>
            <div className="stat-val">{card.value}</div>
            <div className="stat-sub">{card.helper}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <input
          className="search-inp"
          placeholder="🔍 Нэр, имэйлээр хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className={`flt-btn ${!filterRole ? 'on' : ''}`} onClick={() => setFilterRole('')}>
          Бүгд ({users.length})
        </button>

        {visibleRoles.map((role) => (
          <button
            key={role.value}
            className={`flt-btn ${filterRole === role.value ? 'on' : ''}`}
            onClick={() => setFilterRole(filterRole === role.value ? '' : role.value)}
          >
            {role.label} ({users.filter((item) => item.role === role.value).length})
          </button>
        ))}
      </div>

      <div className="tbl">
        <div className="tbl-head">
          <div></div>
          <div>Нэр / Имэйл</div>
          <div className="hide-md">Утас</div>
          <div>Эрх</div>
          <div>Төлөв</div>
          <div>Үйлдэл</div>
        </div>

        {tableLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 180px 90px 140px', padding: '12px 16px', gap: 10, alignItems: 'center' }}>
              <div className="skel" style={{ width: 36, height: 36, borderRadius: 10 }} />
              {[140, 80, 110, 60, 100].map((width, innerIndex) => (
                <div key={innerIndex} className={`skel ${innerIndex === 1 ? 'hide-md' : ''}`} style={{ height: 13, width }} />
              ))}
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
            <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
              {search ? `"${search}" хайлтад тохирсон ажилтан байхгүй` : 'Ажилтан бүртгэгдээгүй байна'}
            </div>
            <div style={{ fontSize: 12 }}>Дээрх товчоор шинэ ажилтан бүртгэнэ үү</div>
          </div>
        ) : (
          filtered.map((item, index) => {
            const roleStyle = ROLE_COLORS[item.role] || { bg: '#f1f5f9', color: '#374151' };
            const color = avatarColors[index % avatarColors.length];

            return (
              <div key={item.id} className="tbl-row">
                <div>
                  <div className="u-av" style={{ background: color }}>
                    {item.first_name?.[0]}{item.last_name?.[0]}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.last_name} {item.first_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.email}</div>
                </div>

                <div className="hide-md" style={{ fontSize: 12, color: '#374151' }}>
                  {item.phone || '—'}
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: roleStyle.bg, color: roleStyle.color }}>
                    {ROLE_LABELS[item.role] || item.role}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: item.is_active ? '#dcfce7' : '#fee2e2', color: item.is_active ? '#166534' : '#991b1b' }}>
                    {item.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="act-btn purple" onClick={() => { setRoleModal(item); setNewRole(item.role); }}>
                    🔐 Эрх
                  </button>
                  <button className={`act-btn ${item.is_active ? 'danger' : ''}`} onClick={() => toggleActive(item.id, item.is_active)}>
                    {item.is_active ? 'Зогсоох' : 'Идэвхжүүлэх'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <div className="modal-bg" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{user.role === 'super_admin' ? 'Шинэ админ бүртгэх' : 'Шинэ ажилтан бүртгэх'}</div>
              <button className="mclose" onClick={() => { setShowForm(false); resetForm(); }}>×</button>
            </div>

            {successMsg ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '48px 22px' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Амжилттай бүртгэгдлээ!</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>{successMsg}</div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Нэвтрэх мэдээлэл:</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>📧 {form.email}</div>
                </div>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 11, padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Хаах
                </button>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <div className="sec-div">Олгох эрх</div>
                  <div className="role-grid">
                    {assignableRoles.map((role) => (
                      <div
                        key={role.value}
                        className={`role-card ${form.role === role.value ? 'selected' : ''}`}
                        onClick={() => setForm((prev) => ({ ...prev, role: role.value }))}
                      >
                        <div className="role-card-icon">
                          {role.value === 'accountant' ? '🧾' : role.value === 'order_processor' ? '📋' : '🔨'}
                        </div>
                        <div className="role-card-label">{role.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="sec-div">Хувийн мэдээлэл</div>

                  <div className="frow2">
                    <div className="field">
                      <label className="fl">Овог <span className="req">*</span></label>
                      <input className="fi" placeholder="Батбаяр" value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="fl">Нэр <span className="req">*</span></label>
                      <input className="fi" placeholder="Нарантуяа" value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
                    </div>
                  </div>

                  <div className="field">
                    <label className="fl">Имэйл <span className="req">*</span></label>
                    <input className="fi" type="email" placeholder="worker@company.mn" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>

                  <div className="frow2">
                    <div className="field">
                      <label className="fl">Утас</label>
                      <input className="fi" placeholder="+976 9900-0000" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="fl">Нууц үг</label>
                      <input className="fi" type="password" placeholder="Хоосон бол автомат үүснэ" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400e', marginTop: 4, lineHeight: 1.6 }}>
                    💡 Нууц үг хоосон орхивол автоматаар үүсгээд имэйлээр илгээнэ
                  </div>
                </div>

                <div className="modal-foot">
                  <button className="btn-cancel" onClick={() => { setShowForm(false); resetForm(); }}>Болих</button>
                  <button className="btn-save" onClick={handleCreate} disabled={saving}>
                    {saving ? '⏳ Бүртгэж байна...' : '👤 Ажилтан бүртгэх'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {roleModal && (
        <div className="modal-bg" onClick={() => setRoleModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">🔐 Эрх өөрчлөх</div>
              <button className="mclose" onClick={() => setRoleModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: '#f8fafc', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: avatarColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {roleModal.first_name?.[0]}{roleModal.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{roleModal.last_name} {roleModal.first_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{roleModal.email}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 10 }}>ШИНЭ ЭРХ СОНГОХ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assignableRoles.map((role) => (
                  <div
                    key={role.value}
                    onClick={() => setNewRole(role.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 11,
                      border: `2px solid ${newRole === role.value ? '#d97706' : '#e2e8f0'}`,
                      background: newRole === role.value ? '#fffbf5' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>
                      {role.value === 'accountant' ? '🧾' : role.value === 'order_processor' ? '📋' : '🔨'}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: newRole === role.value ? '#d97706' : '#0f172a' }}>{role.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {role.value === 'accountant' ? 'Материал, үйлчилгээ бүртгэнэ' : role.value === 'order_processor' ? 'Захиалга батлах, хуваарилах' : 'Захиалга гүйцэтгэх'}
                      </div>
                    </div>
                    {newRole === role.value && (
                      <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-cancel" onClick={() => setRoleModal(null)}>Болих</button>
              <button className="btn-save" onClick={handleChangeRole} disabled={roleSaving}>
                {roleSaving ? '⏳ Хадгалж байна...' : '✅ Эрх хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
