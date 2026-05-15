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
  note?: string;
  created_at: string;
  assigned_to?: number;
  users_orders_user_idTousers?: { first_name: string; last_name: string; email: string; phone?: string };
  users_orders_assigned_toTousers?: { first_name: string; last_name: string; phone?: string; role?: string } | null;
  calculations?: { furniture_types?: { name: string }; calculation_parts?: any[] } | null;
  payments?: { status: string; method: string; amount: number; paid_at?: string }[];
  order_items?: any[];
  order_status_history?: { new_status: string; note?: string; created_at: string; users?: { first_name: string; last_name: string } }[];
}

interface Worker { id: number; first_name: string; last_name: string; role: string; }

const STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:     { label: 'Хүлээгдэж байна', color: '#92400e', bg: '#fef3c7', icon: '⏳' },
  confirmed:   { label: 'Баталгаажсан',    color: '#1d4ed8', bg: '#dbeafe', icon: '✅' },
  assigned:    { label: 'Хуваарилагдсан',  color: '#7c3aed', bg: '#f5f3ff', icon: '👷' },
  in_progress: { label: 'Гүйцэтгэж байна', color: '#075985', bg: '#e0f2fe', icon: '🔄' },
  done:        { label: 'Дууссан',          color: '#166534', bg: '#dcfce7', icon: '🎉' },
  cancelled:   { label: 'Цуцлагдсан',      color: '#991b1b', bg: '#fee2e2', icon: '❌' },
};

const NEXT_STATUS: Record<string, { value: string; label: string; color: string }[]> = {
  pending:     [
    { value: 'confirmed',   label: '✅ Батлах',              color: '#2563eb' },
    { value: 'cancelled',   label: '❌ Цуцлах',               color: '#ef4444' },
  ],
  confirmed:   [
    { value: 'assigned',    label: '👷 Хуваарилах',           color: '#7c3aed' },
    { value: 'cancelled',   label: '❌ Цуцлах',               color: '#ef4444' },
  ],
  assigned:    [
    { value: 'in_progress', label: '🔄 Гүйцэтгэж эхлэх',     color: '#0891b2' },
    { value: 'cancelled',   label: '❌ Цуцлах',               color: '#ef4444' },
  ],
  in_progress: [
    { value: 'done',        label: '🎉 Дуусгах',               color: '#059669' },
  ],
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted]   = useState(false);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [workers, setWorkers]   = useState<Worker[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  const [assignModal, setAssignModal]   = useState<Order | null>(null);
  const [assignWorker, setAssignWorker] = useState<number | null>(null);
  const [assigning, setAssigning]       = useState(false);

  const [statusModal, setStatusModal]     = useState<{ order: Order; next: string } | null>(null);
  const [statusNote, setStatusNote]       = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['order_processor', 'admin', 'worker'].includes(user.role)) {
      router.push('/dashboard'); return;
    }
    loadOrders();
    if (user.role === 'order_processor') loadWorkers();
  }, [mounted, user]);

  useEffect(() => { if (mounted) loadOrders(); }, [filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/api/orders?status=${filterStatus}` : '/api/orders';
      const res = await api.get(url);
      setOrders(res.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  const loadWorkers = async () => {
    const res = await api.get('/api/auth/workers').catch(() => ({ data: [] }));
    setWorkers(res.data || []);
  };

  const loadDetail = async (order: Order) => {
    try {
      const res = await api.get(`/api/orders/${order.id}`);
      setSelected(res.data);
    } catch { setSelected(order); }
  };

  const handleAssign = async () => {
    if (!assignModal || !assignWorker) return;
    setAssigning(true);
    try {
      await api.put(`/api/orders/${assignModal.id}/assign`, { worker_id: assignWorker });
      setAssignModal(null); setAssignWorker(null);
      loadOrders();
      if (selected?.id === assignModal.id) loadDetail(assignModal);
    } catch (err: any) { alert(err.response?.data?.message || 'Алдаа гарлаа'); }
    finally { setAssigning(false); }
  };

  const handleStatus = async () => {
    if (!statusModal) return;
    setStatusUpdating(true);
    try {
      await api.put(`/api/orders/${statusModal.order.id}/status`, {
        status: statusModal.next, note: statusNote || null,
      });
      setStatusModal(null); setStatusNote('');
      loadOrders();
      if (selected?.id === statusModal.order.id) loadDetail(statusModal.order);
    } catch (err: any) { alert(err.response?.data?.message || 'Алдаа гарлаа'); }
    finally { setStatusUpdating(false); }
  };

  const isProcessor = user?.role === 'order_processor';
  const isAdmin     = user?.role === 'admin';
  const isWorker    = user?.role === 'worker';

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.order_no.toLowerCase().includes(q) ||
      o.users_orders_user_idTousers?.first_name?.toLowerCase().includes(q) ||
      o.users_orders_user_idTousers?.last_name?.toLowerCase().includes(q)
    );
  });

  const counts = Object.keys(STATUS).reduce((acc, k) => {
    acc[k] = orders.filter(o => o.status === k).length;
    return acc;
  }, {} as Record<string, number>);

  if (!mounted || !user) return null;

  return (
    <AppLayout title="Захиалга удирдах">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}
        .stat-row{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:16px}
        .stat-card{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:11px 12px;cursor:pointer;transition:all 0.15s;border-left:3px solid transparent}
        .stat-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.07);transform:translateY(-1px)}
        .stat-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px}
        .stat-num{font-size:20px;font-weight:800}
        .filter-bar{display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap}
        .search-inp{flex:1;min-width:200px;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 14px;font-size:13px;outline:none;font-family:inherit;transition:border-color 0.15s}
        .search-inp:focus{border-color:#d97706}
        .tbl-wrap{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
        .tbl-head{display:grid;grid-template-columns:150px 1fr 150px 120px 130px 140px;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:8px;align-items:center}
        .tbl-row{display:grid;grid-template-columns:150px 1fr 150px 120px 130px 140px;padding:12px 16px;border-bottom:1px solid #f1f5f9;align-items:center;gap:8px;transition:background 0.1s;animation:fadeUp 0.3s ease}
        .tbl-row:last-child{border-bottom:none}
        .tbl-row:hover{background:#fafafa}
        .st-badge{font-size:10px;font-weight:700;padding:4px 10px;border-radius:100px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
        .pay-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px}
        .action-btns{display:flex;gap:5px;flex-wrap:wrap}
        .act-btn{font-size:11px;font-weight:600;padding:5px 10px;border-radius:7px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-family:inherit;color:#374151;transition:all 0.15s;white-space:nowrap}
        .act-btn:hover{border-color:#d97706;color:#d97706}
        .act-btn.danger:hover{border-color:#ef4444;color:#ef4444;background:#fef2f2}
        .act-btn.primary{background:#d97706;color:white;border-color:#d97706}
        .act-btn.primary:hover{background:#b45309;border-color:#b45309;color:white}
        .detail-panel{position:fixed;top:0;right:0;width:460px;height:100vh;background:white;border-left:1px solid #e2e8f0;box-shadow:-8px 0 32px rgba(0,0,0,0.1);z-index:200;display:flex;flex-direction:column;animation:slideIn 0.25s ease}
        .dp-head{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .dp-body{flex:1;overflow-y:auto;padding:16px 20px;padding-bottom:24px}
        .dp-foot{padding:12px 20px;border-top:1px solid #f1f5f9;flex-shrink:0}
        .dp-close{width:28px;height:28px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:16px;color:#64748b;display:flex;align-items:center;justify-content:center}
        .dp-close:hover{background:#e2e8f0}
        .dp-section{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid #f1f5f9}
        .dp-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f8fafc;font-size:12px}
        .dp-key{color:#64748b;font-weight:500}
        .dp-val{font-weight:700;color:#0f172a;text-align:right;max-width:60%}
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:18px;width:100%;max-width:420px;box-shadow:0 24px 80px rgba(0,0,0,0.2);overflow:hidden}
        .modal-head{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .modal-title{font-size:15px;font-weight:800;color:#0f172a}
        .mclose{width:28px;height:28px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:16px;color:#64748b;display:flex;align-items:center;justify-content:center}
        .modal-body{padding:18px 20px}
        .modal-foot{display:flex;gap:10px;padding:14px 20px;border-top:1px solid #f1f5f9}
        .btn-primary{flex:1;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-primary:disabled{opacity:0.55;cursor:not-allowed}
        .btn-cancel{background:#f1f5f9;color:#374151;border:none;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
        .worker-card{border:2px solid #e2e8f0;border-radius:11px;padding:12px 14px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:10px;margin-bottom:8px}
        .worker-card:hover{border-color:#d97706}
        .worker-card.on{border-color:#d97706;background:#fffbf5}
        .note-inp{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;resize:none;margin-top:4px;transition:border-color 0.15s}
        .note-inp:focus{border-color:#d97706}
        .empty{text-align:center;padding:56px 20px;color:#94a3b8}
        @media(max-width:1200px){.tbl-head,.tbl-row{grid-template-columns:130px 1fr 110px 110px 130px}.hide-lg{display:none}}
        @media(max-width:900px){.stat-row{grid-template-columns:repeat(4,1fr)}.detail-panel{width:100%}}
      `}</style>

      {/* СТАТИСТИК */}
      <div className="stat-row">
        <div className="stat-card" style={{ borderLeftColor: !filterStatus ? '#d97706' : 'transparent' }} onClick={() => setFilterStatus('')}>
          <div className="stat-label">Нийт</div>
          <div className="stat-num" style={{ color: '#0f172a' }}>{orders.length}</div>
        </div>
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} className="stat-card" style={{ borderLeftColor: filterStatus === k ? v.color : 'transparent' }}
            onClick={() => setFilterStatus(filterStatus === k ? '' : k)}>
            <div className="stat-label">{v.icon} {v.label.split(' ')[0]}</div>
            <div className="stat-num" style={{ color: v.color }}>{counts[k] || 0}</div>
          </div>
        ))}
      </div>

      {/* ШҮҮЛТ */}
      <div className="filter-bar">
        <input className="search-inp" placeholder="🔍 Дугаар, хэрэглэгчийн нэрээр хайх..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {filterStatus && (
          <button onClick={() => setFilterStatus('')}
            style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            × Шүүлт арилгах
          </button>
        )}
      </div>

      {/* ХҮСНЭГТ */}
      <div className="tbl-wrap">
        <div className="tbl-head">
          <div>Дугаар</div>
          <div>Хэрэглэгч</div>
          <div className="hide-lg">Тавилга</div>
          <div>Дүн</div>
          <div>Төлөв</div>
          <div>Үйлдэл</div>
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 150px 120px 130px 140px', padding: '13px 16px', gap: 8, alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              {[100, 180, 100, 70, 90, 110].map((w, j) => <div key={j} className="skel" style={{ height: 11, width: w }} />)}
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
              {filterStatus ? `"${STATUS[filterStatus]?.label}" захиалга байхгүй` : 'Захиалга байхгүй байна'}
            </div>
          </div>
        ) : filtered.map(order => {
          const st = STATUS[order.status] || STATUS.pending;
          const customer = order.users_orders_user_idTousers;
          const canAssign = isProcessor && order.status === 'confirmed' && workers.length > 0;
          return (
            <div key={order.id} className="tbl-row">
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#d97706' }}>{order.order_no}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{new Date(order.created_at).toLocaleDateString('mn-MN')}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {customer ? `${customer.last_name} ${customer.first_name}` : '—'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{customer?.email || ''}</div>
              </div>
              <div className="hide-lg" style={{ fontSize: 12, color: '#374151' }}>
                {order.calculations?.furniture_types?.name || 'Материал захиалга'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>₮{Number(order.total_amount).toLocaleString()}</div>
                {order.payments && order.payments.length > 0 && (
                  <span className="pay-badge" style={{ background: order.payments[0].status === 'paid' ? '#dcfce7' : '#fef3c7', color: order.payments[0].status === 'paid' ? '#166534' : '#92400e' }}>
                    {order.payments[0].status === 'paid' ? '✓ Төлөгдсөн' : '⏳ Хүлээгдэж байна'}
                  </span>
                )}
              </div>
              <div>
                <span className="st-badge" style={{ background: st.bg, color: st.color }}>{st.icon} {st.label}</span>
              </div>
              <div className="action-btns">
                <button className="act-btn" onClick={() => loadDetail(order)}>📋 Харах</button>
                {isProcessor && order.status === 'pending' && (
                  <button className="act-btn primary" onClick={() => { setStatusModal({ order, next: 'confirmed' }); setStatusNote(''); }}>✅ Батлах</button>
                )}
                {canAssign && (
                  <button className="act-btn" style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
                    onClick={() => { setAssignModal(order); setAssignWorker(null); }}>👷 Хуваарилах</button>
                )}
                {isWorker && order.status === 'in_progress' && (
                  <button className="act-btn primary" onClick={() => { setStatusModal({ order, next: 'done' }); setStatusNote(''); }}>🎉 Дуусгах</button>
                )}
                {isProcessor && ['pending', 'confirmed'].includes(order.status) && (
                  <button className="act-btn danger" onClick={() => { setStatusModal({ order, next: 'cancelled' }); setStatusNote(''); }}>❌ Цуцлах</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ ДЭЛГЭРЭНГҮЙ PANEL ═══ */}
      {selected && (
        <div>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setSelected(null)} />
          <div className="detail-panel">
            <div className="dp-head">
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Захиалгын дэлгэрэнгүй</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#d97706', fontWeight: 700 }}>{selected.order_no}</div>
              </div>
              <button className="dp-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="dp-body">
              {/* Төлөв */}
              <div style={{ background: STATUS[selected.status]?.bg || '#f1f5f9', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 26 }}>{STATUS[selected.status]?.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: STATUS[selected.status]?.color }}>{STATUS[selected.status]?.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>Захиалга #{selected.order_no}</div>
                </div>
              </div>

              {/* Захиалагч */}
              <div className="dp-section">👤 Захиалагчийн мэдээлэл</div>
              <div style={{ background: '#f8fafc', borderRadius: 11, padding: '10px 14px' }}>
                {[
                  { k: 'Нэр',    v: selected.users_orders_user_idTousers ? `${selected.users_orders_user_idTousers.last_name} ${selected.users_orders_user_idTousers.first_name}` : '—' },
                  { k: 'Имэйл', v: selected.users_orders_user_idTousers?.email || '—' },
                  { k: 'Утас',   v: selected.users_orders_user_idTousers?.phone || '—' },
                  { k: 'Огноо', v: new Date(selected.created_at).toLocaleString('mn-MN') },
                ].map(r => (
                  <div key={r.k} className="dp-row"><span className="dp-key">{r.k}</span><span className="dp-val">{r.v}</span></div>
                ))}
                {selected.note && (
                  <div style={{ background: '#fef3c7', borderRadius: 8, padding: '7px 10px', marginTop: 8, fontSize: 12, color: '#92400e' }}>📝 {selected.note}</div>
                )}
              </div>

              {/* Хуваарилагдсан ажилтан */}
              {selected.users_orders_assigned_toTousers && (
                <>
                  <div className="dp-section">👷 Хуваарилагдсан ажилтан</div>
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 11, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {selected.users_orders_assigned_toTousers.first_name?.[0]}{selected.users_orders_assigned_toTousers.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {selected.users_orders_assigned_toTousers.last_name} {selected.users_orders_assigned_toTousers.first_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>Ажилтан</div>
                      {selected.users_orders_assigned_toTousers.phone && (
                        <div style={{ fontSize: 11, color: '#64748b' }}>📞 {selected.users_orders_assigned_toTousers.phone}</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Захиалсан материал */}
              {(() => {
                const matItems = (selected.order_items || []).filter((i: any) => i.item_type === 'material' || i.materials);
                if (matItems.length === 0) return null;
                return (
                  <>
                    <div className="dp-section">🪵 Захиалсан материал</div>
                    {matItems.map((item: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, marginBottom: 6 }}>
                        {item.materials?.material_images?.[0]?.url ? (
                          <img src={item.materials.material_images[0].url} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🪵</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.materials?.name || item.description || '—'}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                            {item.materials?.material_types?.material_categories?.name}
                            {item.materials?.material_types?.name ? ` · ${item.materials.material_types.name}` : ''}
                            {item.materials?.thickness ? ` · ${item.materials.thickness}мм` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{Number(item.qty || 1).toFixed(2)} {item.unit || item.materials?.unit || ''}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>₮{Number(item.subtotal || item.unit_price * item.qty).toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>₮{Number(item.unit_price).toLocaleString()} / {item.unit || item.materials?.unit}</div>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}

              {/* Үйлчилгээ */}
              {(() => {
                const svcItems = (selected.order_items || []).filter((i: any) => i.item_type === 'service' || i.services);
                if (svcItems.length === 0) return null;
                return (
                  <>
                    <div className="dp-section">✂️ Нэмэлт үйлчилгээ</div>
                    {svcItems.map((item: any, idx: number) => {
                      const svcName = item.services?.name || item.description || '—';
                      const isCut  = svcName.toLowerCase().includes('зүс');
                      const isEdge = svcName.toLowerCase().includes('ирмэг');
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isCut ? '#fff7ed' : isEdge ? '#f0fdf4' : '#f8fafc', borderRadius: 10, marginBottom: 6, border: `1px solid ${isCut ? '#fed7aa' : isEdge ? '#bbf7d0' : '#f1f5f9'}` }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: isCut ? '#fef3c7' : isEdge ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                            {isCut ? '✂️' : isEdge ? '📏' : '🔧'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{svcName}</div>
                            {item.services?.service_types?.name && <div style={{ fontSize: 11, color: '#64748b' }}>{item.services.service_types.name}</div>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{Number(item.qty || 1).toFixed(2)} {item.unit || item.services?.unit || ''}</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>₮{Number(item.subtotal || item.unit_price * item.qty).toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}

              {/* Тооцооллын хавтан */}
              {(selected.calculations as any)?.calculation_parts?.length > 0 && (
                <>
                  <div className="dp-section">📐 Тооцооллын хавтангууд</div>
                  <div style={{ borderRadius: 11, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 44px 64px', padding: '7px 12px', background: '#f1f5f9', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', gap: 4 }}>
                      <div>Эд анги</div><div>Өрг мм</div><div>Өнд мм</div><div>Тоо</div><div>м²</div>
                    </div>
                    {(selected.calculations as any).calculation_parts.map((p: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 44px 64px', padding: '7px 12px', borderTop: '1px solid #f1f5f9', fontSize: 11, gap: 4, alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.part_label || p.description}</div>
                        <div style={{ color: '#d97706', fontFamily: 'monospace', fontWeight: 700 }}>{p.width_mm}</div>
                        <div style={{ color: '#d97706', fontFamily: 'monospace', fontWeight: 700 }}>{p.height_mm}</div>
                        <div><span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100 }}>×{p.qty}</span></div>
                        <div style={{ fontWeight: 700 }}>{Number(p.area_m2 || 0).toFixed(4)}</div>
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 44px 64px', padding: '8px 12px', background: '#fef3c7', fontSize: 11, fontWeight: 800, color: '#92400e', gap: 4, borderTop: '1px solid #fde68a' }}>
                      <div>Нийт (+10%)</div><div /><div /><div />
                      <div>{((selected.calculations as any).calculation_parts.reduce((s: number, p: any) => s + Number(p.area_m2 || 0), 0) * 1.1).toFixed(4)}</div>
                    </div>
                  </div>
                </>
              )}

              {/* Төлбөр */}
              {selected.payments && selected.payments.length > 0 && (
                <>
                  <div className="dp-section">💳 Төлбөр</div>
                  {selected.payments.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: p.status === 'paid' ? '#f0fdf4' : '#fef3c7', borderRadius: 10, marginBottom: 6, border: `1px solid ${p.status === 'paid' ? '#86efac' : '#fde68a'}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                          {p.method === 'cash' ? '💵 Бэлэн' : p.method === 'transfer' ? '🏦 Шилжүүлэг' : '📱 QPay'}
                        </div>
                        {p.paid_at && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{new Date(p.paid_at).toLocaleString('mn-MN')}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>₮{Number(p.amount).toLocaleString()}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: p.status === 'paid' ? '#dcfce7' : '#fef9c3', color: p.status === 'paid' ? '#166534' : '#92400e' }}>
                          {p.status === 'paid' ? '✓ Төлөгдсөн' : '⏳ Хүлээгдэж байна'}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Нийт */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'linear-gradient(135deg,#1c1917,#292524)', borderRadius: 12, marginTop: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>Нийт дүн</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>₮{Number(selected.total_amount).toLocaleString()}</span>
              </div>

              {/* Явцын түүх */}
              {selected.order_status_history && selected.order_status_history.length > 0 && (
                <>
                  <div className="dp-section">📋 Явц / Түүх</div>
                  <div style={{ position: 'relative', paddingLeft: 20 }}>
                    <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#e2e8f0', borderRadius: 1 }} />
                    {selected.order_status_history.map((h: any, i: number) => (
                      <div key={i} style={{ position: 'relative', paddingBottom: 14 }}>
                        <div style={{ position: 'absolute', left: -17, top: 3, width: 12, height: 12, borderRadius: '50%', background: STATUS[h.new_status]?.color || '#94a3b8', border: '2px solid white', boxShadow: `0 0 0 2px ${STATUS[h.new_status]?.color || '#94a3b8'}44` }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: STATUS[h.new_status]?.color || '#374151' }}>
                          {STATUS[h.new_status]?.icon} {STATUS[h.new_status]?.label || h.new_status}
                        </div>
                        {h.users && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{h.users.last_name} {h.users.first_name}</div>}
                        {h.note && <div style={{ fontSize: 11, color: '#374151', background: '#f8fafc', borderRadius: 6, padding: '4px 8px', marginTop: 3 }}>{h.note}</div>}
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{new Date(h.created_at).toLocaleString('mn-MN')}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Доод товчнууд */}
            {(isProcessor || isWorker) && (
              <div className="dp-foot">
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Төлөв шинэчлэх:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {isProcessor && selected.status === 'confirmed' && workers.length > 0 && (
                    <button className="act-btn" style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
                      onClick={() => { setAssignModal(selected); setAssignWorker(null); }}>
                      👷 Ажилтанд хуваарилах
                    </button>
                  )}
                  {(NEXT_STATUS[selected.status] || []).map(ns => (
                    <button key={ns.value}
                      style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', border: `1.5px solid ${ns.color}`, color: ns.color, borderRadius: 9, background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => { setStatusModal({ order: selected, next: ns.value }); setStatusNote(''); }}>
                      {ns.label}
                    </button>
                  ))}
                  {isWorker && selected.status === 'in_progress' && (
                    <button className="act-btn primary"
                      onClick={() => { setStatusModal({ order: selected, next: 'done' }); setStatusNote(''); }}>
                      🎉 Ажил дуусгах
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ХУВААРИЛАХ MODAL ═══ */}
      {assignModal && (
        <div className="modal-bg" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">👷 Ажилтанд хуваарилах</div>
              <button className="mclose" onClick={() => setAssignModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                <b style={{ color: '#d97706', fontFamily: 'monospace' }}>{assignModal.order_no}</b> захиалгыг хэнд хуваарилах вэ?
              </div>
              {workers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>Ажилтан байхгүй байна</div>
              ) : workers.map(w => (
                <div key={w.id} className={`worker-card ${assignWorker === w.id ? 'on' : ''}`} onClick={() => setAssignWorker(w.id)}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: assignWorker === w.id ? '#d97706' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: assignWorker === w.id ? 'white' : '#374151', flexShrink: 0 }}>
                    {w.first_name?.[0]}{w.last_name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: assignWorker === w.id ? '#d97706' : '#0f172a' }}>{w.last_name} {w.first_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Ажилтан</div>
                  </div>
                  {assignWorker === w.id && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>✓</div>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn-cancel" onClick={() => setAssignModal(null)}>Болих</button>
              <button className="btn-primary" onClick={handleAssign} disabled={!assignWorker || assigning}>
                {assigning ? '⏳...' : '👷 Хуваарилах'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ТӨЛӨВ ӨӨРЧЛӨХ MODAL ═══ */}
      {statusModal && (
        <div className="modal-bg" onClick={() => setStatusModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{STATUS[statusModal.next]?.icon} Төлөв өөрчлөх</div>
              <button className="mclose" onClick={() => setStatusModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: STATUS[statusModal.next]?.bg || '#f1f5f9', borderRadius: 11, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: STATUS[statusModal.next]?.color }}>
                  {STATUS[statusModal.next]?.icon} {STATUS[statusModal.next]?.label}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                  <b style={{ fontFamily: 'monospace' }}>{statusModal.order.order_no}</b>-г энэ төлөвт шилжүүлэх үү?
                </div>
              </div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Тэмдэглэл (заавал биш)</label>
              <textarea className="note-inp" rows={3} placeholder="Тайлбар нэмэх..."
                value={statusNote} onChange={e => setStatusNote(e.target.value)} />
            </div>
            <div className="modal-foot">
              <button className="btn-cancel" onClick={() => setStatusModal(null)}>Болих</button>
              <button className="btn-primary" onClick={handleStatus} disabled={statusUpdating}
                style={{ background: statusModal.next === 'cancelled' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : undefined }}>
                {statusUpdating ? '⏳...' : STATUS[statusModal.next]?.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}