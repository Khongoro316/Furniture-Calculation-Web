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

export default function ReportsPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user'); const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t); else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['admin','super_admin','accountant','order_processor'].includes(user.role)) { router.push('/dashboard'); return; }
    loadReport(activeTab);
  }, [mounted, user, activeTab]);

  const loadReport = async (tab: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/reports/${tab}`);
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  const exportExcel = async () => {
    const res = await api.get('/api/reports/export/excel', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'report.xlsx'; a.click();
  };

  if (!mounted || !user) return null;

  const visibleTabs = TABS.filter(t => t.roles.includes(user.role));

  const COL_LABELS: Record<string, Record<string, string>> = {
    orders: { order_no: 'Дугаар', customer: 'Хэрэглэгч', furniture: 'Тавилга', total_amount: 'Дүн ₮', status: 'Төлөв', pay_status: 'Төлбөр', created_at: 'Огноо' },
    finance: { order_no: 'Дугаар', customer: 'Хэрэглэгч', amount: 'Дүн ₮', method: 'Арга', paid_at: 'Огноо' },
    materials: { code: 'Код', name: 'Нэр', category: 'Ангилал', type: 'Төрөл', unit: 'Нэгж', price: 'Үнэ ₮', stock: 'Үлдэгдэл' },
    calculations: { id: 'ID', customer: 'Хэрэглэгч', furniture: 'Тавилга', total_area: 'Талбай м²', total_cost: 'Өртөг ₮', created_at: 'Огноо' },
    workers: { name: 'Ажилтан', email: 'Имэйл', total: 'Нийт', done: 'Дууссан', in_progress: 'Гүйцэтгэж байна', pending: 'Хүлээгдэж байна' },
  };

  const cols = COL_LABELS[activeTab] || {};

  return (
    <AppLayout title="Тайлан"
      action={
        <button onClick={exportExcel} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          📥 Excel татах
        </button>
      }
    >
      <style>{`
        .tabs{display:flex;gap:4px;margin-bottom:16px;border-bottom:0.5px solid #e2e8f0;flex-wrap:wrap}
        .tab{font-size:12px;font-weight:600;padding:8px 14px;border:none;background:none;cursor:pointer;color:#64748b;border-bottom:2px solid transparent;transition:all 0.15s;font-family:inherit;white-space:nowrap}
        .tab.active{color:#d97706;border-bottom-color:#d97706}
        .tab:hover{color:#0f172a}
        .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px}
        .sum-card{background:white;border:0.5px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center}
        .sum-label{font-size:11px;color:#64748b;margin-bottom:4px}
        .sum-val{font-size:20px;font-weight:700;color:#0f172a}
        .tbl{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden;overflow-x:auto}
        table{width:100%;border-collapse:collapse;min-width:500px}
        th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap;border-bottom:0.5px solid #e2e8f0}
        td{padding:11px 14px;font-size:12px;color:#374151;border-bottom:0.5px solid #f1f5f9;white-space:nowrap}
        tr:last-child td{border-bottom:none}
        tr:hover td{background:#fafafa}
      `}</style>

      {/* TABS */}
      <div className="tabs">
        {visibleTabs.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>Уншиж байна...</div>}

      {!loading && data && (
        <>
          {/* Summary */}
          <div className="summary">
            <div className="sum-card">
              <div className="sum-label">Нийт</div>
              <div className="sum-val">{data.total || 0}</div>
            </div>
            {data.total_income !== undefined && (
              <div className="sum-card">
                <div className="sum-label">Нийт орлого</div>
                <div className="sum-val" style={{ color: '#059669', fontSize: 16 }}>₮{Number(data.total_income).toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  {Object.keys(cols).map(k => <th key={k}>{cols[k]}</th>)}
                </tr>
              </thead>
              <tbody>
                {(data.data || []).map((row: any, i: number) => (
                  <tr key={i}>
                    {Object.keys(cols).map(k => (
                      <td key={k}>
                        {typeof row[k] === 'number' ? row[k].toLocaleString()
                          : typeof row[k] === 'string' && row[k].includes('T') && row[k].includes('Z')
                          ? new Date(row[k]).toLocaleDateString('mn-MN')
                          : String(row[k] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
                {(data.data || []).length === 0 && (
                  <tr><td colSpan={Object.keys(cols).length} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Өгөгдөл байхгүй байна</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}
