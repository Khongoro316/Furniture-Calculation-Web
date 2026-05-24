'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface Log {
  id: number;
  action: string;
  table_name: string;
  record_id?: number;
  ip_address?: string;
  created_at: string;
  users?: { first_name: string; last_name: string; role: string } | null;
}

const ACTION_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  CREATE: { bg: '#dcfce7', color: '#166534', icon: '➕' },
  UPDATE: { bg: '#fef9c3', color: '#92400e', icon: '✏️' },
  DELETE: { bg: '#fee2e2', color: '#991b1b', icon: '🗑️' },
  LOGIN:  { bg: '#dbeafe', color: '#1d4ed8', icon: '🔑' },
  LOGOUT: { bg: '#f1f5f9', color: '#64748b', icon: '🚪' },
};

const TABLE_ICONS: Record<string, string> = {
  orders: '📦', materials: '🪵', users: '👤',
  calculations: '📐', payments: '💳', services: '🔧', furniture_types: '🪑',
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted]     = useState(false);
  const [logs, setLogs]           = useState<Log[]>([]);
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);

  // Шүүлт
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable]   = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 50;

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
    loadLogs();
  }, [mounted, user]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 500 };
      if (dateFrom) params.from  = dateFrom;
      if (dateTo)   params.to    = dateTo;
      const qs  = new URLSearchParams(params).toString();
      const res = await api.get(`/api/reports/audit-logs${qs ? '?' + qs : ''}`);
      setLogs(res.data || []);
      setPage(1);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  // Шүүгдсэн лог
  const filtered = logs.filter(l => {
    if (filterAction && l.action !== filterAction) return false;
    if (filterTable  && l.table_name !== filterTable) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = l.users ? `${l.users.last_name} ${l.users.first_name}`.toLowerCase() : '';
      if (!name.includes(q) && !l.table_name.includes(q) && !l.action.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Уникт хүснэгтүүд
  const tables = [...new Set(logs.map(l => l.table_name))].sort();

  // Статистик
  const counts = ['CREATE','UPDATE','DELETE','LOGIN','LOGOUT'].reduce((acc, a) => {
    acc[a] = logs.filter(l => l.action === a).length;
    return acc;
  }, {} as Record<string, number>);

  // Excel татах
  const exportExcel = async () => {
    setExporting(true);
    try {
      const params: any = { tab: 'audit-logs' };
      if (dateFrom) params.from = dateFrom;
      if (dateTo)   params.to   = dateTo;
      const qs  = new URLSearchParams(params).toString();
      const res = await api.get(`/api/reports/export/excel?${qs}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `audit_logs_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Excel татахад алдаа гарлаа'); }
    finally { setExporting(false); }
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout title="Лог бүртгэл">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}

        /* Stats */
        .stat-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}
        .stat-card{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s;border-left:3px solid transparent}
        .stat-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.07)}
        .stat-card.on{box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .stat-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px}
        .stat-num{font-size:20px;font-weight:800}

        /* Filter */
        .filter-wrap{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-bottom:14px}
        .filter-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
        .filter-group{display:flex;flex-direction:column;gap:4px}
        .filter-label{font-size:11px;font-weight:600;color:#374151}
        .filter-inp{border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;background:white;transition:border-color 0.15s}
        .filter-inp:focus{border-color:#d97706}
        .filter-sel{border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;background:white;cursor:pointer}
        .search-inp{border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;min-width:200px;flex:1;transition:border-color 0.15s}
        .search-inp:focus{border-color:#d97706}
        .btn-filter{background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-reset{background:#f1f5f9;color:#374151;border:none;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-excel{display:flex;align-items:center;gap:6px;background:#059669;color:white;border:none;border-radius:9px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-excel:disabled{opacity:0.6;cursor:not-allowed}

        /* Table */
        .tbl-wrap{background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;animation:fadeUp 0.3s ease}
        .tbl-info{padding:10px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;display:flex;justify-content:space-between;align-items:center}
        .tbl-head{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:9px 16px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;display:grid;grid-template-columns:90px 130px 1fr 100px 90px 130px;gap:8px;align-items:center}
        .tbl-row{padding:10px 16px;border-bottom:1px solid #f1f5f9;display:grid;grid-template-columns:90px 130px 1fr 100px 90px 130px;gap:8px;align-items:center;transition:background 0.1s;animation:fadeUp 0.2s ease}
        .tbl-row:last-child{border-bottom:none}
        .tbl-row:hover{background:#fafafa}
        .badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
        .table-tag{font-family:monospace;font-size:11px;color:#0891b2;background:#e0f2fe;padding:2px 7px;border-radius:5px}

        /* Pagination */
        .pagination{display:flex;gap:6px;justify-content:center;align-items:center;padding:14px;border-top:1px solid #f1f5f9;flex-wrap:wrap}
        .pg-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;justify-content:center;font-family:inherit;transition:all 0.15s}
        .pg-btn:hover{border-color:#d97706;color:#d97706}
        .pg-btn.on{background:#d97706;color:white;border-color:#d97706}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed}

        .empty{text-align:center;padding:48px 0;color:#94a3b8}
        @media(max-width:900px){.stat-row{grid-template-columns:repeat(3,1fr)}.tbl-head,.tbl-row{grid-template-columns:80px 1fr 80px 110px}.hide-md{display:none}}
      `}</style>

      {/* СТАТИСТИК */}
      <div className="stat-row">
        {[
          { key: '', label: 'Нийт', color: '#0f172a', icon: '📋' },
          { key: 'CREATE', label: 'Нэмсэн', color: '#166534', icon: '➕' },
          { key: 'UPDATE', label: 'Засварласан', color: '#92400e', icon: '✏️' },
          { key: 'DELETE', label: 'Устгасан', color: '#991b1b', icon: '🗑️' },
          { key: 'LOGIN',  label: 'Нэвтэрсэн', color: '#1d4ed8', icon: '🔑' },
        ].map(s => (
          <div key={s.key}
            className={`stat-card ${filterAction === s.key ? 'on' : ''}`}
            style={{ borderLeftColor: filterAction === s.key ? s.color : 'transparent' }}
            onClick={() => setFilterAction(filterAction === s.key ? '' : s.key)}>
            <div className="stat-label">{s.icon} {s.label}</div>
            <div className="stat-num" style={{ color: s.color }}>
              {s.key ? counts[s.key] || 0 : logs.length}
            </div>
          </div>
        ))}
      </div>

      {/* ШҮҮЛТ */}
      <div className="filter-wrap">
        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🔍 Шүүлт</div>
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">Эхлэх огноо</span>
            <input type="date" className="filter-inp" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Дуусах огноо</span>
            <input type="date" className="filter-inp" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Хүснэгт</span>
            <select className="filter-sel" value={filterTable} onChange={e => setFilterTable(e.target.value)}>
              <option value="">Бүгд</option>
              {tables.map(t => (
                <option key={t} value={t}>{TABLE_ICONS[t] || '📄'} {t}</option>
              ))}
            </select>
          </div>
          <div className="filter-group" style={{ flex: 1 }}>
            <span className="filter-label">Хэрэглэгчээр хайх</span>
            <input className="search-inp" placeholder="Нэр, хүснэгт..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-group" style={{ flexDirection: 'row', gap: 6 }}>
            <button className="btn-filter" onClick={loadLogs}>🔍 Шүүх</button>
            <button className="btn-reset" onClick={() => { setDateFrom(''); setDateTo(''); setFilterAction(''); setFilterTable(''); setSearch(''); }}>✕</button>
            <button className="btn-excel" onClick={exportExcel} disabled={exporting}>
              {exporting ? '⏳' : '📥'} Excel
            </button>
          </div>
        </div>
      </div>

      {/* ЛОГ ХҮСНЭГТ */}
      <div className="tbl-wrap">
        <div className="tbl-info">
          <span><b>{filtered.length}</b> лог олдлоо · Нийт <b>{logs.length}</b></span>
          {totalPages > 1 && <span>Хуудас {page} / {totalPages}</span>}
        </div>
        <div className="tbl-head">
          <div>Үйлдэл</div>
          <div>Хүснэгт</div>
          <div>Хэрэглэгч</div>
          <div className="hide-md">IP хаяг</div>
          <div className="hide-md">Record ID</div>
          <div>Огноо & цаг</div>
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '90px 130px 1fr 100px 90px 130px', gap: 8 }}>
              {[70, 100, 160, 80, 50, 100].map((w, j) => <div key={j} className="skel" style={{ height: 11, width: w }} />)}
            </div>
          ))
        ) : paginated.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Лог байхгүй байна</div>
          </div>
        ) : paginated.map((log, i) => {
          const as = ACTION_STYLE[log.action] || { bg: '#f1f5f9', color: '#64748b', icon: '📄' };
          return (
            <div key={log.id} className="tbl-row">
              <div>
                <span className="badge" style={{ background: as.bg, color: as.color }}>
                  {as.icon} {log.action}
                </span>
              </div>
              <div>
                <span className="table-tag">
                  {TABLE_ICONS[log.table_name] || '📄'} {log.table_name}
                </span>
              </div>
              <div style={{ fontSize: 12 }}>
                {log.users ? (
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {log.users.last_name} {log.users.first_name}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{log.users.role}</div>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                )}
              </div>
              <div className="hide-md" style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                {log.ip_address || '—'}
              </div>
              <div className="hide-md" style={{ fontSize: 11, color: '#64748b' }}>
                {log.record_id ? `#${log.record_id}` : '—'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {new Date(log.created_at).toLocaleString('mn-MN')}
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="pg-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
            <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const p = page <= 4 ? i + 1 : page + i - 3;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} className={`pg-btn ${page === p ? 'on' : ''}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
