'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface Order {
  id: number;
  order_no: string;
  status: string;
  total_amount: number;
  note: string;
  created_at: string;
  users_orders_user_idTousers: { first_name: string; last_name: string; email: string };
  calculations: { furniture_types: { name: string } } | null;
  payments: { status: string; method: string }[];
}

interface Worker { id: number; first_name: string; last_name: string; }

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Хүлээгдэж байна', color: '#ca8a04', bg: '#fef9c3' },
  confirmed:   { label: 'Баталгаажсан',    color: '#2563eb', bg: '#fef3c7' },
  assigned:    { label: 'Хуваарилагдсан',  color: '#7c3aed', bg: '#fef3c7' },
  in_progress: { label: 'Гүйцэтгэж байна', color: '#2563eb', bg: '#fef3c7' },
  done:        { label: 'Дууссан',          color: '#059669', bg: '#dcfce7' },
  cancelled:   { label: 'Цуцлагдсан',      color: '#ef4444', bg: '#fee2e2' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user'); const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t); else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['order_processor','admin','super_admin','worker'].includes(user.role)) { router.push('/dashboard'); return; }
    loadOrders();
    if (['order_processor','admin','super_admin'].includes(user.role)) loadWorkers();
  }, [mounted, user]);

  useEffect(() => {
    if (mounted) loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/api/orders?status=${filterStatus}` : '/api/orders';
      const res = await api.get(url);
      setOrders(res.data);
    } finally { setLoading(false); }
  };

  const loadWorkers = async () => {
    const res = await api.get('/api/auth/workers').catch(() => ({ data: [] }));
    setWorkers(res.data);
  };

  const handleAssign = async (orderId: number, workerId: number) => {
    await api.put(`/api/orders/${orderId}/assign`, { worker_id: workerId });
    loadOrders(); setSelected(null);
  };

  const handleStatus = async (orderId: number, status: string) => {
    await api.put(`/api/orders/${orderId}/status`, { status });
    loadOrders(); setSelected(null);
  };

  if (!mounted || !user) return null;

  const isProcessor = ['order_processor','admin','super_admin'].includes(user.role);

  return (
    <AppLayout title="Захиалга удирдах">
      <style>{`
        .filters{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
        .fb{font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:0.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s}
        .fb.active{background:#d97706;color:white;border-color:#d97706}
        .tbl{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .th{display:grid;grid-template-columns:140px 1fr 120px 110px 100px 80px 80px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:8px}
        .tr{display:grid;grid-template-columns:140px 1fr 120px 110px 100px 80px 80px;padding:12px 16px;border-bottom:0.5px solid #f1f5f9;align-items:center;gap:8px;transition:background 0.1s}
        .tr:last-child{border-bottom:none}
        .tr:hover{background:#fafafa}
        .tag{font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;display:inline-block}
        .det-btn{font-size:11px;font-weight:600;padding:5px 10px;border-radius:7px;border:0.5px solid #e2e8f0;background:white;cursor:pointer;color:#d97706;border-color:#fde68a;font-family:inherit}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-height:90vh;overflow-y:auto}
        .info-row{display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:0.5px solid #f1f5f9}
        .info-row:last-of-type{border-bottom:none}
        .action-btn{font-size:12px;font-weight:600;padding:7px 14px;border-radius:8px;border:0.5px solid;cursor:pointer;font-family:inherit;transition:all 0.15s}
        @media(max-width:900px){.th,.tr{grid-template-columns:120px 1fr 100px 80px}.hide-md{display:none}}
        @media(max-width:600px){.th,.tr{grid-template-columns:1fr 90px 60px}.hide-sm{display:none}}
      `}</style>

      {/* Filter */}
      <div className="filters">
        <button className={`fb ${!filterStatus ? 'active' : ''}`} onClick={() => setFilterStatus('')}>
          Бүгд ({orders.length})
        </button>
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} className={`fb ${filterStatus === k ? 'active' : ''}`} onClick={() => setFilterStatus(k)}>
            {v.label} ({orders.filter(o => o.status === k).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="tbl">
        <div className="th">
          <div>Дугаар</div>
          <div>Хэрэглэгч</div>
          <div className="hide-sm">Тавилга</div>
          <div className="hide-md">Дүн ₮</div>
          <div>Төлөв</div>
          <div className="hide-md">Төлбөр</div>
          <div>Үйлдэл</div>
        </div>
        {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Уншиж байна...</div>}
        {!loading && orders.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Захиалга байхгүй байна</div>}
        {!loading && orders.map(o => {
          const st = STATUS[o.status] || { label: o.status, color: '#64748b', bg: '#f1f5f9' };
          const paid = o.payments?.[0]?.status === 'paid';
          return (
            <div key={o.id} className="tr">
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#d97706', fontWeight: 600 }}>{o.order_no}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {o.users_orders_user_idTousers?.last_name} {o.users_orders_user_idTousers?.first_name}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.users_orders_user_idTousers?.email}</div>
              </div>
              <div className="hide-sm" style={{ fontSize: 12, color: '#64748b' }}>{o.calculations?.furniture_types?.name || '—'}</div>
              <div className="hide-md" style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>₮{Number(o.total_amount).toLocaleString()}</div>
              <div><span className="tag" style={{ background: st.bg, color: st.color }}>{st.label}</span></div>
              <div className="hide-md">
                <span className="tag" style={{ background: paid ? '#dcfce7' : '#fee2e2', color: paid ? '#166534' : '#991b1b' }}>
                  {paid ? 'Төлсөн' : 'Төлөөгүй'}
                </span>
              </div>
              <div><button className="det-btn" onClick={() => setSelected(o)}>Харах</button></div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{selected.order_no}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>

            {[
              { label: 'Хэрэглэгч', val: `${selected.users_orders_user_idTousers?.last_name} ${selected.users_orders_user_idTousers?.first_name}` },
              { label: 'Тавилга', val: selected.calculations?.furniture_types?.name || '—' },
              { label: 'Нийт дүн', val: `₮${Number(selected.total_amount).toLocaleString()}` },
              { label: 'Огноо', val: new Date(selected.created_at).toLocaleDateString('mn-MN') },
            ].map(r => (
              <div key={r.label} className="info-row">
                <span style={{ color: '#64748b' }}>{r.label}</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.val}</span>
              </div>
            ))}

            <div style={{ marginTop: 14, marginBottom: 8 }}>
              <span className="tag" style={{ background: STATUS[selected.status]?.bg || '#f1f5f9', color: STATUS[selected.status]?.color || '#64748b' }}>
                {STATUS[selected.status]?.label || selected.status}
              </span>
            </div>

            {selected.note && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#374151', margin: '10px 0' }}>
                📝 {selected.note}
              </div>
            )}

            {/* Ажилтанд хуваарилах */}
            {isProcessor && selected.status === 'pending' && workers.length > 0 && (
              <div style={{ borderTop: '0.5px solid #f1f5f9', paddingTop: 14, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ажилтанд хуваарилах</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {workers.map(w => (
                    <button key={w.id}
                      className="action-btn"
                      style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#c4b5fd' }}
                      onClick={() => handleAssign(selected.id, w.id)}
                    >
                      {w.last_name} {w.first_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Төлөв өөрчлөх — worker */}
            {user?.role === 'worker' && ['assigned','in_progress'].includes(selected.status) && (
              <div style={{ borderTop: '0.5px solid #f1f5f9', paddingTop: 14, marginTop: 10, display: 'flex', gap: 8 }}>
                {selected.status === 'assigned' && (
                  <button className="action-btn" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }}
                    onClick={() => handleStatus(selected.id, 'in_progress')}>
                    🚀 Эхлүүлэх
                  </button>
                )}
                {selected.status === 'in_progress' && (
                  <button className="action-btn" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}
                    onClick={() => handleStatus(selected.id, 'done')}>
                    ✅ Дуусгах
                  </button>
                )}
              </div>
            )}

            {/* Цуцлах */}
            {isProcessor && !['done','cancelled'].includes(selected.status) && (
              <div style={{ borderTop: '0.5px solid #f1f5f9', paddingTop: 14, marginTop: 10 }}>
                <button className="action-btn" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}
                  onClick={() => handleStatus(selected.id, 'cancelled')}>
                  ❌ Захиалга цуцлах
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
