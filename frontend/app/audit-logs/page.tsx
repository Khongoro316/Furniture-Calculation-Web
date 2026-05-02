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
  record_id: number;
  ip_address: string;
  created_at: string;
  users: { first_name: string; last_name: string } | null;
}

const ACTION_STYLE: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: '#dcfce7', color: '#166534' },
  UPDATE: { bg: '#fef9c3', color: '#92400e' },
  DELETE: { bg: '#fee2e2', color: '#991b1b' },
  LOGIN:  { bg: '#fef3c7', color: '#1e40af' },
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user'); const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t); else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role !== 'super_admin') { router.push('/dashboard'); return; }
    loadLogs();
  }, [mounted, user]);

  const loadLogs = async () => {
    const res = await api.get('/api/audit-logs').catch(() => ({ data: [] }));
    setLogs(res.data);
  };

  const filtered = logs.filter(l => !filterAction || l.action === filterAction);

  if (!mounted || !user) return null;

  return (
    <AppLayout title="Лог үйлдэлүүд">
      <style>{`
        .filters{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
        .fb{font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:0.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s}
        .fb.active{background:#d97706;color:white;border-color:#d97706}
        .tbl{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .th{display:grid;grid-template-columns:80px 140px 1fr 80px 140px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:8px}
        .tr{display:grid;grid-template-columns:80px 140px 1fr 80px 140px;padding:11px 16px;border-bottom:0.5px solid #f1f5f9;align-items:center;gap:8px;transition:background 0.1s}
        .tr:last-child{border-bottom:none} .tr:hover{background:#fafafa}
        @media(max-width:700px){.th,.tr{grid-template-columns:80px 1fr 120px}.hide-sm{display:none}}
      `}</style>

      <div className="filters">
        <button className={`fb ${!filterAction ? 'active' : ''}`} onClick={() => setFilterAction('')}>Бүгд ({logs.length})</button>
        {['CREATE','UPDATE','DELETE','LOGIN'].map(a => (
          <button key={a} className={`fb ${filterAction === a ? 'active' : ''}`} onClick={() => setFilterAction(a)}>
            {a} ({logs.filter(l => l.action === a).length})
          </button>
        ))}
      </div>

      <div className="tbl">
        <div className="th">
          <div>Үйлдэл</div>
          <div>Хүснэгт</div>
          <div>Хэрэглэгч</div>
          <div className="hide-sm">ID</div>
          <div>Огноо</div>
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Лог байхгүй байна</div>}
        {filtered.map(log => {
          const as = ACTION_STYLE[log.action] || { bg: '#f1f5f9', color: '#475569' };
          return (
            <div key={log.id} className="tr">
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: as.bg, color: as.color }}>
                  {log.action}
                </span>
              </div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#0891b2' }}>{log.table_name}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>
                {log.users ? `${log.users.last_name} ${log.users.first_name}` : '—'}
                {log.ip_address && <span style={{ color: '#94a3b8', marginLeft: 8 }}>{log.ip_address}</span>}
              </div>
              <div className="hide-sm" style={{ fontSize: 12, color: '#94a3b8' }}>#{log.record_id || '—'}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(log.created_at).toLocaleString('mn-MN')}</div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
