'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

const TABS = [
  { key: 'orders',       label: '📦 Захиалга',    roles: ['admin','super_admin','accountant','order_processor'] },
  { key: 'finance',      label: '💰 Санхүү',      roles: ['admin','super_admin','accountant'] },
  { key: 'materials',    label: '🪵 Материал',    roles: ['admin','super_admin','accountant'] },
  { key: 'calculations', label: '📐 Тооцоолол',   roles: ['admin','super_admin'] },
  { key: 'workers',      label: '👷 Ажилтан',     roles: ['admin','super_admin','order_processor'] },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Хүлээгдэж байна', confirmed: 'Баталгаажсан',
  assigned: 'Хуваарилагдсан', in_progress: 'Гүйцэтгэж байна',
  done: 'Дууссан', cancelled: 'Цуцлагдсан',
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:     { bg: '#fef3c7', color: '#92400e' },
  confirmed:   { bg: '#dbeafe', color: '#1d4ed8' },
  assigned:    { bg: '#f5f3ff', color: '#7c3aed' },
  in_progress: { bg: '#e0f2fe', color: '#075985' },
  done:        { bg: '#dcfce7', color: '#166534' },
  cancelled:   { bg: '#fee2e2', color: '#991b1b' },
  paid:        { bg: '#dcfce7', color: '#166534' },
  unpaid:      { bg: '#fef3c7', color: '#92400e' },
};

export default function ReportsPage() {
  const router  = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted]       = useState(false);
  const [activeTab, setActiveTab]   = useState('orders');
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(false);
  const [exporting, setExporting]   = useState(false);

  // Шүүлт
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [status, setStatus]     = useState('');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['admin','super_admin','accountant','order_processor'].includes(user.role)) {
      router.push('/dashboard'); return;
    }
    loadReport();
  }, [mounted, user, activeTab]);

  const buildParams = () => {
    const p: any = {};
    if (dateFrom) p.from   = dateFrom;
    if (dateTo)   p.to     = dateTo;
    if (status)   p.status = status;
    return new URLSearchParams(p).toString();
  };

  const loadReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const qs  = buildParams();
      const res = await api.get(`/api/reports/${activeTab}${qs ? '?' + qs : ''}`);
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  // Excel татах
  const exportExcel = async () => {
    setExporting(true);
    try {
      const qs  = buildParams();
      const res = await api.get(
        `/api/reports/export/excel?tab=${activeTab}${qs ? '&' + qs : ''}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${activeTab}_report_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Excel татахад алдаа гарлаа'); }
    finally { setExporting(false); }
  };

  // Filtered rows
  const rows: any[] = data?.data || [];
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r).some(v => String(v).toLowerCase().includes(q));
  });

  const visibleTabs = TABS.filter(t => t.roles.includes(user?.role || ''));

  // Нийт дүнгийн тооцоо
  const totalAmount = filtered.reduce((s, r) =>
    s + Number(r.total_amount || r.amount || 0), 0
  );

  if (!mounted || !user) return null;

  return (
    <AppLayout title="Тайлан">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}

        /* Tabs */
        .tabs{display:flex;gap:4px;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:5px;margin-bottom:16px}
        .tab{flex:1;text-align:center;font-size:12px;font-weight:600;padding:8px 6px;border-radius:9px;border:none;background:none;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s;white-space:nowrap}
        .tab.on{background:linear-gradient(135deg,#d97706,#b45309);color:white;box-shadow:0 2px 8px rgba(217,119,6,0.3)}
        .tab:hover:not(.on){background:#f1f5f9;color:#0f172a}

        /* Filter bar */
        .filter-wrap{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-bottom:14px}
        .filter-title{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px}
        .filter-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
        .filter-group{display:flex;flex-direction:column;gap:4px}
        .filter-label{font-size:11px;font-weight:600;color:#374151}
        .filter-inp{border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;color:#0f172a;background:white;transition:border-color 0.15s;min-width:140px}
        .filter-inp:focus{border-color:#d97706}
        .filter-sel{border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;color:#0f172a;background:white;cursor:pointer;min-width:160px}
        .search-inp{border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;min-width:200px;flex:1;transition:border-color 0.15s}
        .search-inp:focus{border-color:#d97706}
        .btn-filter{background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
        .btn-reset{background:#f1f5f9;color:#374151;border:none;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
        .btn-excel{display:flex;align-items:center;gap:6px;background:#059669;color:white;border:none;border-radius:9px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.15s}
        .btn-excel:hover{background:#047857}
        .btn-excel:disabled{opacity:0.6;cursor:not-allowed}

        /* Summary cards */
        .sum-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
        .sum-card{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px}
        .sum-label{font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px}
        .sum-val{font-size:22px;font-weight:800;color:#0f172a}

        /* Table */
        .tbl-wrap{background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;animation:fadeUp 0.3s ease}
        .tbl-head{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;display:flex;gap:8px;align-items:center}
        .tbl-row{padding:11px 16px;border-bottom:1px solid #f1f5f9;display:flex;gap:8px;align-items:center;transition:background 0.1s;font-size:12px}
        .tbl-row:last-child{border-bottom:none}
        .tbl-row:hover{background:#fafafa}
        .badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;display:inline-block;white-space:nowrap}

        /* Worker cards */
        .worker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
        .worker-card{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:16px;animation:fadeUp 0.3s ease}
        .prog-bar{height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;margin-top:6px}
        .prog-fill{height:100%;background:linear-gradient(90deg,#d97706,#b45309);border-radius:3px;transition:width 0.4s ease}

        .empty{text-align:center;padding:48px 20px;color:#94a3b8}
        @media(max-width:900px){.sum-row{grid-template-columns:1fr 1fr}.filter-row{flex-direction:column}.tabs{flex-wrap:wrap}}
        @media(max-width:600px){.sum-row{grid-template-columns:1fr}.tbl-head,.tbl-row{font-size:11px}}
      `}</style>

      {/* TABS */}
      <div className="tabs">
        {visibleTabs.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'on' : ''}`}
            onClick={() => { setActiveTab(t.key); setStatus(''); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ШҮҮЛТ */}
      <div className="filter-wrap">
        <div className="filter-title">🔍 Шүүлт & Хайлт</div>
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">Эхлэх огноо</span>
            <input type="date" className="filter-inp" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Дуусах огноо</span>
            <input type="date" className="filter-inp" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {activeTab === 'orders' && (
            <div className="filter-group">
              <span className="filter-label">Захиалгын төлөв</span>
              <select className="filter-sel" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Бүгд</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          )}
          <div className="filter-group" style={{ flex: 1 }}>
            <span className="filter-label">Хайлт</span>
            <input className="search-inp" placeholder="Нэр, дугаар, имэйлээр хайх..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-group" style={{ flexDirection: 'row', gap: 6 }}>
            <button className="btn-filter" onClick={loadReport}>🔍 Шүүх</button>
            <button className="btn-reset" onClick={() => { setDateFrom(''); setDateTo(''); setStatus(''); setSearch(''); loadReport(); }}>✕ Арилгах</button>
            <button className="btn-excel" onClick={exportExcel} disabled={exporting || !data}>
              {exporting ? '⏳' : '📥'} Excel татах
            </button>
          </div>
        </div>
      </div>

      {/* НИЙТ ДҮН */}
      {data && (
        <div className="sum-row">
          <div className="sum-card">
            <div className="sum-label">Нийт мөр</div>
            <div className="sum-val">{filtered.length}</div>
          </div>
          {(activeTab === 'orders' || activeTab === 'finance') && (
            <div className="sum-card">
              <div className="sum-label">Нийт дүн</div>
              <div className="sum-val" style={{ color: '#d97706' }}>₮{totalAmount.toLocaleString()}</div>
            </div>
          )}
          {activeTab === 'orders' && (
            <div className="sum-card">
              <div className="sum-label">Дууссан захиалга</div>
              <div className="sum-val" style={{ color: '#059669' }}>
                {filtered.filter((r: any) => r.status === 'done').length}
              </div>
            </div>
          )}
          {activeTab === 'materials' && (
            <div className="sum-card">
              <div className="sum-label">Бага үлдэгдэлтэй</div>
              <div className="sum-val" style={{ color: '#ef4444' }}>
                {filtered.filter((r: any) => Number(r.stock) < 10).length}
              </div>
            </div>
          )}
          {activeTab === 'workers' && (
            <div className="sum-card">
              <div className="sum-label">Нийт ажилтан</div>
              <div className="sum-val">{filtered.length}</div>
            </div>
          )}
        </div>
      )}

      {/* ТАЙЛАНГИЙН ХҮСНЭГТ */}
      {loading ? (
        <div className="tbl-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: '13px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
              {[120, 180, 80, 80, 80, 90].map((w, j) => <div key={j} className="skel" style={{ height: 11, width: w }} />)}
            </div>
          ))}
        </div>
      ) : !data ? (
        <div className="tbl-wrap">
          <div className="empty">
            <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Тайлан ачааллаагүй байна</div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="tbl-wrap">
          <div className="empty">
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Шүүлтэд тохирсон мэдээлэл байхгүй</div>
          </div>
        </div>
      ) : (
        <>
          {/* ── ЗАХИАЛГЫН ТАЙЛАН ── */}
          {activeTab === 'orders' && (
            <div className="tbl-wrap">
              <div className="tbl-head">
                <div style={{ width: 140 }}>Дугаар</div>
                <div style={{ flex: 1 }}>Хэрэглэгч</div>
                <div style={{ width: 130 }}>Тавилга</div>
                <div style={{ width: 110 }}>Дүн ₮</div>
                <div style={{ width: 120 }}>Захиалгын төлөв</div>
                <div style={{ width: 100 }}>Төлбөр</div>
                <div style={{ width: 100 }}>Огноо</div>
              </div>
              {filtered.map((r: any, i: number) => {
                const stc = STATUS_COLORS[r.status] || { bg: '#f1f5f9', color: '#374151' };
                const pc  = STATUS_COLORS[r.pay_status] || { bg: '#fee2e2', color: '#991b1b' };
                return (
                  <div key={i} className="tbl-row">
                    <div style={{ width: 140, fontFamily: 'monospace', fontWeight: 700, color: '#d97706', fontSize: 11 }}>{r.order_no}</div>
                    <div style={{ flex: 1, fontWeight: 600, color: '#0f172a' }}>{r.customer}</div>
                    <div style={{ width: 130, color: '#64748b' }}>{r.furniture || '—'}</div>
                    <div style={{ width: 110, fontWeight: 700, color: '#0f172a' }}>₮{Number(r.total_amount).toLocaleString()}</div>
                    <div style={{ width: 120 }}>
                      <span className="badge" style={{ background: stc.bg, color: stc.color }}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </div>
                    <div style={{ width: 100 }}>
                      <span className="badge" style={{ background: pc.bg, color: pc.color }}>
                        {r.pay_status === 'paid' ? '✓ Төлөгдсөн' : '⏳ Хүлээгдэж байна'}
                      </span>
                    </div>
                    <div style={{ width: 100, color: '#64748b', fontSize: 11 }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('mn-MN') : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── САНХҮҮГИЙН ТАЙЛАН ── */}
          {activeTab === 'finance' && (
            <div className="tbl-wrap">
              <div className="tbl-head">
                <div style={{ width: 140 }}>Дугаар</div>
                <div style={{ flex: 1 }}>Хэрэглэгч</div>
                <div style={{ width: 110 }}>Дүн ₮</div>
                <div style={{ width: 110 }}>Арга</div>
                <div style={{ width: 110 }}>Огноо</div>
              </div>
              {filtered.map((r: any, i: number) => (
                <div key={i} className="tbl-row">
                  <div style={{ width: 140, fontFamily: 'monospace', fontWeight: 700, color: '#d97706', fontSize: 11 }}>{r.order_no}</div>
                  <div style={{ flex: 1, fontWeight: 600, color: '#0f172a' }}>{r.customer}</div>
                  <div style={{ width: 110, fontWeight: 800, color: '#059669' }}>₮{Number(r.amount).toLocaleString()}</div>
                  <div style={{ width: 110 }}>
                    <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                      {r.method === 'cash' ? '💵 Бэлэн' : r.method === 'transfer' ? '🏦 Шилжүүлэг' : '📱 QPay'}
                    </span>
                  </div>
                  <div style={{ width: 110, color: '#64748b', fontSize: 11 }}>
                    {r.paid_at ? new Date(r.paid_at).toLocaleDateString('mn-MN') : '—'}
                  </div>
                </div>
              ))}
              {/* Нийт */}
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Нийт орлого</span>
                <span style={{ color: '#059669' }}>₮{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* ── МАТЕРИАЛЫН ТАЙЛАН ── */}
          {activeTab === 'materials' && (
            <div className="tbl-wrap">
              <div className="tbl-head">
                <div style={{ width: 100 }}>Код</div>
                <div style={{ flex: 1 }}>Нэр</div>
                <div style={{ width: 120 }}>Ангилал</div>
                <div style={{ width: 80 }}>Нэгж</div>
                <div style={{ width: 100 }}>Үнэ ₮</div>
                <div style={{ width: 100 }}>Үлдэгдэл</div>
                <div style={{ width: 80 }}>Төлөв</div>
              </div>
              {filtered.map((r: any, i: number) => {
                const stockLow = Number(r.stock) < 10;
                return (
                  <div key={i} className="tbl-row">
                    <div style={{ width: 100, fontFamily: 'monospace', fontSize: 11, color: '#d97706', background: '#fef3c7', padding: '2px 7px', borderRadius: 4 }}>{r.code}</div>
                    <div style={{ flex: 1, fontWeight: 600, color: '#0f172a' }}>{r.name}</div>
                    <div style={{ width: 120, color: '#64748b' }}>{r.category} · {r.type}</div>
                    <div style={{ width: 80, color: '#64748b' }}>{r.unit}</div>
                    <div style={{ width: 100, fontWeight: 700 }}>₮{Number(r.price).toLocaleString()}</div>
                    <div style={{ width: 100, fontWeight: 700, color: stockLow ? '#ef4444' : '#059669' }}>
                      {Number(r.stock).toFixed(2)}
                    </div>
                    <div style={{ width: 80 }}>
                      <span className="badge" style={{ background: stockLow ? '#fee2e2' : '#dcfce7', color: stockLow ? '#991b1b' : '#166534' }}>
                        {stockLow ? '⚠️ Бага' : '✓ Байгаа'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ТООЦООЛЛЫН ТАЙЛАН ── */}
          {activeTab === 'calculations' && (
            <div className="tbl-wrap">
              <div className="tbl-head">
                <div style={{ flex: 1 }}>Хэрэглэгч</div>
                <div style={{ width: 140 }}>Тавилга</div>
                <div style={{ width: 100 }}>Нийт м²</div>
                <div style={{ width: 110 }}>Нийт ₮</div>
                <div style={{ width: 110 }}>Огноо</div>
              </div>
              {filtered.map((r: any, i: number) => (
                <div key={i} className="tbl-row">
                  <div style={{ flex: 1, fontWeight: 600, color: '#0f172a' }}>{r.customer}</div>
                  <div style={{ width: 140, color: '#64748b' }}>{r.furniture}</div>
                  <div style={{ width: 100, fontWeight: 700, color: '#d97706' }}>{Number(r.total_area).toFixed(3)} м²</div>
                  <div style={{ width: 110, fontWeight: 700 }}>₮{Number(r.total_cost || 0).toLocaleString()}</div>
                  <div style={{ width: 110, color: '#64748b', fontSize: 11 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('mn-MN') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── АЖИЛТНЫ ТАЙЛАН ── */}
          {activeTab === 'workers' && (
            <div className="worker-grid">
              {filtered.map((r: any, i: number) => {
                const total  = r.total || 0;
                const done   = r.done  || 0;
                const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={i} className="worker-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {r.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                      {[
                        { label: 'Нийт', val: total, color: '#0f172a' },
                        { label: 'Дууссан', val: done, color: '#059669' },
                        { label: 'Хийгдэж буй', val: r.in_progress || 0, color: '#0891b2' },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#f8fafc', borderRadius: 9, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      <span>Гүйцэтгэлийн хувь</span>
                      <span style={{ fontWeight: 700, color: pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#ef4444' }}>{pct}%</span>
                    </div>
                    <div className="prog-bar">
                      <div className="prog-fill" style={{ width: `${pct}%`, background: pct >= 70 ? 'linear-gradient(90deg,#059669,#047857)' : pct >= 40 ? 'linear-gradient(90deg,#d97706,#b45309)' : 'linear-gradient(90deg,#ef4444,#dc2626)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}