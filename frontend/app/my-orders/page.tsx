'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

const STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:     { label: 'Хүлээгдэж байна', color: '#92400e', bg: '#fef3c7', icon: '⏳' },
  confirmed:   { label: 'Баталгаажсан',    color: '#1d4ed8', bg: '#dbeafe', icon: '✅' },
  assigned:    { label: 'Хуваарилагдсан',  color: '#7c3aed', bg: '#f5f3ff', icon: '👷' },
  in_progress: { label: 'Гүйцэтгэж байна', color: '#075985', bg: '#e0f2fe', icon: '🔄' },
  done:        { label: 'Дууссан',          color: '#166534', bg: '#dcfce7', icon: '🎉' },
  cancelled:   { label: 'Цуцлагдсан',      color: '#991b1b', bg: '#fee2e2', icon: '❌' },
};

const STEPS = ['pending','confirmed','assigned','in_progress','done'];

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) { setAuth(JSON.parse(u), t); setMounted(true); }
    else router.push('/auth/login');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadOrders();
  }, [mounted, filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/api/orders/my?status=${filterStatus}` : '/api/orders/my';
      const res = await api.get(url);
      setOrders(res.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  const filtered = orders.filter(o => !filterStatus || o.status === filterStatus);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f1f5f9;-webkit-font-smoothing:antialiased}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}

        .topnav{background:white;border-bottom:1px solid #e2e8f0;height:62px;display:flex;align-items:center;padding:0 32px;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .back{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border:none;background:none;font-family:inherit;padding:7px 12px;border-radius:9px;transition:all 0.15s}
        .back:hover{background:#f1f5f9;color:#0f172a}
        .nav-title{font-size:16px;font-weight:800;color:#0f172a;margin-left:6px}
        .nav-r{margin-left:auto;display:flex;gap:8px}

        .main{max-width:900px;margin:0 auto;padding:24px}

        /* STATS */
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
        .stat{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px}
        .stat-label{font-size:11px;color:#64748b;font-weight:500;margin-bottom:5px}
        .stat-val{font-size:24px;font-weight:800;color:#0f172a}

        /* FILTER */
        .flt-row{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
        .flt{font-size:12px;font-weight:600;padding:7px 14px;border-radius:100px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-family:inherit;color:#64748b;transition:all 0.15s;white-space:nowrap}
        .flt.on{background:#1c1917;color:white;border-color:#1c1917}
        .flt:hover:not(.on){border-color:#d97706;color:#d97706}

        /* ORDER CARDS */
        .order-card{background:white;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;cursor:pointer;transition:all 0.2s;margin-bottom:12px;animation:slideUp 0.3s ease}
        .order-card:hover{border-color:#d97706;box-shadow:0 8px 24px rgba(0,0,0,0.08);transform:translateY(-2px)}
        .oc-top{padding:18px 20px 14px;display:flex;align-items:flex-start;gap:14px}
        .oc-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .oc-no{font-size:13px;font-weight:800;color:#d97706;font-family:monospace;margin-bottom:3px}
        .oc-furn{font-size:14px;font-weight:700;color:#0f172a;margin-bottom:3px}
        .oc-date{font-size:11px;color:#94a3b8}
        .oc-right{margin-left:auto;text-align:right;flex-shrink:0}
        .oc-amt{font-size:18px;font-weight:800;color:#0f172a}
        .oc-unit{font-size:11px;color:#94a3b8;margin-top:2px}
        .st-badge{font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;display:inline-block;margin-top:5px}

        /* PROGRESS BAR */
        .progress-wrap{padding:0 20px 18px}
        .prog-track{position:relative;height:4px;background:#f1f5f9;border-radius:2px;margin:8px 0 18px}
        .prog-fill{position:absolute;left:0;top:0;height:100%;background:linear-gradient(90deg,#d97706,#b45309);border-radius:2px;transition:width 0.4s ease}
        .prog-steps{display:flex;justify-content:space-between}
        .prog-step{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}
        .prog-dot{width:20px;height:20px;border-radius:50%;border:2px solid #e2e8f0;background:white;display:flex;align-items:center;justify-content:center;font-size:9px;transition:all 0.3s;flex-shrink:0}
        .prog-dot.done{background:#d97706;border-color:#d97706;color:white}
        .prog-dot.active{background:#d97706;border-color:#d97706;color:white;box-shadow:0 0 0 4px rgba(217,119,6,0.2)}
        .prog-step-label{font-size:9px;color:#94a3b8;text-align:center;line-height:1.3;max-width:60px}
        .prog-step-label.active{color:#d97706;font-weight:700}

        /* DETAIL */
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(5px)}
        .detail-modal{background:white;border-radius:22px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.22);animation:slideUp 0.3s ease}
        .dm-head{padding:20px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2}
        .dm-title{font-size:16px;font-weight:800;color:#0f172a}
        .dm-no{font-size:12px;font-family:monospace;color:#d97706;font-weight:700;margin-top:2px}
        .dclose{width:30px;height:30px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:18px;color:#64748b;display:flex;align-items:center;justify-content:center;line-height:1}
        .dm-body{padding:20px 22px}
        .dm-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f8fafc;font-size:13px}
        .dm-row:last-child{border-bottom:none}
        .dm-key{color:#64748b;font-weight:500}
        .dm-val{font-weight:600;color:#0f172a;text-align:right}
        .dm-mat-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f8fafc}
        .dm-mat-img{width:40px;height:40px;border-radius:10px;object-fit:cover;border:1px solid #e2e8f0;flex-shrink:0}
        .dm-mat-ph{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}

        .empty{text-align:center;padding:60px 0;color:#94a3b8}
        @media(max-width:600px){.stats{grid-template-columns:1fr 1fr}.topnav{padding:0 16px}.main{padding:16px}}
      `}</style>

      <nav className="topnav">
        <button className="back" onClick={() => router.back()}>← Буцах</button>
        <span className="nav-title">📦 Миний захиалгууд</span>
        <div className="nav-r">
          <button onClick={() => router.push('/cart')} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🛒 Сагс
          </button>
        </div>
      </nav>

      <div className="main">
        {/* Статистик */}
        <div className="stats">
          {[
            { label: 'Нийт захиалга',   val: orders.length,                                      color: '#0f172a' },
            { label: 'Хүлээгдэж байна', val: orders.filter(o => o.status==='pending').length,     color: '#d97706' },
            { label: 'Гүйцэтгэж байна', val: orders.filter(o => o.status==='in_progress').length, color: '#0891b2' },
            { label: 'Дууссан',         val: orders.filter(o => o.status==='done').length,         color: '#059669' },
          ].map(s => (
            <div key={s.label} className="stat">
              <div className="stat-label">{s.label}</div>
              <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Шүүлт */}
        <div className="flt-row">
          <button className={`flt ${!filterStatus?'on':''}`} onClick={() => setFilterStatus('')}>
            Бүгд ({orders.length})
          </button>
          {Object.entries(STATUS).map(([k, v]) => {
            const cnt = orders.filter(o => o.status === k).length;
            if (cnt === 0) return null;
            return (
              <button key={k} className={`flt ${filterStatus===k?'on':''}`} onClick={() => setFilterStatus(k===filterStatus?'':k)}>
                {v.icon} {v.label} ({cnt})
              </button>
            );
          })}
        </div>

        {/* Захиалгын жагсаалт */}
        {loading ? (
          Array.from({length:3}).map((_,i) => (
            <div key={i} style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:18, padding:20, marginBottom:12 }}>
              <div className="skel" style={{ height:16, width:'40%', marginBottom:10 }} />
              <div className="skel" style={{ height:12, width:'60%', marginBottom:8 }} />
              <div className="skel" style={{ height:10, width:'30%' }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize:52, marginBottom:14 }}>📭</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#374151', marginBottom:8 }}>Захиалга байхгүй байна</div>
            <div style={{ fontSize:13, marginBottom:24 }}>Сагснаас материал сонгон захиалга өгнө үү</div>
            <button onClick={() => router.push('/cart')} style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'white', border:'none', borderRadius:11, padding:'11px 24px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              🛒 Сагс руу очих
            </button>
          </div>
        ) : filtered.map(order => {
          const st = STATUS[order.status] || STATUS.pending;
          const stepIdx = STEPS.indexOf(order.status);
          const progPct = order.status === 'cancelled' ? 0 : stepIdx >= 0 ? ((stepIdx + 1) / STEPS.length) * 100 : 0;

          return (
            <div key={order.id} className="order-card" onClick={() => setSelected(order)}>
              <div className="oc-top">
                <div className="oc-icon" style={{ background: st.bg }}>{st.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="oc-no">{order.order_no}</div>
                  <div className="oc-furn">
                    {order.calculations?.furniture_types?.name || 'Материалын захиалга'}
                  </div>
                  <div className="oc-date">
                    {new Date(order.created_at).toLocaleDateString('mn-MN', { year:'numeric', month:'long', day:'numeric' })}
                  </div>
                </div>
                <div className="oc-right">
                  <div className="oc-amt">₮{Number(order.total_amount).toLocaleString()}</div>
                  <div className="st-badge" style={{ background: st.bg, color: st.color }}>{st.label}</div>
                </div>
              </div>

              {/* Progress bar */}
              {order.status !== 'cancelled' && (
                <div className="progress-wrap">
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width: `${progPct}%` }} />
                  </div>
                  <div className="prog-steps">
                    {STEPS.map((s, i) => {
                      const isDone = stepIdx > i;
                      const isActive = stepIdx === i;
                      return (
                        <div key={s} className="prog-step">
                          <div className={`prog-dot ${isDone||isActive ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                            {isDone ? '✓' : i+1}
                          </div>
                          <span className={`prog-step-label ${isActive ? 'active' : ''}`}>
                            {STATUS[s]?.label.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Дэлгэрэнгүй modal */}
      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-head">
              <div>
                <div className="dm-title">Захиалгын дэлгэрэнгүй</div>
                <div className="dm-no">{selected.order_no}</div>
              </div>
              <button className="dclose" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="dm-body">
              {/* Статус */}
              <div style={{ background: STATUS[selected.status]?.bg || '#f1f5f9', borderRadius: 12, padding: '14px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{STATUS[selected.status]?.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: STATUS[selected.status]?.color }}>{STATUS[selected.status]?.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Захиалгын төлөв</div>
                </div>
              </div>

              {/* Мэдээлэл */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                {[
                  { key: 'Захиалгын дугаар', val: selected.order_no },
                  { key: 'Тавилгын төрөл', val: selected.calculations?.furniture_types?.name || 'Материалын захиалга' },
                  { key: 'Нийт дүн', val: `₮${Number(selected.total_amount).toLocaleString()}` },
                  { key: 'Огноо', val: new Date(selected.created_at).toLocaleString('mn-MN') },
                  { key: 'Тэмдэглэл', val: selected.note || '—' },
                ].map(r => (
                  <div key={r.key} className="dm-row">
                    <span className="dm-key">{r.key}</span>
                    <span className="dm-val">{r.val}</span>
                  </div>
                ))}
              </div>

              {/* Материалын жагсаалт */}
              {selected.order_items?.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Захиалсан материал</div>
                  {selected.order_items.map((item: any) => (
                    <div key={item.id} className="dm-mat-item">
                      {item.materials?.material_images?.[0]?.url ? (
                        <img src={item.materials.material_images[0].url} className="dm-mat-img" alt="" />
                      ) : <div className="dm-mat-ph">🪵</div>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.materials?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.quantity} {item.materials?.unit}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        ₮{(item.unit_price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Progress */}
              {selected.status !== 'cancelled' && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Захиалгын явц</div>
                  {STEPS.map((s, i) => {
                    const stepIdx = STEPS.indexOf(selected.status);
                    const isDone = stepIdx > i;
                    const isActive = stepIdx === i;
                    return (
                      <div key={s} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: isDone || isActive ? '#d97706' : '#f1f5f9',
                          border: `2px solid ${isDone || isActive ? '#d97706' : '#e2e8f0'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          color: isDone || isActive ? 'white' : '#94a3b8',
                        }}>
                          {isDone ? '✓' : STATUS[s]?.icon}
                        </div>
                        <div style={{ paddingTop: 3 }}>
                          <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#d97706' : isDone ? '#0f172a' : '#94a3b8' }}>
                            {STATUS[s]?.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}