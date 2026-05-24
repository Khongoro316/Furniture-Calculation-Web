'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';
import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../components/ui/ToastProvider';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Супер Админ',
  admin: 'Админ',
  accountant: 'Нягтлан',
  order_processor: 'Захиалга боловсруулагч',
  worker: 'Ажилтан',
  customer: 'Хэрэглэгч',
  guest: 'Зочин',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Хүлээгдэж байна', color: '#ca8a04', bg: '#fef9c3' },
  confirmed: { label: 'Баталгаажсан', color: '#2563eb', bg: '#dbeafe' },
  assigned: { label: 'Хуваарилагдсан', color: '#7c3aed', bg: '#f5f3ff' },
  in_progress: { label: 'Гүйцэтгэж байна', color: '#0891b2', bg: '#e0f2fe' },
  done: { label: 'Дууссан', color: '#059669', bg: '#dcfce7' },
  cancelled: { label: 'Цуцлагдсан', color: '#ef4444', bg: '#fee2e2' },
};

const avatarColors = ['#d97706', '#059669', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { notify } = useToast();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ orders: 0, income: 0, calculations: 0, done: 0, users: 0 });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartData2, setChartData2] = useState<number[]>([]);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantRole, setGrantRole] = useState('accountant');
  const [grantLoading, setGrantLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        setAuth(JSON.parse(savedUser), savedToken);
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
        const [ordersRes, calcRes, workersRes, auditRes] = await Promise.all([
          api.get('/api/reports/orders').catch(() => ({ data: { total: 0, data: [] } })),
          api.get('/api/reports/calculations').catch(() => ({ data: { total: 0 } })),
          api.get('/api/auth/workers').catch(() => ({ data: [] })),
          api.get('/api/reports/audit-logs').catch(() => ({ data: [] })),
        ]);
        const orders = ordersRes.data.data || [];
        setStats({
          orders: ordersRes.data.total || 0,
          income: orders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
          calculations: calcRes.data.total || 0,
          done: orders.filter((o: any) => o.status === 'done').length,
          users: workersRes.data.length || 0,
        });
        setWorkers(workersRes.data || []);
        setRecentItems(orders.slice(0, 5));
        setRecentLogs(auditRes.data.slice(0, 5));
        setChartData([8, 12, 9, 15, 18, 14, 22, calcRes.data.total || 0]);
        setChartData2([3, 5, 4, 8, 10, 7, 12, ordersRes.data.total || 0]);
      } else if (user?.role === 'admin') {
        const [ordersRes, calcRes, usersRes] = await Promise.all([
          api.get('/api/reports/orders').catch(() => ({ data: { total: 0, data: [] } })),
          api.get('/api/reports/calculations').catch(() => ({ data: { total: 0 } })),
          api.get('/api/auth/workers').catch(() => ({ data: [] })),
        ]);
        const orders = ordersRes.data.data || [];
        setStats({
          orders: ordersRes.data.total || 0,
          income: orders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
          calculations: calcRes.data.total || 0,
          done: orders.filter((o: any) => o.status === 'done').length,
          users: usersRes.data.length || 0,
        });
        setWorkers(usersRes.data || []);
        setRecentItems(orders.slice(0, 4));
        setChartData([20, 35, 28, 42, 38, 55, 48, 62]);
        setChartData2([15, 28, 20, 35, 30, 44, 38, 50]);
      } else if (user?.role === 'customer') {
        const res = await api.get('/api/orders/my').catch(() => ({ data: [] }));
        const orders = res.data || [];
        setStats({
          orders: orders.length,
          income: 0,
          calculations: 0,
          done: orders.filter((o: any) => o.status === 'done').length,
          users: 0,
        });
        setRecentItems(orders.slice(0, 4));
      } else {
        const ordersRes = await api.get('/api/reports/orders').catch(() => ({ data: { total: 0, data: [] } }));
        const orders = ordersRes.data.data || [];
        setStats({
          orders: ordersRes.data.total || 0,
          income: orders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
          calculations: 0,
          done: orders.filter((o: any) => o.status === 'done').length,
          users: 0,
        });
        setRecentItems(orders.slice(0, 4));
        setChartData([20, 35, 28, 42, 38, 55, 48, 62]);
        setChartData2([15, 28, 20, 35, 30, 44, 38, 50]);
      }
    } catch {}
  };

  useEffect(() => {
    if (!mounted || !chartData.length || !user) return;
    const isSA = user.role === 'super_admin';
    const existing = (window as any).__dashChart;
    if (existing) {
      existing.destroy();
      (window as any).__dashChart = null;
    }
    const canvas = document.getElementById('barChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const buildChart = () => {
      const chart = new (window as any).Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['1-р', '2-р', '3-р', '4-р', '5-р', '6-р', '7-р', '8-р'],
          datasets: [
            { label: isSA ? 'Тооцоолол' : 'Захиалга', data: chartData, backgroundColor: '#d97706', borderRadius: 5, barPercentage: 0.5 },
            { label: isSA ? 'Захиалга' : 'Биелсэн', data: chartData2, backgroundColor: isSA ? '#a5b4fc' : '#fde68a', borderRadius: 5, barPercentage: 0.5 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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

    return () => {
      if ((window as any).__dashChart) {
        (window as any).__dashChart.destroy();
        (window as any).__dashChart = null;
      }
    };
  }, [chartData, chartData2, mounted, user]);

  const handleGrantRole = async () => {
    if (!grantUserId) return;
    setGrantLoading(true);
    try {
      const res = await api.put(`/api/auth/users/${grantUserId}/role`, { role: grantRole });
      setShowGrantModal(false);
      setGrantUserId('');
      notify(res.data?.message || 'Эрх амжилттай олгогдлоо', 'success');
      loadStats();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Эрх олгох үед алдаа гарлаа', 'error');
    } finally {
      setGrantLoading(false);
    }
  };

  if (!mounted || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <AppLayout title="Хяналтын самбар">
      <style>{`
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
        .qa-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .15s;margin-bottom:6px}
        .qa-item:hover{background:#fef3c7;border-color:#fde68a}
        .qa-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
        .ord-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1f5f9}
        .ord-item:last-child{border-bottom:none}
        .ord-av{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
        .ord-name{font-size:12px;font-weight:600;color:#0f172a}
        .ord-sub{font-size:10px;color:#94a3b8;margin-top:1px}
        .ord-st{font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;display:inline-block;margin-top:3px}
        .wk-card{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9}
        .wk-card:last-child{border-bottom:none}
        .wk-av{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0}
        .legend-row{display:flex;gap:14px;margin-bottom:8px}
        .leg-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b}
        .leg-dot{width:10px;height:10px;border-radius:3px}
        .sys-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px}
        .sys-label{font-size:10px;color:#64748b;margin-bottom:4px}
        .sys-bar{height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-bottom:4px}
        .sys-fill{height:100%;border-radius:3px}
        .sys-val{font-size:12px;font-weight:700;color:#0f172a}
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:18px;width:100%;max-width:440px;box-shadow:0 24px 80px rgba(0,0,0,0.2)}
        .modal-head{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .modal-title{font-size:15px;font-weight:800;color:#0f172a}
        .mclose{width:28px;height:28px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:16px;color:#64748b;display:flex;align-items:center;justify-content:center}
        .modal-body{padding:20px}
        .fl{font-size:11px;font-weight:700;color:#374151;display:block;margin-bottom:5px}
        .fi{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;transition:border-color .15s;background:white;margin-bottom:12px}
        .btn-primary{background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%}
        @media(max-width:768px){.stats-grid{grid-template-columns:1fr 1fr!important}}
      `}</style>

      {user.role === 'super_admin' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { label: 'Нийт захиалга', val: stats.orders, icon: '📦', bg: '#fef3c7' },
              { label: 'Тавилгын төрөл', val: stats.calculations, icon: '🪑', bg: '#fef3c7' },
              { label: 'Нийт хэрэглэгч', val: stats.users, icon: '👥', bg: '#dcfce7' },
              { label: 'Дууссан захиалга', val: stats.done, icon: '✅', bg: '#fef9c3' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-top"><span className="stat-label">{s.label}</span><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div></div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-sub">▲ Нийт тоо</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="card">
              <div className="card-hd">
                <div><div className="card-title">⚡ Түргэн үйлдлүүд</div><div className="card-sub">Байнга хэрэглэдэг үйлдлүүд</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon:'🪑', label:'Тавилга нэмэх', path:'/furniture-types', bg:'#dcfce7' },
                  { icon:'🗂️', label:'Ангилал нэмэх', path:'/material-categories', bg:'#fef9c3' },
                  { icon:'⚙️', label:'Үйлчилгээний төрөл', path:'/service-types', bg:'#fee2e2' },
                  { icon:'📊', label:'Тайлан харах', path:'/reports', bg:'#f0fdf4' },
                  { icon:'📋', label:'Лог харах', path:'/audit-logs', bg:'#f0f9ff' },
                  { icon:'👥', label:'Ажилчид харах', path:'/users', bg:'#f8fafc' },
                ].map(item => (
                  <div key={item.label} className="qa-item" style={{ marginBottom: 0 }} onClick={() => router.push(item.path)}>
                    <div className="qa-icon" style={{ background: item.bg }}>{item.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

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
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
            <div className="card">
              <div className="card-hd"><div><div className="card-title">📈 Хандлагын график</div><div className="card-sub">Захиалга ба тооцоолол</div></div></div>
              <div className="legend-row">
                <div className="leg-item"><div className="leg-dot" style={{ background: '#d97706' }} />Тооцоолол</div>
                <div className="leg-item"><div className="leg-dot" style={{ background: '#a5b4fc' }} />Захиалга</div>
              </div>
              <div style={{ position: 'relative', height: 200 }}><canvas id="barChart" /></div>
            </div>
            <div className="card">
              <div className="card-hd">
                <div><div className="card-title">📋 Сүүлийн лог</div><div className="card-sub">Системийн өөрчлөлтүүд</div></div>
                <span className="pill" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => router.push('/audit-logs')}>Бүгд →</span>
              </div>
              {recentLogs.map((log: any, i: number) => (
                <div key={i} className="ord-item">
                  <div className="ord-av" style={{ background: avatarColors[i % avatarColors.length] }}>{log.action?.[0] || 'L'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ord-name">{log.action} — {log.table_name}</div>
                    <div className="ord-sub">{new Date(log.created_at).toLocaleString('mn-MN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {user.role === 'admin' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { label: 'Нийт захиалга', val: stats.orders, icon: '📦', bg: '#fef3c7' },
              { label: 'Нийт орлого', val: `₮${(stats.income / 1000000).toFixed(1)}M`, icon: '💰', bg: '#fef9c3' },
              { label: 'Тооцоолол', val: stats.calculations, icon: '📐', bg: '#f0fdf4' },
              { label: 'Биелэсэн', val: stats.done, icon: '✅', bg: '#dcfce7' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-top"><span className="stat-label">{s.label}</span><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div></div>
                <div className="stat-val">{s.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="card">
              <div className="card-hd">
                <div><div className="card-title">👥 Ажилтан удирдах</div><div className="card-sub">{workers.length} ажилтан бүртгэлтэй</div></div>
                <button onClick={() => setShowGrantModal(true)} style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Эрх олгох</button>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {workers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>Ажилтан бүртгэгдээгүй байна</div>
                ) : workers.map((w: any, i: number) => (
                  <div key={w.id} className="wk-card">
                    <div className="wk-av" style={{ background: avatarColors[i % avatarColors.length] }}>{w.first_name?.[0]}{w.last_name?.[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{w.last_name} {w.first_name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{w.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-hd"><div><div className="card-title">📦 Сүүлийн захиалгууд</div><div className="card-sub">Шинэ болон идэвхтэй ажлууд</div></div></div>
              {recentItems.map((o: any, i: number) => (
                <div key={i} className="ord-item">
                  <div className="ord-av" style={{ background: avatarColors[i % avatarColors.length] }}>{o.customer?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || '?'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="ord-name">{o.customer || '—'}</div><div className="ord-sub">{o.furniture || 'Тавилга'}</div></div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>₮{Number(o.total_amount || 0).toLocaleString()}</div>
                    <div className="ord-st" style={{ background: STATUS_LABELS[o.status]?.bg || '#f1f5f9', color: STATUS_LABELS[o.status]?.color || '#64748b' }}>{STATUS_LABELS[o.status]?.label || o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {user.role === 'accountant' && (
        <>
          <div style={{ background: 'linear-gradient(135deg,#1c1917,#292524)', borderRadius: 18, padding: '22px 26px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle,rgba(217,119,6,0.2),transparent 70%)', borderRadius: '50%' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 6 }}>{user.last_name} {user.first_name}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.4)', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>🧾 Нягтланы эрхээр нэвтэрсэн</div>
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 18 }}>
            {[
              { label: 'Нийт орлого', val: `₮${(stats.income / 1000000).toFixed(1)}M`, icon: '💰', bg: '#fef9c3' },
              { label: 'Нийт захиалга', val: stats.orders, icon: '📦', bg: '#fef3c7' },
              { label: 'Биелэсэн', val: stats.done, icon: '✅', bg: '#dcfce7' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-top"><span className="stat-label">{s.label}</span><div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div></div>
                <div className="stat-val">{s.val}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {user.role === 'order_processor' && (
        <div className="card">
          <div className="card-hd"><div><div className="card-title">📦 Захиалга удирдах</div><div className="card-sub">Батлах, хуваарилах, хянах</div></div></div>
          {recentItems.map((o: any, i: number) => (
            <div key={i} className="ord-item" style={{ cursor: 'pointer' }} onClick={() => router.push('/orders')}>
              <div className="ord-av" style={{ background: avatarColors[i % avatarColors.length] }}>{o.customer?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || '?'}</div>
              <div style={{ flex: 1, minWidth: 0 }}><div className="ord-name">{o.customer || '—'}</div><div className="ord-sub">{o.furniture || 'Тавилга'}</div></div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>₮{Number(o.total_amount || 0).toLocaleString()}</div>
                <div className="ord-st" style={{ background: STATUS_LABELS[o.status]?.bg || '#f1f5f9', color: STATUS_LABELS[o.status]?.color || '#64748b' }}>{STATUS_LABELS[o.status]?.label || o.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {user.role === 'worker' && (
        <div className="card">
          <div className="card-hd"><div><div className="card-title">📦 Миний захиалгууд</div><div className="card-sub">Оноогдсон захиалгуудыг гүйцэтгэх</div></div></div>
          {recentItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Захиалга байхгүй байна</div>
            </div>
          ) : recentItems.map((o: any, i: number) => (
            <div key={i} className="ord-item" style={{ cursor: 'pointer' }} onClick={() => router.push('/orders')}>
              <div className="ord-av" style={{ background: avatarColors[i % avatarColors.length] }}>{o.customer?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || '?'}</div>
              <div style={{ flex: 1, minWidth: 0 }}><div className="ord-name">{o.customer || '—'}</div><div className="ord-sub">{o.furniture || 'Тавилга'} · {new Date(o.created_at).toLocaleDateString('mn-MN')}</div></div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>₮{Number(o.total_amount || 0).toLocaleString()}</div>
                <div className="ord-st" style={{ background: STATUS_LABELS[o.status]?.bg || '#f1f5f9', color: STATUS_LABELS[o.status]?.color || '#64748b' }}>{STATUS_LABELS[o.status]?.label || o.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {user.role === 'customer' && (
        <div style={{ background: 'linear-gradient(135deg,#fffbf5,#fef3c7)', borderRadius: 18, padding: '28px', marginBottom: 18, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1917', marginBottom: 6 }}>Сайн байна уу, {user.first_name}!</div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 18 }}>Тавилгын материалыг тооцоолж, захиалга өгөөрэй</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/calculate')} style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 11, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📐 Тооцоолол хийх</button>
            <button onClick={() => router.push('/my-orders')} style={{ background: 'white', color: '#1c1917', border: '1.5px solid #e7e5e4', borderRadius: 11, padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📦 Миний захиалгууд</button>
          </div>
        </div>
      )}

      {showGrantModal && (
        <div className="modal-bg" onClick={() => setShowGrantModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">👥 Ажилтанд эрх олгох</div>
              <button className="mclose" onClick={() => setShowGrantModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 16, lineHeight: 1.6 }}>💡 Ажилтанд эрх олгосноор тэд дашбоардад нэвтрэх боломжтой болно</div>
              <label className="fl">Ажилтан сонгох</label>
              <select className="fi" value={grantUserId} onChange={e => setGrantUserId(e.target.value)} style={{ background: 'white' }}>
                <option value="">— Ажилтан сонгоно уу —</option>
                {workers.map((u: any) => (
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
    </AppLayout>
  );
}
