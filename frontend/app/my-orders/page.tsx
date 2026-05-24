'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';

const STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Хүлээгдэж байна', color: '#92400e', bg: '#fef3c7', icon: '⏳' },
  confirmed: { label: 'Баталгаажсан', color: '#1d4ed8', bg: '#dbeafe', icon: '✅' },
  assigned: { label: 'Хуваарилагдсан', color: '#7c3aed', bg: '#f5f3ff', icon: '👷' },
  in_progress: { label: 'Гүйцэтгэж байна', color: '#075985', bg: '#e0f2fe', icon: '🔄' },
  done: { label: 'Дууссан', color: '#166534', bg: '#dcfce7', icon: '🎉' },
  cancelled: { label: 'Цуцлагдсан', color: '#991b1b', bg: '#fee2e2', icon: '❌' },
};

const STEPS = ['pending', 'confirmed', 'assigned', 'in_progress', 'done'];

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { notify } = useToast();

  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (!savedUser || !savedToken) {
      router.push('/auth/login');
      return;
    }

    try {
      setAuth(JSON.parse(savedUser), savedToken);
      setMounted(true);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  }, [router, setAuth]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    void loadOrders();
  }, [mounted]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/orders/my');
      setOrders(res.data || []);
    } catch (error: any) {
      setOrders([]);
      notify(error?.response?.data?.message || 'Захиалгын мэдээлэл ачаалахад алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => !filterStatus || order.status === filterStatus);

  if (!mounted || !user) {
    return null;
  }

  return (
    <AppLayout
      title="Миний захиалга"
      action={
        <button
          onClick={() => router.push('/cart')}
          style={{
            background: 'linear-gradient(135deg,#d97706,#b45309)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🛒 Сагс
        </button>
      }
    >
      <style>{`
        .page-grid{display:grid;gap:16px}
        .hero{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a;border-radius:20px;padding:22px}
        .hero-title{font-size:22px;font-weight:800;color:#1c1917;margin-bottom:6px}
        .hero-sub{font-size:13px;color:#78716c;max-width:680px}
        .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .stat-card{background:white;border:1px solid #e2e8f0;border-radius:16px;padding:16px}
        .stat-label{font-size:12px;color:#64748b;font-weight:700;margin-bottom:6px}
        .stat-value{font-size:28px;font-weight:800;color:#0f172a}
        .filter-row{display:flex;gap:8px;flex-wrap:wrap}
        .filter-btn{border:1px solid #e2e8f0;background:white;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:700;color:#64748b;cursor:pointer}
        .filter-btn.on{background:#1c1917;color:white;border-color:#1c1917}
        .orders-grid{display:grid;gap:12px}
        .order-card{background:white;border:1px solid #e2e8f0;border-radius:18px;padding:18px;cursor:pointer;transition:all .15s}
        .order-card:hover{border-color:#f5d7a1;transform:translateY(-1px);box-shadow:0 8px 24px rgba(15,23,42,.06)}
        .order-head{display:flex;gap:14px;align-items:flex-start}
        .order-icon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .order-main{flex:1;min-width:0}
        .order-no{font-size:13px;font-weight:800;color:#b45309;font-family:monospace}
        .order-furniture{font-size:14px;font-weight:700;color:#0f172a;margin-top:3px}
        .order-date{font-size:11px;color:#94a3b8;margin-top:4px}
        .order-meta{text-align:right;flex-shrink:0}
        .order-amount{font-size:18px;font-weight:800;color:#0f172a}
        .badge{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:4px 10px;font-size:10px;font-weight:700;margin-top:8px}
        .progress-wrap{margin-top:16px}
        .progress-track{position:relative;height:4px;background:#f1f5f9;border-radius:999px;margin-bottom:14px}
        .progress-fill{position:absolute;left:0;top:0;height:100%;background:linear-gradient(90deg,#d97706,#b45309);border-radius:999px}
        .progress-steps{display:flex;justify-content:space-between;gap:8px}
        .progress-step{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}
        .progress-dot{width:20px;height:20px;border-radius:999px;border:2px solid #e2e8f0;background:white;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#94a3b8}
        .progress-dot.done,.progress-dot.active{background:#d97706;border-color:#d97706;color:white}
        .progress-label{font-size:9px;color:#94a3b8;text-align:center}
        .progress-label.active{color:#d97706;font-weight:700}
        .empty{background:white;border:1px dashed #cbd5e1;border-radius:18px;padding:46px 24px;text-align:center;color:#94a3b8}
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:250;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:22px;width:100%;max-width:620px;max-height:90vh;overflow:auto;box-shadow:0 24px 80px rgba(15,23,42,.18)}
        .modal-head{padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white}
        .modal-title{font-size:16px;font-weight:800;color:#0f172a}
        .close-btn{width:32px;height:32px;border-radius:999px;border:none;background:#f1f5f9;cursor:pointer;font-size:16px;color:#64748b}
        .modal-body{padding:20px 22px}
        .detail-box{background:#f8fafc;border-radius:14px;padding:14px 16px;margin-bottom:14px}
        .detail-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eef2f7;font-size:13px}
        .detail-row:last-child{border-bottom:none}
        .section-title{font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin:16px 0 10px}
        .line-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f8fafc}
        .line-item:last-child{border-bottom:none}
        .line-thumb{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;object-fit:cover;border:1px solid #e2e8f0}
        .line-main{flex:1;min-width:0}
        .line-name{font-size:13px;font-weight:700;color:#0f172a}
        .line-sub{font-size:11px;color:#94a3b8;margin-top:2px}
        .timeline-item{display:flex;gap:10px;padding-bottom:10px}
        .timeline-dot{width:10px;height:10px;border-radius:999px;background:#d97706;margin-top:6px;flex-shrink:0}
        .timeline-title{font-size:12px;font-weight:700;color:#0f172a}
        .timeline-sub{font-size:11px;color:#94a3b8;margin-top:2px}
        .skel{height:140px;border-radius:18px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:960px){.stat-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.stat-grid{grid-template-columns:1fr}.order-head{flex-wrap:wrap}.order-meta{text-align:left}}
      `}</style>

      <div className="page-grid">
        <div className="hero">
          <div className="hero-title">Таны захиалгууд</div>
          <div className="hero-sub">
            Захиалгын явц, төлөв, тооцоололтой холбоотой мэдээллээ нэг дороос хянаарай.
          </div>
        </div>

        <div className="stat-grid">
          {[
            { label: 'Нийт захиалга', value: orders.length },
            { label: 'Хүлээгдэж буй', value: orders.filter((order) => order.status === 'pending').length },
            { label: 'Гүйцэтгэж буй', value: orders.filter((order) => order.status === 'in_progress').length },
            { label: 'Дууссан', value: orders.filter((order) => order.status === 'done').length },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="filter-row">
          <button className={`filter-btn ${!filterStatus ? 'on' : ''}`} onClick={() => setFilterStatus('')}>
            Бүгд ({orders.length})
          </button>
          {Object.entries(STATUS).map(([key, value]) => {
            const count = orders.filter((order) => order.status === key).length;
            if (!count) {
              return null;
            }

            return (
              <button
                key={key}
                className={`filter-btn ${filterStatus === key ? 'on' : ''}`}
                onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
              >
                {value.icon} {value.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="orders-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skel" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 42, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Захиалга алга байна</div>
            <div style={{ marginBottom: 22 }}>Шинэ тооцоолол хийж эсвэл сагсаас захиалгаа үүсгээрэй.</div>
            <button
              onClick={() => router.push('/calculate')}
              style={{
                background: 'linear-gradient(135deg,#d97706,#b45309)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📐 Тооцоолол хийх
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => {
              const status = STATUS[order.status] || STATUS.pending;
              const stepIndex = STEPS.indexOf(order.status);
              const progress = order.status === 'cancelled' ? 0 : stepIndex >= 0 ? ((stepIndex + 1) / STEPS.length) * 100 : 0;

              return (
                <div key={order.id} className="order-card" onClick={() => setSelected(order)}>
                  <div className="order-head">
                    <div className="order-icon" style={{ background: status.bg }}>{status.icon}</div>
                    <div className="order-main">
                      <div className="order-no">{order.order_no}</div>
                      <div className="order-furniture">{order.calculations?.furniture_types?.name || 'Материалын захиалга'}</div>
                      <div className="order-date">
                        {new Date(order.created_at).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="order-meta">
                      <div className="order-amount">₮{Number(order.total_amount).toLocaleString()}</div>
                      <div className="badge" style={{ background: status.bg, color: status.color }}>{status.label}</div>
                    </div>
                  </div>

                  {order.status !== 'cancelled' && (
                    <div className="progress-wrap">
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="progress-steps">
                        {STEPS.map((step, index) => {
                          const isDone = stepIndex > index;
                          const isActive = stepIndex === index;
                          return (
                            <div key={step} className="progress-step">
                              <div className={`progress-dot ${isDone || isActive ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                                {isDone ? '✓' : index + 1}
                              </div>
                              <div className={`progress-label ${isActive ? 'active' : ''}`}>
                                {STATUS[step]?.label.split(' ')[0]}
                              </div>
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
        )}
      </div>

      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{selected.order_no}</div>
              <button className="close-btn" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-box">
                {[
                  { label: 'Тавилгын төрөл', value: selected.calculations?.furniture_types?.name || 'Материалын захиалга' },
                  { label: 'Нийт дүн', value: `₮${Number(selected.total_amount).toLocaleString()}` },
                  { label: 'Огноо', value: new Date(selected.created_at).toLocaleString('mn-MN') },
                  { label: 'Төлөв', value: STATUS[selected.status]?.label || selected.status },
                ].map((row) => (
                  <div key={row.label} className="detail-row">
                    <span style={{ color: '#64748b' }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
                {selected.note && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#475569' }}>
                    📝 {selected.note}
                  </div>
                )}
              </div>

              {selected.order_items?.length > 0 && (
                <>
                  <div className="section-title">Захиалсан зүйлс</div>
                  {selected.order_items.map((item: any) => {
                    const qty = Number(item.qty || item.quantity || 0);
                    const subtotal = Number(item.subtotal || item.unit_price * qty || 0);
                    return (
                      <div key={item.id} className="line-item">
                        {item.materials?.material_images?.[0]?.url ? (
                          <img src={item.materials.material_images[0].url} alt="" className="line-thumb" />
                        ) : (
                          <div className="line-thumb">🪵</div>
                        )}
                        <div className="line-main">
                          <div className="line-name">{item.materials?.name || item.services?.name || 'Захиалгын мөр'}</div>
                          <div className="line-sub">
                            {qty} {item.unit || item.materials?.unit || item.services?.unit || ''}
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                          ₮{subtotal.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {selected.order_status_history?.length > 0 && (
                <>
                  <div className="section-title">Захиалгын явц</div>
                  {selected.order_status_history.map((history: any, index: number) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot" />
                      <div>
                        <div className="timeline-title">
                          {STATUS[history.new_status]?.label || history.new_status}
                        </div>
                        <div className="timeline-sub">{new Date(history.created_at).toLocaleString('mn-MN')}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
