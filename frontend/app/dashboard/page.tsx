'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Супер Админ', admin: 'Админ', accountant: 'Нягтлан',
  order_processor: 'Захиалга боловсруулагч', worker: 'Ажилтан',
  customer: 'Хэрэглэгч', guest: 'Зочин',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#d97706', admin: '#2563eb', accountant: '#0891b2',
  order_processor: '#d97706', worker: '#059669', customer: '#db2777', guest: '#6b7280',
};

// ── SIDEBAR MENU (эрхээр тохируулагдсан) ─────────────────────────────────────
const ALL_MENUS = [
  // Хэрэглэгч
  { icon: '⊞', label: 'Хяналтын самбар', path: '/dashboard', roles: ['super_admin','admin','accountant','order_processor','worker','customer'], section: 'Үндсэн' },
  { icon: '📐', label: 'Тооцоолол',        path: '/calculate',  roles: ['customer'], section: 'Үндсэн' },
  { icon: '🛒', label: 'Миний захиалга',   path: '/my-orders',  roles: ['customer'], section: 'Үндсэн' },

  // Захиалга
  { icon: '📦', label: 'Захиалга',         path: '/orders',     roles: ['order_processor','admin','worker'], section: 'Захиалга', badge: true },

  // Материал & Үйлчилгээ — зөвхөн нягтлан
  { icon: '🪵', label: 'Материал',         path: '/materials',  roles: ['accountant'], section: 'Бараа' },
  { icon: '🔧', label: 'Үйлчилгээ',        path: '/services',   roles: ['accountant'], section: 'Бараа' },

  // Тохиргоо — super_admin
  { icon: '🪑', label: 'Тавилгын төрөл',   path: '/furniture-types',     roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '🗂️', label: 'Материал ангилал', path: '/material-categories', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '⚙️', label: 'Үйлчилгээний төрөл', path: '/service-types',    roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '🏢', label: 'Байгууллага',       path: '/organizations',       roles: ['super_admin'], section: 'Тохиргоо' },

  // Тохиргоо — admin
  { icon: '👥', label: 'Ажилтан удирдах',  path: '/users',      roles: ['admin'], section: 'Тохиргоо' },
  { icon: '🏢', label: 'Байгууллага',       path: '/organizations', roles: ['admin'], section: 'Тохиргоо' },

  // Тайлан
  { icon: '📊', label: 'Тайлан',           path: '/reports',    roles: ['admin','super_admin','accountant','order_processor'], section: 'Тайлан' },
  { icon: '📋', label: 'Лог',              path: '/audit-logs', roles: ['super_admin'], section: 'Тайлан' },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Хүлээгдэж байна', color: '#ca8a04', bg: '#fef9c3' },
  confirmed:   { label: 'Баталгаажсан',    color: '#2563eb', bg: '#dbeafe' },
  assigned:    { label: 'Хуваарилагдсан',  color: '#7c3aed', bg: '#f5f3ff' },
  in_progress: { label: 'Гүйцэтгэж байна', color: '#0891b2', bg: '#e0f2fe' },
  done:        { label: 'Дууссан',          color: '#059669', bg: '#dcfce7' },
  cancelled:   { label: 'Цуцлагдсан',      color: '#ef4444', bg: '#fee2e2' },
};

const avatarColors = ['#d97706','#059669','#7c3aed','#db2777','#0891b2','#ea580c'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, setAuth, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  // Stats
  const [saStats, setSaStats] = useState({ organizations: 0, users: 0, furniture_types: 0, calculations: 0 });
  const [stats, setStats] = useState({ orders: 0, income: 0, calculations: 0, done: 0 });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartData2, setChartData2] = useState<number[]>([]);

  // Admin-д зориулсан state
  const [orgInfo, setOrgInfo] = useState<any>(null);
  const [orgWorkers, setOrgWorkers] = useState<any[]>([]);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantRole, setGrantRole] = useState('accountant');
  const [grantLoading, setGrantLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setAuth(parsedUser, savedToken);
        setMounted(true);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/auth/login');
      }
    } else {
      router.push('/auth/login');
    }
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    loadStats();
  }, [mounted, user]);

  const loadStats = async () => {
    try {
      if (user?.role === 'super_admin') {
        const [statsRes, auditRes] = await Promise.all([
          api.get('/api/organizations/stats').catch(() => ({ data: { organizations:0, users:0, furniture_types:0, calculations:0 } })),
          api.get('/api/audit-logs').catch(() => ({ data: [] })),
        ]);
        setSaStats(statsRes.data);
        setRecentItems(auditRes.data.slice(0, 5));
        setChartData([8,12,9,15,18,14,22, statsRes.data.calculations||0]);
        setChartData2([3,5,4,8,10,7,12,15]);

      } else if (user?.role === 'admin') {
        const [ordersRes, calcRes, orgRes, usersRes] = await Promise.all([
          api.get('/api/reports/orders').catch(() => ({ data: { total:0, data:[] } })),
          api.get('/api/reports/calculations').catch(() => ({ data: { total:0 } })),
          api.get(`/api/organizations/${user.org_id}`).catch(() => ({ data: null })),
          api.get('/api/auth/workers').catch(() => ({ data: [] })),
        ]);
        const orders = ordersRes.data.data || [];
        const done = orders.filter((o:any) => o.status === 'done').length;
        const income = orders.reduce((s:number, o:any) => s + Number(o.total_amount||0), 0);
        setStats({ orders: ordersRes.data.total||0, income, calculations: calcRes.data.total||0, done });
        setRecentItems(orders.slice(0, 4));
        setOrgInfo(orgRes.data);
        setOrgWorkers(usersRes.data || []);
        setAllUsers(usersRes.data || []);
        setChartData([20,35,28,42,38,55,48,62]);
        setChartData2([15,28,20,35,30,44,38,50]);

      } else if (user?.role === 'customer') {
        const res = await api.get('/api/orders/my').catch(() => ({ data: [] }));
        const orders = res.data || [];
        setStats({ orders: orders.length, income: 0, calculations: 0, done: orders.filter((o:any) => o.status === 'done').length });
        setRecentItems(orders.slice(0, 4));

      } else {
        const [ordersRes] = await Promise.all([
          api.get('/api/reports/orders').catch(() => ({ data: { total:0, data:[] } })),
        ]);
        const orders = ordersRes.data.data || [];
        const done = orders.filter((o:any) => o.status === 'done').length;
        const income = orders.reduce((s:number, o:any) => s + Number(o.total_amount||0), 0);
        setStats({ orders: ordersRes.data.total||0, income, calculations: 0, done });
        setRecentItems(orders.slice(0, 4));
        setChartData([20,35,28,42,38,55,48,62]);
        setChartData2([15,28,20,35,30,44,38,50]);
      }
    } catch {}
  };

  // Chart
  useEffect(() => {
    if (!mounted || !chartData.length || !user) return;
    const isSA = user.role === 'super_admin';
    const existing = (window as any).__dashChart;
    if (existing) { existing.destroy(); (window as any).__dashChart = null; }
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    if (!canvas) return;
    const buildChart = () => {
      const chart = new (window as any).Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['1-р','2-р','3-р','4-р','5-р','6-р','7-р','8-р'],
          datasets: [
            { label: isSA ? 'Тооцоолол' : 'Захиалга', data: chartData, backgroundColor: '#d97706', borderRadius: 5, barPercentage: 0.5 },
            { label: isSA ? 'Захиалга' : 'Биелсэн', data: chartData2, backgroundColor: isSA ? '#a5b4fc' : '#fde68a', borderRadius: 5, barPercentage: 0.5 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 }, color: '#94a3b8' }, beginAtZero: true },
          },
        },
      });
      (window as any).__dashChart = chart;
    };
    if ((window as any).Chart) buildChart();
    else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = buildChart;
      document.head.appendChild(script);
    }
    return () => { if ((window as any).__dashChart) { (window as any).__dashChart.destroy(); (window as any).__dashChart = null; } };
  }, [chartData, chartData2, mounted, user]);

  // Эрх олгох
  const handleGrantRole = async () => {
    if (!grantUserId) return;
    setGrantLoading(true);
    try {
      await api.put(`/api/auth/users/${grantUserId}/role`, { role: grantRole });
      setShowGrantModal(false);
      setGrantUserId('');
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Алдаа гарлаа');
    } finally {
      setGrantLoading(false);
    }
  };

  if (!mounted || !user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const roleColor = ROLE_COLORS[user.role] || '#d97706';
  const visibleMenus = ALL_MENUS.filter(m => m.roles.includes(user.role));
  const sections = [...new Set(visibleMenus.map(m => m.section))];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        body{font-family:'Plus Jakarta Sans',sans-serif!important;margin:0}
        .db-root{display:flex;min-height:100vh;background:#f1f5f9}
        .sidebar{width:220px;min-width:220px;background:white;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;overflow-y:auto}
        .sb-brand{padding:18px 16px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #f1f5f9}
        .sb-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .sb-name{font-size:14px;font-weight:800;color:#0f172a}
        .sb-sub{font-size:10px;color:#94a3b8}
        .sb-sec{padding:14px 16px 4px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em}
        .sb-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;color:#64748b;font-size:12px;font-weight:500;transition:all 0.15s}
        .sb-item:hover{background:#f8fafc;color:#0f172a}
        .sb-item.active{background:#fef3c7;color:#d97706;font-weight:700}
        .sb-badge{margin-left:auto;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;background:#fee2e2;color:#ef4444}
        .main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .topnav{height:60px;background:white;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
        .nav-right{margin-left:auto;display:flex;align-items:center;gap:8px}
        .nav-btn{width:36px;height:36px;border-radius:10px;border:1px solid #e2e8f0;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#64748b;transition:all 0.15s}
        .nav-btn:hover{background:#f8fafc}
        .user-pill{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:5px 12px 5px 6px;cursor:pointer;position:relative;transition:all 0.15s}
        .user-pill:hover{border-color:#cbd5e1}
        .u-av{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
        .u-name{font-size:12px;font-weight:600;color:#0f172a}
        .u-role-txt{font-size:10px;font-weight:600}
        .dropdown{position:absolute;top:calc(100% + 8px);right:0;background:white;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.1);min-width:210px;overflow:hidden;z-index:200;animation:fadeIn 0.15s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .dd-head{padding:14px 16px;border-bottom:1px solid #f1f5f9;background:#fafafa}
        .dd-email{font-size:11px;color:#94a3b8;margin-top:2px}
        .dd-item{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;font-size:13px;color:#374151;font-weight:500;transition:background 0.1s}
        .dd-item:hover{background:#f8fafc}
        .dd-item.danger{color:#ef4444}
        .dd-item.danger:hover{background:#fef2f2}
        .page-content{padding:24px 28px 60px;flex:1}
        .page-title{font-size:20px;font-weight:800;color:#0f172a;margin-bottom:20px;letter-spacing:-0.01em}
        .stats-grid{display:grid;gap:14px;margin-bottom:18px}
        .stat-card{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px}
        .stat-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}
        .stat-label{font-size:12px;color:#64748b;font-weight:500}
        .stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
        .stat-val{font-size:26px;font-weight:800;color:#0f172a;margin-bottom:4px;line-height:1}
        .stat-sub{font-size:11px;font-weight:600;color:#059669}
        .card{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px}
        .card-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
        .card-title{font-size:14px;font-weight:700;color:#0f172a;margin-bottom:2px}
        .card-sub{font-size:11px;color:#94a3b8}
        .pill{font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;cursor:pointer}
        .qa-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;margin-bottom:6px}
        .qa-item:hover{background:#fef3c7;border-color:#fde68a}
        .qa-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
        .ord-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1f5f9}
        .ord-item:last-child{border-bottom:none}
        .ord-av{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
        .ord-name{font-size:12px;font-weight:600;color:#0f172a}
        .ord-sub{font-size:10px;color:#94a3b8;margin-top:1px}
        .ord-st{font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;display:inline-block;margin-top:3px}

        /* Worker card */
        .wk-card{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9}
        .wk-card:last-child{border-bottom:none}
        .wk-av{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0}

        /* Modal */
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:18px;width:100%;max-width:440px;box-shadow:0 24px 80px rgba(0,0,0,0.2)}
        .modal-head{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .modal-title{font-size:15px;font-weight:800;color:#0f172a}
        .mclose{width:28px;height:28px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:16px;color:#64748b;display:flex;align-items:center;justify-content:center}
        .modal-body{padding:20px}
        .fl{font-size:11px;font-weight:700;color:#374151;display:block;margin-bottom:5px}
        .fi{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;transition:border-color 0.15s;background:white;margin-bottom:12px}
        .fi:focus{border-color:#d97706}
        .btn-primary{background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%}
        .btn-primary:disabled{opacity:0.55;cursor:not-allowed}

        .legend-row{display:flex;gap:14px;margin-bottom:8px}
        .leg-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b}
        .leg-dot{width:10px;height:10px;border-radius:3px}
        .sys-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px}
        .sys-label{font-size:10px;color:#64748b;margin-bottom:4px}
        .sys-bar{height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-bottom:4px}
        .sys-fill{height:100%;border-radius:3px}
        .sys-val{font-size:12px;font-weight:700;color:#0f172a}

        @media(max-width:768px){.sidebar{display:none}.main{margin-left:0}.stats-grid{grid-template-columns:1fr 1fr!important}.page-content{padding:16px}}
      `}</style>

      <div className="db-root" onClick={() => setDropOpen(false)}>

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sb-brand">
            <div className="sb-logo">🪑</div>
            <div><div className="sb-name">FurniCalc</div><div className="sb-sub">Тооцооны систем</div></div>
          </div>

          {sections.map(section => (
            <div key={section}>
              <div className="sb-sec">{section}</div>
              {visibleMenus.filter(m => m.section === section).map(menu => (
                <div
                  key={menu.path}
                  className={`sb-item ${typeof window !== 'undefined' && window.location.pathname === menu.path ? 'active' : ''}`}
                  onClick={() => router.push(menu.path)}
                >
                  <span style={{ fontSize: 15 }}>{menu.icon}</span>
                  {menu.label}
                  {(menu as any).badge && stats.orders > 0 && (
                    <span className="sb-badge">{stats.orders}</span>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Sidebar доод хэсэг — хэрэглэгчийн мэдээлэл */}
          <div style={{ marginTop: 'auto', padding: '14px 12px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: '#f8fafc' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.last_name} {user.first_name}</div>
                <div style={{ fontSize: 10, color: roleColor, fontWeight: 600 }}>{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          <nav className="topnav">
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {user.role === 'super_admin' ? 'Супер Админы самбар' :
               user.role === 'admin' ? 'Админы самбар' :
               user.role === 'accountant' ? 'Нягтланы самбар' :
               user.role === 'order_processor' ? 'Захиалгын самбар' :
               user.role === 'worker' ? 'Ажилтны самбар' : 'Миний самбар'}
            </div>
            <div className="nav-right">
              <div className="nav-btn">🔔</div>
              <div className="user-pill" onClick={e => { e.stopPropagation(); setDropOpen(!dropOpen); }}>
                <div className="u-av" style={{ background: roleColor }}>
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div>
                  <div className="u-name">{user.last_name} {user.first_name}</div>
                  <div className="u-role-txt" style={{ color: roleColor }}>{ROLE_LABELS[user.role]}</div>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>▾</span>
                {dropOpen && (
                  <div className="dropdown" onClick={e => e.stopPropagation()}>
                    <div className="dd-head">
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{user.last_name} {user.first_name}</div>
                      <div className="dd-email">{user.email}</div>
                      <div style={{ marginTop: 8, display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: 'white', background: roleColor }}>
                        {ROLE_LABELS[user.role]}
                      </div>
                    </div>
                    <div className="dd-item danger" onClick={() => { logout(); router.push('/auth/login'); }}>
                      🚪 Системээс гарах
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          <div className="page-content">

            {/* ════════════════════════════════════════
                SUPER ADMIN
            ════════════════════════════════════════ */}
            {user.role === 'super_admin' && (
              <>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                  {[
                    { label: 'Байгууллага',         val: saStats.organizations,  icon: '🏢', bg: '#fef3c7' },
                    { label: 'Тавилгын төрөл',      val: saStats.furniture_types, icon: '🪑', bg: '#fef3c7' },
                    { label: 'Нийт хэрэглэгч',      val: saStats.users,          icon: '👥', bg: '#dcfce7' },
                    { label: 'Тооцоолол хийгдсэн',  val: saStats.calculations,   icon: '📐', bg: '#fef9c3' },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-top">
                        <span className="stat-label">{s.label}</span>
                        <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                      </div>
                      <div className="stat-val">{s.val}</div>
                      <div className="stat-sub">▲ Нийт тоо</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {/* Түргэн үйлдлүүд */}
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">⚡ Түргэн үйлдлүүд</div><div className="card-sub">Байнга хэрэглэдэг үйлдлүүд</div></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { icon:'🏢', label:'Байгууллага нэмэх', path:'/organizations', bg:'#fef3c7' },
                        { icon:'🪑', label:'Тавилга нэмэх',     path:'/furniture-types', bg:'#dcfce7' },
                        { icon:'🗂️', label:'Ангилал нэмэх',     path:'/material-categories', bg:'#fef9c3' },
                        { icon:'⚙️', label:'Үйлчилгээний төрөл', path:'/service-types', bg:'#fee2e2' },
                        { icon:'📊', label:'Тайлан харах',       path:'/reports', bg:'#f0fdf4' },
                        { icon:'📋', label:'Лог харах',          path:'/audit-logs', bg:'#f0f9ff' },
                      ].map(item => (
                        <div key={item.path} className="qa-item" style={{ marginBottom: 0 }} onClick={() => router.push(item.path)}>
                          <div className="qa-icon" style={{ background: item.bg }}>{item.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Системийн төлөв */}
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">🖥️ Системийн төлөв</div><div className="card-sub">Бодит цагийн мэдээлэл</div></div>
                      <span className="pill" style={{ background: '#dcfce7', color: '#166534' }}>● Ажиллаж байна</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'CPU', val: 34, color: '#d97706' },
                        { label: 'RAM', val: 61, color: '#f59e0b' },
                        { label: 'Disk', val: 22, color: '#059669' },
                      ].map(s => (
                        <div key={s.label} className="sys-card">
                          <div className="sys-label">{s.label}</div>
                          <div className="sys-bar"><div className="sys-fill" style={{ width: `${s.val}%`, background: s.color }} /></div>
                          <div className="sys-val">{s.val}%</div>
                        </div>
                      ))}
                    </div>
                    {[
                      { label: 'Сервер uptime', val: '99.8%', color: '#059669' },
                      { label: 'DB холболт',    val: 'Идэвхтэй', color: '#059669' },
                      { label: 'API дундаж',    val: '142ms', color: '#0f172a' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                        <span>{r.label}</span>
                        <span style={{ fontWeight: 700, color: r.color }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* График + Лог */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">📈 Тооцооллын график</div><div className="card-sub">Сарын тооцооллын тоо</div></div>
                    </div>
                    <div className="legend-row">
                      <div className="leg-item"><div className="leg-dot" style={{ background: '#d97706' }} />Тооцоолол</div>
                      <div className="leg-item"><div className="leg-dot" style={{ background: '#a5b4fc' }} />Захиалга</div>
                    </div>
                    <div style={{ position: 'relative', height: 200 }}>
                      <canvas id="barChart" />
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">📋 Сүүлийн логууд</div><div className="card-sub">Системийн өөрчлөлтүүд</div></div>
                      <span className="pill" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => router.push('/audit-logs')}>Бүгд →</span>
                    </div>
                    {recentItems.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>Лог байхгүй байна</div>}
                    {recentItems.map((log: any, i: number) => {
                      const ac = log.action === 'CREATE' ? { bg: '#dcfce7', color: '#166534' }
                        : log.action === 'UPDATE' ? { bg: '#fef9c3', color: '#92400e' }
                        : log.action === 'DELETE' ? { bg: '#fee2e2', color: '#991b1b' }
                        : { bg: '#f1f5f9', color: '#475569' };
                      return (
                        <div key={i} className="ord-item">
                          <div className="ord-av" style={{ background: avatarColors[i % avatarColors.length] }}>{log.action?.[0] || 'L'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="ord-name">{log.action} — {log.table_name}</div>
                            <div className="ord-sub">{new Date(log.created_at).toLocaleString('mn-MN')}</div>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: ac.bg, color: ac.color }}>{log.action}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════
                ADMIN
            ════════════════════════════════════════ */}
            {user.role === 'admin' && (
              <>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                  {[
                    { label: 'Нийт захиалга',  val: stats.orders,      icon: '📦', bg: '#fef3c7' },
                    { label: 'Нийт орлого',    val: `₮${(stats.income/1000000).toFixed(1)}M`, icon: '💰', bg: '#fef9c3' },
                    { label: 'Тооцоолол',      val: stats.calculations, icon: '📐', bg: '#f0fdf4' },
                    { label: 'Биелэсэн',       val: stats.done,         icon: '✅', bg: '#dcfce7' },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-top">
                        <span className="stat-label">{s.label}</span>
                        <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                      </div>
                      <div className="stat-val">{s.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

                  {/* Байгууллагын мэдээлэл */}
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">🏢 Байгууллагын мэдээлэл</div><div className="card-sub">Танай байгууллагын дэлгэрэнгүй</div></div>
                      <button onClick={() => router.push('/organizations')} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Засах →
                      </button>
                    </div>
                    {orgInfo ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, padding: '12px', background: '#f8fafc', borderRadius: 12 }}>
                          {orgInfo.image_url ? (
                            <img src={orgInfo.image_url} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #e2e8f0' }} />
                          ) : (
                            <div style={{ width: 52, height: 52, borderRadius: 12, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white' }}>
                              {orgInfo.name?.slice(0,2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{orgInfo.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{orgInfo.address || '—'}</div>
                          </div>
                        </div>
                        {[
                          { label: 'Утас',      val: orgInfo.phone || '—' },
                          { label: 'Хаяг',      val: orgInfo.address || '—' },
                          { label: 'Төлөв',     val: orgInfo.is_active ? '✅ Идэвхтэй' : '❌ Идэвхгүй' },
                          { label: 'Бүртгэсэн', val: orgInfo.created_at ? new Date(orgInfo.created_at).toLocaleDateString('mn-MN') : '—' },
                        ].map(r => (
                          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ color: '#64748b' }}>{r.label}</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.val}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>Байгууллагын мэдээлэл байхгүй</div>
                    )}
                  </div>

                  {/* Ажилтан удирдах + Эрх олгох */}
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">👥 Ажилтан удирдах</div><div className="card-sub">{orgWorkers.length} ажилтан бүртгэлтэй</div></div>
                      <button
                        onClick={() => setShowGrantModal(true)}
                        style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        + Эрх олгох
                      </button>
                    </div>

                    {/* Ажилтны жагсаалт */}
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {orgWorkers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>
                          Ажилтан бүртгэгдээгүй байна
                        </div>
                      ) : orgWorkers.map((w: any, i: number) => {
                        const roleStyle: Record<string, { bg: string; color: string }> = {
                          admin:           { bg: '#eff6ff', color: '#1d4ed8' },
                          accountant:      { bg: '#f0fdf4', color: '#15803d' },
                          order_processor: { bg: '#fef3c7', color: '#b45309' },
                          worker:          { bg: '#f5f3ff', color: '#7c3aed' },
                        };
                        const rs = roleStyle[w.role] || { bg: '#f1f5f9', color: '#374151' };
                        return (
                          <div key={w.id} className="wk-card">
                            <div className="wk-av" style={{ background: avatarColors[i % avatarColors.length] }}>
                              {w.first_name?.[0]}{w.last_name?.[0]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{w.last_name} {w.first_name}</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>{w.email}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: rs.bg, color: rs.color }}>
                                {ROLE_LABELS[w.role] || w.role}
                              </span>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: w.is_active ? '#dcfce7' : '#fee2e2', color: w.is_active ? '#166534' : '#991b1b' }}>
                                {w.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button onClick={() => router.push('/users')} style={{ width: '100%', marginTop: 12, background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 9, padding: '9px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Бүх ажилтан харах →
                    </button>
                  </div>
                </div>

                {/* График + Захиалга */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">📈 Захиалгын график</div><div className="card-sub">Сарын захиалгын тоо</div></div>
                      <button onClick={() => router.push('/reports')} style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Тайлан →
                      </button>
                    </div>
                    <div className="legend-row">
                      <div className="leg-item"><div className="leg-dot" style={{ background: '#d97706' }} />Захиалга</div>
                      <div className="leg-item"><div className="leg-dot" style={{ background: '#fde68a' }} />Биелсэн</div>
                    </div>
                    <div style={{ position: 'relative', height: 180 }}>
                      <canvas id="barChart" />
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">📦 Сүүлийн захиалгууд</div><div className="card-sub">{recentItems.length} захиалга</div></div>
                      <span className="pill" style={{ background: '#fef3c7', color: '#92400e' }} onClick={() => router.push('/orders')}>Бүгд →</span>
                    </div>
                    {recentItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>Захиалга байхгүй</div>
                    ) : recentItems.map((o: any, i: number) => (
                      <div key={i} className="ord-item">
                        <div className="ord-av" style={{ background: avatarColors[i % avatarColors.length] }}>
                          {o.customer?.split(' ').map((w:string)=>w[0]).join('').slice(0,2) || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ord-name">{o.customer || '—'}</div>
                          <div className="ord-sub">{o.furniture || 'Тавилга'}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>₮{Number(o.total_amount||0).toLocaleString()}</div>
                          <div className="ord-st" style={{ background: STATUS_LABELS[o.status]?.bg||'#f1f5f9', color: STATUS_LABELS[o.status]?.color||'#64748b' }}>
                            {STATUS_LABELS[o.status]?.label||o.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════
                ACCOUNTANT
            ════════════════════════════════════════ */}
            {user.role === 'accountant' && (
              <>
                <div style={{ background: 'linear-gradient(135deg,#1c1917,#292524)', borderRadius: 18, padding: '22px 26px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle,rgba(217,119,6,0.2),transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 6 }}>{user.last_name} {user.first_name}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.4)', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                    🧾 Нягтланы эрхээр нэвтэрсэн
                  </div>
                </div>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 18 }}>
                  {[
                    { label: 'Нийт орлого',    val: `₮${(stats.income/1000000).toFixed(1)}M`, icon: '💰', bg: '#fef9c3' },
                    { label: 'Нийт захиалга',  val: stats.orders, icon: '📦', bg: '#fef3c7' },
                    { label: 'Биелэсэн',       val: stats.done,   icon: '✅', bg: '#dcfce7' },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-top"><span className="stat-label">{s.label}</span><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div></div>
                      <div className="stat-val">{s.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="card">
                    <div className="card-hd"><div><div className="card-title">🪵 Материал удирдах</div><div className="card-sub">Үнэ, нөөц бүртгэх</div></div></div>
                    {[
                      { icon:'🪵', label:'Материал нэмэх / засах', path:'/materials', bg:'#fef3c7' },
                      { icon:'🔧', label:'Үйлчилгээ нэмэх / засах', path:'/services', bg:'#fef9c3' },
                      { icon:'💰', label:'Үнэ шинэчлэх', path:'/materials', bg:'#dcfce7' },
                    ].map(item => (
                      <div key={item.label} className="qa-item" onClick={() => router.push(item.path)}>
                        <div className="qa-icon" style={{ background: item.bg }}>{item.icon}</div>
                        <div><div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{item.label}</div></div>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#d97706' }}>→</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div className="card-hd"><div><div className="card-title">📊 Санхүүгийн тайлан</div><div className="card-sub">Орлого, зарлагын дүн шинжилгээ</div></div></div>
                    {[
                      { icon:'💰', label:'Санхүүгийн тайлан', path:'/reports', bg:'#fef9c3' },
                      { icon:'🪵', label:'Материалын тайлан',  path:'/reports', bg:'#fef3c7' },
                      { icon:'📥', label:'Excel татах',         path:'/reports', bg:'#dcfce7' },
                    ].map(item => (
                      <div key={item.label} className="qa-item" onClick={() => router.push(item.path)}>
                        <div className="qa-icon" style={{ background: item.bg }}>{item.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#d97706' }}>→</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════
                ORDER PROCESSOR
            ════════════════════════════════════════ */}
            {user.role === 'order_processor' && (
              <>
                <div style={{ background: 'linear-gradient(135deg,#1c1917,#292524)', borderRadius: 18, padding: '22px 26px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle,rgba(217,119,6,0.2),transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 6 }}>{user.last_name} {user.first_name}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.4)', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                    📋 Захиалга боловсруулагч
                  </div>
                </div>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
                  {[
                    { label: 'Нийт захиалга',      val: stats.orders, icon: '📦', bg: '#fef3c7' },
                    { label: 'Хүлээгдэж байна',    val: recentItems.filter((o:any)=>o.status==='pending').length, icon: '⏳', bg: '#fef9c3' },
                    { label: 'Гүйцэтгэж байна',    val: recentItems.filter((o:any)=>o.status==='in_progress').length, icon: '🔄', bg: '#dbeafe' },
                    { label: 'Дууссан',             val: stats.done, icon: '✅', bg: '#dcfce7' },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-top"><span className="stat-label">{s.label}</span><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div></div>
                      <div className="stat-val">{s.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">📦 Захиалга удирдах</div><div className="card-sub">Батлах, хуваарилах, хянах</div></div>
                      <button onClick={() => router.push('/orders')} style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Бүгд харах</button>
                    </div>
                    {recentItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>Захиалга байхгүй байна</div>
                    ) : recentItems.map((o:any, i:number) => (
                      <div key={i} className="ord-item" style={{ cursor: 'pointer' }} onClick={() => router.push('/orders')}>
                        <div className="ord-av" style={{ background: avatarColors[i%avatarColors.length] }}>{o.customer?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'?'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}><div className="ord-name">{o.customer||'—'}</div><div className="ord-sub">{o.furniture||'Тавилга'}</div></div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>₮{Number(o.total_amount||0).toLocaleString()}</div>
                          <div className="ord-st" style={{ background: STATUS_LABELS[o.status]?.bg||'#f1f5f9', color: STATUS_LABELS[o.status]?.color||'#64748b' }}>{STATUS_LABELS[o.status]?.label||o.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div className="card-hd"><div><div className="card-title">⚡ Түргэн үйлдлүүд</div></div></div>
                    {[
                      { icon:'✅', label:'Захиалга батлах',      path:'/orders', bg:'#dcfce7' },
                      { icon:'👷', label:'Ажилтанд хуваарилах', path:'/orders', bg:'#fef3c7' },
                      { icon:'📊', label:'Захиалгын тайлан',     path:'/reports', bg:'#fef9c3' },
                      { icon:'🔍', label:'Захиалга хайх',        path:'/orders', bg:'#f0f9ff' },
                    ].map(item => (
                      <div key={item.label} className="qa-item" onClick={() => router.push(item.path)}>
                        <div className="qa-icon" style={{ background: item.bg }}>{item.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════════════════════
                WORKER
            ════════════════════════════════════════ */}
            {user.role === 'worker' && (
              <>
                <div style={{ background: 'linear-gradient(135deg,#1c1917,#292524)', borderRadius: 18, padding: '22px 26px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle,rgba(217,119,6,0.2),transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 6 }}>{user.last_name} {user.first_name}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.4)', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                    🔨 Ажилтан
                  </div>
                </div>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 18 }}>
                  {[
                    { label: 'Миний захиалга',    val: stats.orders, icon: '📦', bg: '#fef3c7' },
                    { label: 'Гүйцэтгэж байна',  val: recentItems.filter((o:any)=>o.status==='in_progress').length, icon: '🔄', bg: '#dbeafe' },
                    { label: 'Дууссан',           val: stats.done, icon: '✅', bg: '#dcfce7' },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-top"><span className="stat-label">{s.label}</span><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div></div>
                      <div className="stat-val">{s.val}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-hd">
                    <div><div className="card-title">📦 Миний захиалгууд</div><div className="card-sub">Оноогдсон захиалгуудыг гүйцэтгэх</div></div>
                    <button onClick={() => router.push('/orders')} style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Бүгд харах</button>
                  </div>
                  {recentItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Захиалга байхгүй байна</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Танд одоогоор захиалга оногдоогүй байна</div>
                    </div>
                  ) : recentItems.map((o:any, i:number) => (
                    <div key={i} className="ord-item" style={{ cursor: 'pointer' }} onClick={() => router.push('/orders')}>
                      <div className="ord-av" style={{ background: avatarColors[i%avatarColors.length] }}>{o.customer?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)||'?'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><div className="ord-name">{o.customer||'—'}</div><div className="ord-sub">{o.furniture||'Тавилга'} · {new Date(o.created_at).toLocaleDateString('mn-MN')}</div></div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>₮{Number(o.total_amount||0).toLocaleString()}</div>
                        <div className="ord-st" style={{ background: STATUS_LABELS[o.status]?.bg||'#f1f5f9', color: STATUS_LABELS[o.status]?.color||'#64748b' }}>{STATUS_LABELS[o.status]?.label||o.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ════════════════════════════════════════
                CUSTOMER
            ════════════════════════════════════════ */}
            {user.role === 'customer' && (
              <>
                <div style={{ background: 'linear-gradient(135deg,#fffbf5,#fef3c7)', borderRadius: 18, padding: '28px', marginBottom: 18, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1917', marginBottom: 6 }}>Сайн байна уу, {user.first_name}!</div>
                  <div style={{ fontSize: 13, color: '#78716c', marginBottom: 18 }}>Тавилгын материалыг тооцоолж, захиалга өгөөрэй</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => router.push('/calculate')} style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 11, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📐 Тооцоолол хийх</button>
                    <button onClick={() => router.push('/my-orders')} style={{ background: 'white', color: '#1c1917', border: '1.5px solid #e7e5e4', borderRadius: 11, padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📦 Миний захиалгууд</button>
                  </div>
                </div>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 18 }}>
                  {[
                    { label: 'Нийт захиалга', val: stats.orders, icon: '📦', bg: '#fef3c7' },
                    { label: 'Биелэсэн',      val: stats.done,   icon: '✅', bg: '#dcfce7' },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-top"><span className="stat-label">{s.label}</span><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div></div>
                      <div className="stat-val">{s.val}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-hd">
                    <div><div className="card-title">📦 Сүүлийн захиалгууд</div></div>
                    <span className="pill" style={{ background: '#fef3c7', color: '#92400e' }} onClick={() => router.push('/my-orders')}>Бүгд →</span>
                  </div>
                  {recentItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>Захиалга байхгүй байна</div>
                  ) : recentItems.map((o:any, i:number) => (
                    <div key={i} className="ord-item">
                      <div className="ord-av" style={{ background: avatarColors[i%avatarColors.length] }}>#{o.id}</div>
                      <div style={{ flex: 1 }}><div className="ord-name">{o.order_no||`Захиалга #${o.id}`}</div><div className="ord-sub">{new Date(o.created_at).toLocaleDateString('mn-MN')}</div></div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>₮{Number(o.total_amount||0).toLocaleString()}</div>
                        <div className="ord-st" style={{ background: STATUS_LABELS[o.status]?.bg||'#f1f5f9', color: STATUS_LABELS[o.status]?.color||'#64748b' }}>{STATUS_LABELS[o.status]?.label||o.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ════ ЭРХ ОЛГОХ MODAL ════ */}
      {showGrantModal && (
        <div className="modal-bg" onClick={() => setShowGrantModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">👥 Ажилтанд эрх олгох</div>
              <button className="mclose" onClick={() => setShowGrantModal(false)} style={{ width:28,height:28,borderRadius:'50%',border:'none',background:'#f1f5f9',cursor:'pointer',fontSize:16,color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 16, lineHeight: 1.6 }}>
                💡 Ажилтанд эрх олгосноор тэд дашбоардад нэвтрэх боломжтой болно
              </div>
              <label className="fl">Ажилтан сонгох</label>
              <select className="fi" value={grantUserId} onChange={e => setGrantUserId(e.target.value)} style={{ background: 'white' }}>
                <option value="">— Ажилтан сонгоно уу —</option>
                {allUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.last_name} {u.first_name} ({u.email})</option>
                ))}
              </select>
              <label className="fl">Олгох эрх</label>
              <select className="fi" value={grantRole} onChange={e => setGrantRole(e.target.value)} style={{ background: 'white' }}>
                <option value="accountant">🧾 Нягтлан</option>
                <option value="order_processor">📋 Захиалга боловсруулагч</option>
                <option value="worker">🔨 Ажилтан</option>
              </select>
              <button className="btn-primary" onClick={handleGrantRole} disabled={!grantUserId || grantLoading}>
                {grantLoading ? '⏳ Хадгалж байна...' : '✅ Эрх олгох'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}