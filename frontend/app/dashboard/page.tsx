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

const ALL_MENUS = [
  { icon: '⊞', label: 'Хяналтын самбар', path: '/dashboard', roles: ['super_admin','admin','accountant','order_processor','worker','customer'], section: 'Цэс' },
  { icon: '📐', label: 'Тооцоолол', path: '/calculate', roles: ['customer'], section: 'Цэс' },
  { icon: '📦', label: 'Захиалга', path: '/orders', roles: ['order_processor','admin','worker'], section: 'Цэс', badge: true },
  { icon: '🪵', label: 'Материал', path: '/materials', roles: ['accountant','admin'], section: 'Цэс' },
  { icon: '🔧', label: 'Үйлчилгээ', path: '/services', roles: ['accountant','admin'], section: 'Цэс' },
  { icon: '🛒', label: 'Миний захиалга', path: '/my-orders', roles: ['customer'], section: 'Цэс' },
  { icon: '🪑', label: 'Тавилгын төрөл', path: '/furniture-types', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '🗂️', label: 'Материал ангилал', path: '/material-categories', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '⚙️', label: 'Үйлчилгээний төрөл', path: '/service-types', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '👥', label: 'Хэрэглэгч', path: '/users', roles: ['admin'], section: 'Тохиргоо' },
  { icon: '🏢', label: 'Байгууллага', path: '/organizations', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '📊', label: 'Тайлан', path: '/reports', roles: ['admin','super_admin','accountant','order_processor'], section: 'Тайлан' },
  { icon: '📋', label: 'Лог', path: '/audit-logs', roles: ['super_admin'], section: 'Тайлан' },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Хүлээгдэж байна', color: '#ca8a04', bg: '#fef9c3' },
  confirmed:   { label: 'Баталгаажсан',    color: '#2563eb', bg: '#fef3c7' },
  assigned:    { label: 'Хуваарилагдсан',  color: '#7c3aed', bg: '#fef3c7' },
  in_progress: { label: 'Гүйцэтгэж байна', color: '#2563eb', bg: '#fef3c7' },
  done:        { label: 'Дууссан',          color: '#059669', bg: '#dcfce7' },
  cancelled:   { label: 'Цуцлагдсан',      color: '#ef4444', bg: '#fee2e2' },
};

const avatarColors = ['#d97706','#059669','#d97706','#db2777','#0891b2','#7c3aed'];

const QUICK_ACTIONS = [
  { icon: '🏢', label: 'Байгууллага нэмэх', sub: 'Шинэ харилцагч', path: '/organizations', bg: '#fef3c7' },
  { icon: '🪑', label: 'Тавилга нэмэх', sub: 'Төрөл, томьёо', path: '/furniture-types', bg: '#dcfce7' },
  { icon: '🗂️', label: 'Ангилал нэмэх', sub: 'Материал, үйлчилгээ', path: '/material-categories', bg: '#fef9c3' },
  { icon: '⚙️', label: 'Үйлчилгээний төрөл', sub: 'Зүсэлт, ирмэг', path: '/service-types', bg: '#fee2e2' },
  { icon: '📊', label: 'Тайлан харах', sub: 'Excel татах', path: '/reports', bg: '#f0fdf4' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, setAuth, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [saStats, setSaStats] = useState({ organizations: 0, users: 0, furniture_types: 0, calculations: 0 });
  const [stats, setStats] = useState({ orders: 0, income: 0, calculations: 0, done: 0 });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartData2, setChartData2] = useState<number[]>([]);

  // Auth
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

  // Load stats
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
    } else if (user?.role === 'customer') {
      // Customer-т захиалгын өөрийн мэдээлэл
      const res = await api.get('/api/orders/my').catch(() => ({ data: [] }));
      const orders = res.data || [];
      const done = orders.filter((o:any) => o.status === 'done').length;
      setStats({ orders: orders.length, income: 0, calculations: 0, done });
      setRecentItems(orders.slice(0, 4));
    } else {
      const [ordersRes, calcRes] = await Promise.all([
        api.get('/api/reports/orders').catch(() => ({ data: { total:0, data:[] } })),
        api.get('/api/reports/calculations').catch(() => ({ data: { total:0 } })),
      ]);
      const orders = ordersRes.data.data || [];
      const done = orders.filter((o:any) => o.status === 'done').length;
      const income = orders.reduce((s:number, o:any) => s + Number(o.total_amount||0), 0);
      setStats({ orders: ordersRes.data.total||0, income, calculations: calcRes.data.total||0, done });
      setRecentItems(orders.slice(0, 4));
      setChartData([20,35,28,42,38,55,48,62]);
      setChartData2([15,28,20,35,30,44,38,50]);
    }
  } catch {}
};

  // Chart — useEffect-д isSuperAdmin ашиглахын тулд user?.role-г шалгана
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
            {
              label: isSA ? 'Тооцоолол' : 'Захиалга',
              data: chartData,
              backgroundColor: '#d97706',
              borderRadius: 5,
              barPercentage: 0.5,
            },
            {
              label: isSA ? 'Захиалга болсон' : 'Биелсэн',
              data: chartData2,
              backgroundColor: isSA ? '#a5b4fc' : '#fde68a',
              borderRadius: 5,
              barPercentage: 0.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8', autoSkip: false, maxRotation: 0 } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 }, color: '#94a3b8' }, beginAtZero: true },
          },
        },
      });
      (window as any).__dashChart = chart;
    };

    if ((window as any).Chart) {
      buildChart();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = buildChart;
      document.head.appendChild(script);
    }

    return () => {
      if ((window as any).__dashChart) {
        (window as any).__dashChart.destroy();
        (window as any).__dashChart = null;
      }
    };
  }, [chartData, chartData2, mounted, user]);

  if (!mounted || !user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const roleColor = ROLE_COLORS[user.role] || '#d97706';
  const visibleMenus = ALL_MENUS.filter(m => m.roles.includes(user.role));
  const sections = [...new Set(visibleMenus.map(m => m.section))];
  const isSuperAdmin = user.role === 'super_admin';
  const isOtherAdmin = ['admin','accountant','order_processor'].includes(user.role);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        body{font-family:'Plus Jakarta Sans',sans-serif!important;margin:0}
        .db-root{display:flex;min-height:100vh;background:#f1f5f9;font-family:'Plus Jakarta Sans',sans-serif}
        .sidebar{width:220px;min-width:220px;background:white;border-right:0.5px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;overflow-y:auto}
        .sb-brand{padding:18px 16px 16px;display:flex;align-items:center;gap:10px;border-bottom:0.5px solid #f1f5f9}
        .sb-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#d97706,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .sb-name{font-size:14px;font-weight:700;color:#0f172a;line-height:1.2}
        .sb-sub{font-size:10px;color:#94a3b8;font-weight:400}
        .sb-sec{padding:14px 16px 4px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em}
        .sb-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;color:#64748b;font-size:12px;font-weight:500;transition:all 0.15s}
        .sb-item:hover{background:#f8fafc;color:#0f172a}
        .sb-item.active{background:#fef3c7;color:#d97706;font-weight:600}
        .sb-badge{margin-left:auto;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;background:#fee2e2;color:#ef4444}
        .main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .topnav{height:60px;background:white;border-bottom:0.5px solid #e2e8f0;display:flex;align-items:center;padding:0 24px;gap:12px;position:sticky;top:0;z-index:40;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
        .search-box{display:flex;align-items:center;gap:8px;background:#f8fafc;border:0.5px solid #e2e8f0;border-radius:10px;padding:7px 14px;flex:1;max-width:320px}
        .search-box input{background:none;border:none;outline:none;font-size:13px;color:#0f172a;width:100%;font-family:'Plus Jakarta Sans',sans-serif}
        .search-box input::placeholder{color:#94a3b8}
        .nav-right{margin-left:auto;display:flex;align-items:center;gap:6px}
        .nav-btn{width:36px;height:36px;border-radius:10px;border:0.5px solid #e2e8f0;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#64748b;transition:all 0.15s}
        .nav-btn:hover{background:#f8fafc}
        .user-pill{display:flex;align-items:center;gap:9px;background:#f8fafc;border:0.5px solid #e2e8f0;border-radius:12px;padding:5px 12px 5px 6px;cursor:pointer;position:relative;transition:all 0.15s}
        .user-pill:hover{border-color:#cbd5e1}
        .u-avatar{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
        .u-name{font-size:12px;font-weight:600;color:#0f172a}
        .u-role{font-size:10px;font-weight:600}
        .dropdown{position:absolute;top:calc(100% + 8px);right:0;background:white;border:0.5px solid #e2e8f0;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.1);min-width:210px;overflow:hidden;z-index:200;animation:fadeIn 0.15s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .dd-head{padding:14px 16px;border-bottom:0.5px solid #f1f5f9;background:#fafafa}
        .dd-email{font-size:11px;color:#94a3b8;margin-top:2px}
        .dd-item{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;font-size:13px;color:#374151;font-weight:500;transition:background 0.1s}
        .dd-item:hover{background:#f8fafc}
        .dd-item.danger{color:#ef4444}
        .dd-item.danger:hover{background:#fef2f2}
        .page-content{padding:28px 28px 60px;flex:1}
        .stats-grid{display:grid;gap:14px;margin-bottom:16px}
        .stat-card{background:white;border:0.5px solid #e2e8f0;border-radius:14px;padding:18px}
        .stat-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
        .stat-label{font-size:12px;color:#64748b;font-weight:500}
        .stat-icon-wrap{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
        .stat-val{font-size:26px;font-weight:700;color:#0f172a;margin-bottom:6px;line-height:1}
        .stat-chg{font-size:11px;font-weight:600}
        .chg-up{color:#059669}
        .card{background:white;border:0.5px solid #e2e8f0;border-radius:14px;padding:18px}
        .card-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
        .card-title{font-size:14px;font-weight:700;color:#0f172a;margin-bottom:2px}
        .card-sub{font-size:11px;color:#94a3b8}
        .pill{font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px}
        .ord-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:0.5px solid #f1f5f9}
        .ord-item:last-child{border-bottom:none;padding-bottom:0}
        .ord-avatar{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
        .ord-name{font-size:12px;font-weight:600;color:#0f172a}
        .ord-type{font-size:10px;color:#94a3b8;margin-top:1px}
        .ord-amt{font-size:12px;font-weight:700;color:#0f172a;text-align:right}
        .ord-st{font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;margin-top:3px;display:inline-block}
        .legend-row{display:flex;gap:14px;margin-bottom:10px}
        .leg-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b}
        .leg-dot{width:10px;height:10px;border-radius:3px}
        .qa-item{background:#f8fafc;border:0.5px solid #e2e8f0;border-radius:9px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s}
        .qa-item:hover{background:#fef3c7;border-color:#fde68a}
        .qa-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
        .sys-card{background:#f8fafc;border:0.5px solid #e2e8f0;border-radius:9px;padding:10px}
        .sys-label{font-size:10px;color:#64748b;margin-bottom:4px}
        .sys-bar{height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-bottom:4px}
        .sys-fill{height:100%;border-radius:3px}
        .sys-val{font-size:12px;font-weight:700;color:#0f172a}
        @media(max-width:768px){
          .sidebar{transform:translateX(-100%);transition:transform 0.25s}
          .main{margin-left:0}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .page-content{padding:16px 16px 40px}
        }
      `}</style>

      <div className="db-root" onClick={() => setDropOpen(false)}>

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-brand">
            <div className="sb-logo">🪑</div>
            <div>
              <div className="sb-name">FurniCalc</div>
              <div className="sb-sub">Тооцооны систем</div>
            </div>
          </div>
          {sections.map(section => (
            <div key={section}>
              <div className="sb-sec">{section}</div>
              {visibleMenus.filter(m => m.section === section).map(menu => (
                <div
                  key={menu.path}
                  className={`sb-item ${menu.path === '/dashboard' ? 'active' : ''}`}
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
        </aside>

        {/* MAIN */}
        <div className="main">
          <nav className="topnav">
            <div className="nav-right">
              <div className="nav-btn">🔔</div>
              <div className="nav-btn">⚙️</div>
              <div className="user-pill" onClick={e => { e.stopPropagation(); setDropOpen(!dropOpen); }}>
                <div className="u-avatar" style={{ background: roleColor }}>
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div>
                  <div className="u-name">{user.last_name} {user.first_name}</div>
                  <div className="u-role" style={{ color: roleColor }}>{ROLE_LABELS[user.role]}</div>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>▾</span>
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
            {/* ═══ SUPER ADMIN ═══ */}
            {isSuperAdmin && (
              <>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                  {[
                    { label: 'Байгууллага', val: saStats.organizations, icon: '🏢', bg: '#fef3c7', sub: 'Идэвхтэй байгууллага', color: '#059669' },
                    { label: 'Тавилгын төрөл', val: saStats.furniture_types, icon: '🪑', bg: '#fef3c7', sub: 'Бүртгэлтэй төрлүүд', color: '#94a3b8' },
                    { label: 'Нийт хэрэглэгч', val: saStats.users, icon: '👥', bg: '#dcfce7', sub: 'Идэвхтэй хэрэглэгчид', color: '#059669' },
                    { label: 'Тооцоолол хийгдсэн', val: saStats.calculations, icon: '📐', bg: '#fef9c3', sub: 'Нийт тооцоолол', color: '#059669' },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-top">
                        <span className="stat-label">{s.label}</span>
                        <div className="stat-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
                      </div>
                      <div className="stat-val">{s.val}</div>
                      <div className="stat-chg" style={{ color: s.color }}>▲ {s.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">Түргэн үйлдлүүд</div><div className="card-sub">Байнга хэрэглэдэг үйлдлүүд</div></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {QUICK_ACTIONS.map(item => (
                        <div key={item.path} className="qa-item" onClick={() => router.push(item.path)}>
                          <div className="qa-icon" style={{ background: item.bg }}>{item.icon}</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{item.label}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{item.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">Системийн төлөв</div><div className="card-sub">Бодит цагийн мэдээлэл</div></div>
                      <span className="pill" style={{ background: '#dcfce7', color: '#166534' }}>● Ажиллаж байна</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'CPU ачаалал', val: 34, color: '#d97706' },
                        { label: 'RAM ашиглалт', val: 61, color: '#f59e0b' },
                        { label: 'Disk зай', val: 22, color: '#059669' },
                      ].map(s => (
                        <div key={s.label} className="sys-card">
                          <div className="sys-label">{s.label}</div>
                          <div className="sys-bar"><div className="sys-fill" style={{ width: `${s.val}%`, background: s.color }} /></div>
                          <div className="sys-val">{s.val}%</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '0.5px solid #f1f5f9', paddingTop: 10 }}>
                      {[
                        { label: 'Сервер uptime', val: '99.8%', color: '#059669' },
                        { label: 'DB холболт', val: 'Идэвхтэй', color: '#059669' },
                        { label: 'Сүүлийн backup', val: 'Өнөөдөр 03:00', color: '#0f172a' },
                        { label: 'API хариу дундаж', val: '142ms', color: '#0f172a' },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                          <span>{r.label}</span>
                          <span style={{ fontWeight: 700, color: r.color }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">Тооцооллын түүх</div><div className="card-sub">Сарын тооцооллын тоо — 2026</div></div>
                      <span className="pill" style={{ background: '#fef3c7', color: '#92400e' }}>2026</span>
                    </div>
                    <div className="legend-row">
                      <div className="leg-item"><div className="leg-dot" style={{ background: '#d97706' }}></div>Тооцоолол</div>
                      <div className="leg-item"><div className="leg-dot" style={{ background: '#a5b4fc' }}></div>Захиалга болсон</div>
                    </div>
                    <div style={{ position: 'relative', height: 200 }}>
                      <canvas id="barChart" role="img" aria-label="Сарын тооцооллын тоо"></canvas>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-hd">
                      <div><div className="card-title">Сүүлийн лог үйлдлүүд</div><div className="card-sub">Системийн өөрчлөлтүүд</div></div>
                      <span className="pill" style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer' }} onClick={() => router.push('/audit-logs')}>Бүгд →</span>
                    </div>
                    {recentItems.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>Лог байхгүй байна</div>}
                    {recentItems.map((log: any, i: number) => {
                      const ac = log.action === 'CREATE' ? { bg: '#dcfce7', color: '#166534' }
                        : log.action === 'UPDATE' ? { bg: '#fef9c3', color: '#92400e' }
                        : log.action === 'DELETE' ? { bg: '#fee2e2', color: '#991b1b' }
                        : { bg: '#f1f5f9', color: '#475569' };
                      return (
                        <div key={i} className="ord-item">
                          <div className="ord-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>{log.action?.[0] || 'L'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="ord-name">{log.action || 'Үйлдэл'} — {log.table_name}</div>
                            <div className="ord-type">{new Date(log.created_at).toLocaleString('mn-MN')}</div>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: ac.bg, color: ac.color, flexShrink: 0 }}>{log.action || '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ═══ OTHER ADMINS ═══ */}
           {/* ═══ ADMIN DASHBOARD ═══ */}
{user.role === 'admin' && (
  <>
    {/* Stat cards */}
    <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:20 }}>
      {[
        { label:'Нийт захиалга', val:stats.orders, icon:'📦', bg:'#fef3c7', color:'#92400e', sub:'Нийт захиалгын тоо' },
        { label:'Нийт орлого', val:`₮${(stats.income/1000000).toFixed(1)}M`, icon:'💰', bg:'#fef9c3', color:'#b45309', sub:'Нийт орлого' },
        { label:'Тооцоолол', val:stats.calculations, icon:'📐', bg:'#fef3c7', color:'#92400e', sub:'Нийт тооцоолол' },
        { label:'Биелэсэн', val:stats.done, icon:'✅', bg:'#dcfce7', color:'#059669', sub:'Амжилттай дууссан' },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-top">
            <span className="stat-label">{s.label}</span>
            <div className="stat-icon-wrap" style={{ background:s.bg }}>{s.icon}</div>
          </div>
          <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
          <div className="stat-chg chg-up">▲ {s.sub}</div>
        </div>
      ))}
    </div>

    {/* Үндсэн хэсэг */}
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

      {/* Ажилтны удирдлага */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title">👥 Ажилтны удирдлага</div>
            <div className="card-sub">Бүртгэх, засах, эрх тохируулах</div>
          </div>
          
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {[
            { icon:'👤', label:'Шинэ ажилтан бүртгэх', sub:'Нэр, имэйл, эрх тохируулах', path:'/users', color:'#fef3c7' },
            { icon:'🔐', label:'Эрх хандалт тохируулах', sub:'Нягтлан, ажилтан, боловсруулагч', path:'/users', color:'#fef3c7' },
            { icon:'✏️', label:'Ажилтны мэдээлэл засах', sub:'Идэвхжүүлэх, зогсоох', path:'/users', color:'#dcfce7' },
          ].map(item => (
            <div key={item.label} className="qa-item" onClick={() => router.push(item.path)}>
              <div className="qa-icon" style={{ background:item.color }}>{item.icon}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{item.label}</div>
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{item.sub}</div>
              </div>
              <span style={{ marginLeft:'auto', fontSize:12, color:'#d97706' }}>→</span>
            </div>
          ))}
        </div>
      </div>

      {/* Байгууллагын мэдээлэл */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title">🏢 Байгууллагын мэдээлэл</div>
            <div className="card-sub">Мэдээлэл шинэчлэх, хянах</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { label:'Байгууллагын нэр', val:'Тавилгын цех #1', icon:'🏢' },
            { label:'Хандалтын түвшин', val:'Бүрэн эрх', icon:'🔐' },
            { label:'Бүртгэлтэй ажилтан', val:`${stats.orders > 0 ? '4+' : '0'} хүн`, icon:'👥' },
            { label:'Сүүлийн нэвтрэлт', val:new Date().toLocaleDateString('mn-MN'), icon:'📅' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'0.5px solid #f1f5f9', fontSize:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b' }}>
                <span>{r.icon}</span>{r.label}
              </div>
              <span style={{ fontWeight:600, color:'#0f172a' }}>{r.val}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/organizations')}
          style={{ width:'100%', marginTop:12, background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a', borderRadius:9, padding:'9px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
        >
          Байгууллагын мэдээлэл харах →
        </button>
      </div>
    </div>

    {/* Тайлан + Захиалга */}
    <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14 }}>

      {/* Тайлан */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title">📊 Тайлангийн удирдлага</div>
            <div className="card-sub">Огноо, төлөв, ажилтнаар шүүж гаргах</div>
          </div>
          <button
            onClick={() => router.push('/reports')}
            style={{ background:'#f1f5f9', color:'#475569', border:'none', borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
          >
            Бүгд →
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          {[
            { icon:'📦', label:'Захиалгын тайлан', sub:'Төлөвөөр шүүх', path:'/reports', bg:'#fef3c7' },
            { icon:'💰', label:'Санхүүгийн тайлан', sub:'Орлого, зарлага', path:'/reports', bg:'#fef9c3' },
            { icon:'👷', label:'Ажилтны тайлан', sub:'Гүйцэтгэлээр', path:'/reports', bg:'#dcfce7' },
            { icon:'📥', label:'Excel татах', sub:'Бүх тайлан', path:'/reports', bg:'#f0fdf4' },
          ].map(item => (
            <div key={item.label} className="qa-item" onClick={() => router.push(item.path)}>
              <div className="qa-icon" style={{ background:item.bg }}>{item.icon}</div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#0f172a' }}>{item.label}</div>
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ position:'relative', height:160 }}>
          <canvas id="barChart" role="img" aria-label="Захиалгын график"></canvas>
        </div>
      </div>

      {/* Сүүлийн захиалга */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title">📦 Сүүлийн захиалгууд</div>
            <div className="card-sub">{recentItems.length} захиалга</div>
          </div>
          <span className="pill" style={{ background:'#fef3c7', color:'#92400e', cursor:'pointer' }} onClick={() => router.push('/orders')}>
            Бүгд →
          </span>
        </div>
        {recentItems.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8', fontSize:13 }}>
            Захиалга байхгүй байна
          </div>
        )}
        {recentItems.map((o:any, i:number) => (
          <div key={i} className="ord-item">
            <div className="ord-avatar" style={{ background:avatarColors[i%avatarColors.length] }}>
              {o.customer?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="ord-name">{o.customer || '—'}</div>
              <div className="ord-type">{o.furniture || 'Тавилга'}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div className="ord-amt">₮{Number(o.total_amount||0).toLocaleString()}</div>
              <div className="ord-st" style={{ background:STATUS_LABELS[o.status]?.bg||'#f1f5f9', color:STATUS_LABELS[o.status]?.color||'#64748b' }}>
                {STATUS_LABELS[o.status]?.label||o.status}
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => router.push('/orders')}
          style={{ width:'100%', marginTop:12, background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a', borderRadius:9, padding:'9px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
        >
          Бүх захиалга харах →
        </button>
      </div>
    </div>
  </>
)}

{/* ═══ ACCOUNTANT DASHBOARD ═══ */}
{user.role === 'accountant' && (
  <>
    <div style={{
      background:'linear-gradient(135deg,#1c1917,#292524)',
      borderRadius:20, padding:'24px 28px', marginBottom:20,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:'radial-gradient(circle,rgba(217,119,6,0.2),transparent 70%)', borderRadius:'50%' }} />
      <div style={{ fontSize:20, fontWeight:800, color:'white', marginBottom:6 }}>
        {user.last_name} {user.first_name}
      </div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(217,119,6,0.2)', border:'1px solid rgba(217,119,6,0.4)', borderRadius:100, padding:'4px 12px', fontSize:11, color:'#fbbf24', fontWeight:600 }}>
        🧾 Нягтлан эрхээр нэвтэрсэн
      </div>
    </div>

    <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:20 }}>
      {[
        { label:'Нийт орлого', val:`₮${(stats.income/1000000).toFixed(1)}M`, icon:'💰', bg:'#fef9c3', color:'#b45309' },
        { label:'Нийт захиалга', val:stats.orders, icon:'📦', bg:'#fef3c7', color:'#92400e' },
        { label:'Биелэсэн захиалга', val:stats.done, icon:'✅', bg:'#dcfce7', color:'#059669' },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-top">
            <span className="stat-label">{s.label}</span>
            <div className="stat-icon-wrap" style={{ background:s.bg }}>{s.icon}</div>
          </div>
          <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
        </div>
      ))}
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      <div className="card">
        <div className="card-hd">
          <div><div className="card-title">🪵 Материал удирдах</div><div className="card-sub">Үнэ, үлдэгдэл бүртгэх</div></div>
          <button onClick={() => router.push('/materials')} style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'white', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Нэмэх
          </button>
        </div>
        {[
          { icon:'🪵', label:'Материал нэмэх', sub:'ЛДСП, МДФ, HDF...', path:'/materials', bg:'#fef3c7' },
          { icon:'🔧', label:'Үйлчилгээ нэмэх', sub:'Зүсэлт, ирмэг, угсралт', path:'/services', bg:'#fef9c3' },
          { icon:'💰', label:'Үнэ шинэчлэх', sub:'Материалын үнэ', path:'/materials', bg:'#dcfce7' },
        ].map(item => (
          <div key={item.label} className="qa-item" style={{ marginBottom:6 }} onClick={() => router.push(item.path)}>
            <div className="qa-icon" style={{ background:item.bg }}>{item.icon}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{item.label}</div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{item.sub}</div>
            </div>
            <span style={{ marginLeft:'auto', fontSize:12, color:'#d97706' }}>→</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hd">
          <div><div className="card-title">📊 Санхүүгийн тайлан</div><div className="card-sub">Орлого, зарлагын дүн шинжилгээ</div></div>
          <button onClick={() => router.push('/reports')} style={{ background:'#f1f5f9', color:'#475569', border:'none', borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Харах →
          </button>
        </div>
        {[
          { label:'Санхүүгийн тайлан', icon:'💰', path:'/reports' },
          { label:'Материалын тайлан', icon:'🪵', path:'/reports' },
          { label:'Excel татах', icon:'📥', path:'/reports' },
        ].map(r => (
          <div key={r.label} className="qa-item" style={{ marginBottom:6 }} onClick={() => router.push(r.path)}>
            <div className="qa-icon" style={{ background:'#fef3c7' }}>{r.icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{r.label}</div>
            <span style={{ marginLeft:'auto', fontSize:12, color:'#d97706' }}>→</span>
          </div>
        ))}
      </div>
    </div>
  </>
)}

{/* ═══ ORDER PROCESSOR DASHBOARD ═══ */}
{user.role === 'order_processor' && (
  <>
    <div style={{
      background:'linear-gradient(135deg,#1c1917,#292524)',
      borderRadius:20, padding:'24px 28px', marginBottom:20,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:'radial-gradient(circle,rgba(217,119,6,0.2),transparent 70%)', borderRadius:'50%' }} />
      <div style={{ fontSize:20, fontWeight:800, color:'white', marginBottom:6 }}>
        {user.last_name} {user.first_name}
      </div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(217,119,6,0.2)', border:'1px solid rgba(217,119,6,0.4)', borderRadius:100, padding:'4px 12px', fontSize:11, color:'#fbbf24', fontWeight:600 }}>
        📋 Захиалга боловсруулагч
      </div>
    </div>

    <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:20 }}>
      {[
        { label:'Нийт захиалга', val:stats.orders, icon:'📦', bg:'#fef3c7', color:'#92400e' },
        { label:'Хүлээгдэж байна', val:recentItems.filter((o:any)=>o.status==='pending').length, icon:'⏳', bg:'#fef9c3', color:'#b45309' },
        { label:'Гүйцэтгэж байна', val:recentItems.filter((o:any)=>o.status==='in_progress').length, icon:'🔄', bg:'#dbeafe', color:'#1d4ed8' },
        { label:'Дууссан', val:stats.done, icon:'✅', bg:'#dcfce7', color:'#059669' },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-top">
            <span className="stat-label">{s.label}</span>
            <div className="stat-icon-wrap" style={{ background:s.bg }}>{s.icon}</div>
          </div>
          <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
        </div>
      ))}
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14 }}>
      <div className="card">
        <div className="card-hd">
          <div><div className="card-title">📦 Захиалга удирдах</div><div className="card-sub">Батлах, хуваарилах, хянах</div></div>
          <button onClick={() => router.push('/orders')} style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'white', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Бүгд харах
          </button>
        </div>
        {recentItems.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8', fontSize:13 }}>Захиалга байхгүй байна</div>
        ) : (
          recentItems.map((o:any, i:number) => (
            <div key={i} className="ord-item" style={{ cursor:'pointer' }} onClick={() => router.push('/orders')}>
              <div className="ord-avatar" style={{ background:avatarColors[i%avatarColors.length] }}>
                {o.customer?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="ord-name">{o.customer||'—'}</div>
                <div className="ord-type">{o.furniture||'Тавилга'}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div className="ord-amt">₮{Number(o.total_amount||0).toLocaleString()}</div>
                <div className="ord-st" style={{ background:STATUS_LABELS[o.status]?.bg||'#f1f5f9', color:STATUS_LABELS[o.status]?.color||'#64748b' }}>
                  {STATUS_LABELS[o.status]?.label||o.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-hd">
          <div><div className="card-title">⚡ Түргэн үйлдлүүд</div><div className="card-sub">Байнга хэрэглэдэг</div></div>
        </div>
        {[
          { icon:'✅', label:'Захиалга батлах', sub:'Pending → Confirmed', path:'/orders', bg:'#dcfce7' },
          { icon:'👷', label:'Ажилтанд хуваарилах', sub:'Assigned гэж тохируулах', path:'/orders', bg:'#fef3c7' },
          { icon:'📊', label:'Захиалгын тайлан', sub:'Гүйцэтгэлийн дүн', path:'/reports', bg:'#fef9c3' },
          { icon:'🔍', label:'Захиалга хайх', sub:'Дугаар, хэрэглэгчээр', path:'/orders', bg:'#f0f9ff' },
        ].map(item => (
          <div key={item.label} className="qa-item" style={{ marginBottom:6 }} onClick={() => router.push(item.path)}>
            <div className="qa-icon" style={{ background:item.bg }}>{item.icon}</div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#0f172a' }}>{item.label}</div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
)}

{/* ═══ WORKER DASHBOARD ═══ */}
{user.role === 'worker' && (
  <>
    <div style={{
      background:'linear-gradient(135deg,#1c1917,#292524)',
      borderRadius:20, padding:'24px 28px', marginBottom:20,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:'radial-gradient(circle,rgba(217,119,6,0.2),transparent 70%)', borderRadius:'50%' }} />
      <div style={{ fontSize:20, fontWeight:800, color:'white', marginBottom:6 }}>
        {user.last_name} {user.first_name}
      </div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(217,119,6,0.2)', border:'1px solid rgba(217,119,6,0.4)', borderRadius:100, padding:'4px 12px', fontSize:11, color:'#fbbf24', fontWeight:600 }}>
        🔨 Ажилтан
      </div>
    </div>

    <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:20 }}>
      {[
        { label:'Миний захиалга', val:stats.orders, icon:'📦', bg:'#fef3c7', color:'#92400e' },
        { label:'Гүйцэтгэж байна', val:recentItems.filter((o:any)=>o.status==='in_progress').length, icon:'🔄', bg:'#dbeafe', color:'#1d4ed8' },
        { label:'Дууссан', val:stats.done, icon:'✅', bg:'#dcfce7', color:'#059669' },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-top">
            <span className="stat-label">{s.label}</span>
            <div className="stat-icon-wrap" style={{ background:s.bg }}>{s.icon}</div>
          </div>
          <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
        </div>
      ))}
    </div>

    <div className="card">
      <div className="card-hd">
        <div><div className="card-title">📦 Миний захиалгууд</div><div className="card-sub">Оноогдсон захиалгуудыг гүйцэтгэх</div></div>
        <button onClick={() => router.push('/orders')} style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'white', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          Бүгд харах
        </button>
      </div>
      {recentItems.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#0f172a', marginBottom:6 }}>Захиалга байхгүй байна</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>Танд одоогоор захиалга оногдоогүй байна</div>
        </div>
      ) : (
        recentItems.map((o:any, i:number) => (
          <div key={i} className="ord-item" style={{ cursor:'pointer' }} onClick={() => router.push('/orders')}>
            <div className="ord-avatar" style={{ background:avatarColors[i%avatarColors.length] }}>
              {o.customer?.split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="ord-name">{o.customer||'—'}</div>
              <div className="ord-type">{o.furniture||'Тавилга'} · {new Date(o.created_at).toLocaleDateString('mn-MN')}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div className="ord-amt">₮{Number(o.total_amount||0).toLocaleString()}</div>
              <div className="ord-st" style={{ background:STATUS_LABELS[o.status]?.bg||'#f1f5f9', color:STATUS_LABELS[o.status]?.color||'#64748b' }}>
                {STATUS_LABELS[o.status]?.label||o.status}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </>
)}

          </div>
        </div>
      </div>
    </>
  );
}
