'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';

interface Order {
  id: number;
  order_no: string;
  status: string;
  total_amount: number;
  created_at: string;
  calculations: { furniture_types: { name: string } } | null;
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Хүлээгдэж байна', color: '#ca8a04', bg: '#fef9c3' },
  confirmed:   { label: 'Баталгаажсан',    color: '#2563eb', bg: '#fef3c7' },
  assigned:    { label: 'Хуваарилагдсан',  color: '#7c3aed', bg: '#fef3c7' },
  in_progress: { label: 'Гүйцэтгэж байна', color: '#2563eb', bg: '#fef3c7' },
  done:        { label: 'Дууссан',          color: '#059669', bg: '#dcfce7' },
  cancelled:   { label: 'Цуцлагдсан',      color: '#ef4444', bg: '#fee2e2' },
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, setAuth, logout } = useAuthStore();
  const { notify } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [orders, setOrders] = useState<Order[]>([]);
  const [calcs, setCalcs] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ first_name:'', last_name:'', phone:'' });
  const [saving, setSaving] = useState(false);
  const [passFrm, setPassFrm] = useState({ current:'', newPass:'', confirm:'' });
  const [passMsg, setPassMsg] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) {
      const parsed = JSON.parse(u);
      setAuth(parsed, t);
      setForm({ first_name: parsed.first_name, last_name: parsed.last_name, phone: parsed.phone || '' });
    } else {
      router.push('/auth/login');
      return;
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadOrders();
    loadCalcs();
  }, [mounted]);

  const loadOrders = async () => {
    const res = await api.get('/api/orders/my').catch(() => ({ data: [] }));
    setOrders(res.data);
  };

  const loadCalcs = async () => {
    const res = await api.get('/api/calculations').catch(() => ({ data: [] }));
    setCalcs(res.data);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/api/auth/users/${user?.id}`, form);
      const updated = { ...user, ...form };
      localStorage.setItem('user', JSON.stringify(updated));
      setAuth(updated as any, localStorage.getItem('token') || '');
      setEditMode(false);
    } catch (err: any) {
      notify(err.response?.data?.message || 'Профайл хадгалах үед алдаа гарлаа', 'error');
    }
    finally { setSaving(false); }
  };

  if (!mounted || !user) return null;

  const doneOrders = orders.filter(o => o.status === 'done').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8f9fb}
        .page{min-height:100vh;background:#f8f9fb}
        .topnav{background:white;border-bottom:1px solid #f0f0f0;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 8px rgba(0,0,0,0.05)}
        .back-btn{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#6b7280;cursor:pointer;border:none;background:none;font-family:inherit;padding:7px 12px;border-radius:8px;transition:all 0.15s}
        .back-btn:hover{background:#f5f5f7;color:#1c1917}
        .logout-btn{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:9px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .logout-btn:hover{background:#fee2e2}
        .main{max-width:960px;margin:0 auto;padding:28px 24px}
        
        /* PROFILE HEADER */
        .prof-header{background:linear-gradient(135deg,#1c1917,#292524);border-radius:20px;padding:32px;margin-bottom:20px;display:flex;align-items:center;gap:24px;position:relative;overflow:hidden}
        .ph-orb{position:absolute;border-radius:50%;pointer-events:none}
        .ph-avatar{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:white;flex-shrink:0;border:3px solid rgba(255,255,255,0.2);position:relative;z-index:1}
        .ph-info{position:relative;z-index:1}
        .ph-name{font-size:22px;font-weight:800;color:white;letter-spacing:-0.02em;margin-bottom:4px}
        .ph-email{font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:10px}
        .ph-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:100px;padding:4px 12px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.9)}
        .ph-stats{margin-left:auto;display:flex;gap:20px;position:relative;z-index:1}
        .phs{text-align:center}
        .phs-val{font-size:24px;font-weight:800;color:white}
        .phs-label{font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px}

        /* TABS */
        .tabs{display:flex;gap:4px;background:white;border-radius:14px;padding:6px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
        .tab{flex:1;padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;font-family:inherit;color:#6b7280;transition:all 0.2s;text-align:center}
        .tab.on{background:#1c1917;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
        
        /* PANEL */
        .panel{background:white;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
        .panel-body{padding:24px}
        
        /* FORM */
        .field{margin-bottom:14px}
        .fl{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
        .inp{width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 14px;font-size:14px;color:#1c1917;outline:none;font-family:inherit;transition:all 0.2s;background:white}
        .inp:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .inp:disabled{background:#f9fafb;color:#9ca3af}
        .info-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f9fafb;font-size:14px}
        .info-row:last-child{border-bottom:none}
        .ir-label{color:#9ca3af;font-weight:500;font-size:13px}
        .ir-val{font-weight:600;color:#1c1917}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .primary-btn{background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:10px;padding:11px 24px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .primary-btn:hover{opacity:0.9;transform:translateY(-1px)}
        .sec-btn{background:#f9fafb;color:#374151;border:1.5px solid #e5e7eb;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .sec-btn:hover{background:#f3f4f6}
        
        /* ORDERS */
        .order-card{border:1.5px solid #f3f4f6;border-radius:14px;padding:16px;margin-bottom:12px;cursor:pointer;transition:all 0.2s}
        .order-card:hover{border-color:#e0e0e0;box-shadow:0 4px 16px rgba(0,0,0,0.06);transform:translateY(-1px)}
        .oc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}
        .oc-no{font-size:13px;font-weight:800;color:#1c1917;font-family:monospace}
        .oc-date{font-size:11px;color:#9ca3af;margin-top:2px}
        .oc-furn{font-size:13px;color:#6b7280;margin-bottom:10px}
        .oc-bottom{display:flex;align-items:center;justify-content:space-between}
        .oc-amt{font-size:18px;font-weight:800;color:#1c1917}
        .status-tag{font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;display:inline-block}
        .paid-tag{font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px}
        
        /* CALC HISTORY */
        .calc-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f9fafb}
        .calc-row:last-child{border-bottom:none}
        
        /* MODAL */
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:20px;max-width:440px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.2)}
        .modal-head{padding:18px 22px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white}
        .modal-x{width:28px;height:28px;border-radius:50%;border:none;background:#f3f4f6;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
        .modal-body{padding:22px}
        .hist-row{display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid #f9fafb}
        .hist-row:last-child{border-bottom:none}
        
        @media(max-width:640px){
          .ph-stats{display:none}
          .grid-2{grid-template-columns:1fr}
          .tabs{overflow-x:auto}
          .tab{white-space:nowrap;flex:none;padding:9px 14px}
          .main{padding:16px}
        }
      `}</style>

      <div className="page">
        <nav className="topnav">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button className="back-btn" onClick={() => router.push('/')}>← Нүүр хуудас</button>
            <span style={{ color:'#e5e7eb' }}>|</span>
            <span style={{ fontSize:14, fontWeight:700, color:'#1c1917' }}>👤 Миний профайл</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              style={{ background:'#f5f5f7', color:'#374151', border:'none', borderRadius:9, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
              onClick={() => router.push('/calculate')}
            >
              📐 Тооцоолол
            </button>
            <button className="logout-btn" onClick={() => { logout(); router.push('/'); }}>
              🚪 Гарах
            </button>
          </div>
        </nav>

        <div className="main">
          {/* PROFILE HEADER */}
          <div className="prof-header">
            <div className="ph-orb" style={{ width:300, height:300, background:'radial-gradient(circle,rgba(217,119,6,0.3),transparent 70%)', top:-100, right:-50 }} />
            <div className="ph-orb" style={{ width:200, height:200, background:'radial-gradient(circle,rgba(168,85,247,0.2),transparent 70%)', bottom:-80, left:200 }} />
            <div className="ph-avatar">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="ph-info">
              <div className="ph-name">{user.last_name} {user.first_name}</div>
              <div className="ph-email">{user.email}</div>
              <div className="ph-badge">
                <span>⭐</span> Хэрэглэгч
              </div>
            </div>
            <div className="ph-stats">
              <div className="phs">
                <div className="phs-val">{orders.length}</div>
                <div className="phs-label">Захиалга</div>
              </div>
              <div className="phs">
                <div className="phs-val">{doneOrders}</div>
                <div className="phs-label">Дууссан</div>
              </div>
              <div className="phs">
                <div className="phs-val">{calcs.length}</div>
                <div className="phs-label">Тооцоолол</div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="tabs">
            {[
              { key:'info', label:'👤 Хувийн мэдээлэл' },
              { key:'orders', label:'📦 Захиалгын түүх' },
              { key:'calcs', label:'📐 Тооцооллын түүх' },
            ].map(t => (
              <button key={t.key} className={`tab ${activeTab === t.key ? 'on' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div className="panel">
              <div className="panel-body">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#1c1917' }}>Хувийн мэдээлэл</div>
                  {!editMode ? (
                    <button className="sec-btn" onClick={() => setEditMode(true)}>✏️ Засах</button>
                  ) : (
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="primary-btn" onClick={saveProfile} disabled={saving}>
                        {saving ? 'Хадгалж...' : '✅ Хадгалах'}
                      </button>
                      <button className="sec-btn" onClick={() => setEditMode(false)}>Болих</button>
                    </div>
                  )}
                </div>

                {!editMode ? (
                  <>
                    {[
                      { label:'Овог', val: user.last_name },
                      { label:'Нэр', val: user.first_name },
                      { label:'Имэйл', val: user.email },
                      { label:'Утас', val: (user as any).phone || '—' },
                      { label:'Эрх', val: 'Хэрэглэгч' },
                    ].map(r => (
                      <div key={r.label} className="info-row">
                        <span className="ir-label">{r.label}</span>
                        <span className="ir-val">{r.val}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="grid-2">
                    <div className="field">
                      <label className="fl">Овог</label>
                      <input className="inp" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="fl">Нэр</label>
                      <input className="inp" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="fl">Имэйл</label>
                      <input className="inp" value={user.email} disabled />
                    </div>
                    <div className="field">
                      <label className="fl">Утас</label>
                      <input className="inp" placeholder="99001122" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>
                )}

                <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid #f3f4f6' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#1c1917', marginBottom:16 }}>Аюулгүй байдал</div>
                  <div style={{ background:'#f9fafb', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#1c1917' }}>🔒 Нууц үг солих</div>
                      <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Нууц үгээ тогтмол шинэчилнэ үү</div>
                    </div>
                    <button
                      className="sec-btn"
                      onClick={() => router.push('/auth/forgot-password')}
                    >
                      Солих →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize:15, fontWeight:700, color:'#1c1917', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  Захиалгын түүх
                  <span style={{ fontSize:12, color:'#9ca3af', fontWeight:500 }}>{orders.length} захиалга</span>
                </div>

                {orders.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px 0', color:'#9ca3af' }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>🛒</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#374151', marginBottom:8 }}>Захиалга байхгүй байна</div>
                    <div style={{ fontSize:13, marginBottom:20 }}>Тооцоолол хийгээд захиалаарай</div>
                    <button className="primary-btn" onClick={() => router.push('/calculate')}>
                      📐 Тооцоолол хийх →
                    </button>
                  </div>
                ) : (
                  orders.map(o => {
                    const st = STATUS[o.status] || { label:o.status, color:'#64748b', bg:'#f1f5f9' };
                    return (
                      <div key={o.id} className="order-card" onClick={() => setSelectedOrder(o)}>
                        <div className="oc-top">
                          <div>
                            <div className="oc-no">{o.order_no}</div>
                            <div className="oc-date">{new Date(o.created_at).toLocaleDateString('mn-MN', { year:'numeric', month:'long', day:'numeric' })}</div>
                          </div>
                          <span className="status-tag" style={{ background:st.bg, color:st.color }}>{st.label}</span>
                        </div>
                        <div className="oc-furn">🪑 {o.calculations?.furniture_types?.name || 'Тавилга'}</div>
                        <div className="oc-bottom">
                          <div className="oc-amt">₮{Number(o.total_amount).toLocaleString()}</div>
                          <span style={{ fontSize:12, color:'#d97706', fontWeight:600 }}>Дэлгэрэнгүй →</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* CALCS TAB */}
          {activeTab === 'calcs' && (
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize:15, fontWeight:700, color:'#1c1917', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  Тооцооллын түүх
                  <span style={{ fontSize:12, color:'#9ca3af', fontWeight:500 }}>{calcs.length} тооцоолол</span>
                </div>

                {calcs.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px 0', color:'#9ca3af' }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>📐</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#374151', marginBottom:8 }}>Тооцоолол байхгүй байна</div>
                    <button className="primary-btn" onClick={() => router.push('/calculate')}>
                      📐 Тооцоолол хийх →
                    </button>
                  </div>
                ) : (
                  calcs.map((c: any, i: number) => (
                    <div key={i} className="calc-row">
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#1c1917' }}>
                          {c.furniture_types?.name || 'Тавилга'}
                        </div>
                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                          {new Date(c.created_at).toLocaleDateString('mn-MN', { year:'numeric', month:'long', day:'numeric' })}
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#d97706' }}>
                          {Number(c.total_area).toFixed(2)} м²
                        </div>
                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                          Ирмэг: {Number(c.total_edge).toFixed(1)} м
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="modal-bg" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ fontSize:15, fontWeight:700, color:'#1c1917' }}>{selectedOrder.order_no}</div>
              <button className="modal-x" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              {[
                { label:'Тавилга', val: selectedOrder.calculations?.furniture_types?.name || '—' },
                { label:'Нийт дүн', val: `₮${Number(selectedOrder.total_amount).toLocaleString()}` },
                { label:'Огноо', val: new Date(selectedOrder.created_at).toLocaleDateString('mn-MN') },
                { label:'Төлөв', val: STATUS[selectedOrder.status]?.label || selectedOrder.status },
              ].map(r => (
                <div key={r.label} className="hist-row">
                  <span style={{ color:'#9ca3af' }}>{r.label}</span>
                  <span style={{ fontWeight:600, color:'#1c1917' }}>{r.val}</span>
                </div>
              ))}
              {selectedOrder.note && (
                <div style={{ marginTop:14, background:'#f9fafb', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#374151' }}>
                  📝 {selectedOrder.note}
                </div>
              )}
              {selectedOrder.order_status_history?.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Захиалгын явц</div>
                  {selectedOrder.order_status_history.map((h: any, i: number) => (
                    <div key={i} style={{ display:'flex', gap:10, paddingBottom:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#d97706', marginTop:5, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#1c1917' }}>
                          {STATUS[h.new_status]?.label || h.new_status}
                        </div>
                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                          {new Date(h.created_at).toLocaleString('mn-MN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
