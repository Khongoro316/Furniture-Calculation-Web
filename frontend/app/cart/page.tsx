'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface CartItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  price: number;
  image_url?: string;
  type_name?: string;
  quantity: number;
}

const CART_KEY = 'furni_cart';

export default function CartPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    setMounted(true);
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const saveItems = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { saveItems(items.filter(i => i.id !== id)); return; }
    saveItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const remove = (id: number) => saveItems(items.filter(i => i.id !== id));

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const placeOrder = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const res = await api.post('/api/orders', {
        items: items.map(i => ({ material_id: i.id, quantity: i.quantity, unit_price: i.price })),
        note,
        total_amount: total,
      });
      localStorage.removeItem(CART_KEY);
      setItems([]);
      setSuccess(res.data.order_no || 'Амжилттай');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Алдаа гарлаа');
    } finally {
      setPlacing(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f1f5f9;-webkit-font-smoothing:antialiased}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        .topnav{background:white;border-bottom:1px solid #e2e8f0;height:62px;display:flex;align-items:center;padding:0 32px;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .back{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border:none;background:none;font-family:inherit;padding:7px 12px;border-radius:9px;transition:all 0.15s}
        .back:hover{background:#f1f5f9;color:#0f172a}
        .nav-title{font-size:16px;font-weight:800;color:#0f172a;margin-left:8px}
        .nav-r{margin-left:auto;display:flex;align-items:center;gap:8px}
        .main{max-width:1000px;margin:0 auto;padding:28px 24px;display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start}
        .cart-panel{background:white;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden}
        .panel-head{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .panel-title{font-size:15px;font-weight:800;color:#0f172a}
        .panel-sub{font-size:12px;color:#94a3b8}
        .clear-btn{font-size:11px;font-weight:600;color:#ef4444;border:none;background:none;cursor:pointer;font-family:inherit;padding:4px 8px;border-radius:6px;transition:background 0.15s}
        .clear-btn:hover{background:#fef2f2}
        .item-row{display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid #f8fafc;transition:background 0.12s}
        .item-row:last-child{border-bottom:none}
        .item-row:hover{background:#fafafa}
        .item-img{width:52px;height:52px;border-radius:12px;object-fit:cover;border:1px solid #e2e8f0;flex-shrink:0}
        .item-img-ph{width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid #fde68a}
        .item-name{font-size:13px;font-weight:700;color:#0f172a;margin-bottom:3px}
        .item-code{font-size:11px;color:#d97706;font-family:monospace;font-weight:700;background:#fef3c7;padding:2px 6px;border-radius:4px;display:inline-block;margin-bottom:3px}
        .item-type{font-size:11px;color:#94a3b8}
        .qty-ctrl{display:flex;align-items:center;gap:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;flex-shrink:0}
        .qty-btn{width:30px;height:30px;border:none;background:white;cursor:pointer;font-size:16px;color:#374151;display:flex;align-items:center;justify-content:center;transition:background 0.12s;font-weight:700;font-family:inherit}
        .qty-btn:hover{background:#f1f5f9}
        .qty-val{width:36px;text-align:center;font-size:13px;font-weight:700;color:#0f172a;border:none;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:5px 0;font-family:inherit}
        .item-price{font-size:14px;font-weight:800;color:#0f172a;white-space:nowrap;margin-left:auto}
        .item-price-sub{font-size:10px;color:#94a3b8;font-weight:500;text-align:right;margin-top:2px}
        .del-btn{width:28px;height:28px;border-radius:8px;border:1px solid #fecaca;background:white;color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.15s;flex-shrink:0}
        .del-btn:hover{background:#fef2f2;border-color:#ef4444}
        .empty{padding:64px 20px;text-align:center;color:#94a3b8}
        .sum-panel{background:white;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;position:sticky;top:82px}
        .sum-head{padding:16px 20px;border-bottom:1px solid #f1f5f9}
        .sum-title{font-size:15px;font-weight:800;color:#0f172a}
        .sum-body{padding:18px 20px}
        .sum-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:10px}
        .sum-label{color:#64748b}
        .sum-val{font-weight:600;color:#0f172a}
        .sum-div{height:1px;background:#f1f5f9;margin:14px 0}
        .sum-total-row{display:flex;justify-content:space-between;align-items:center}
        .sum-total-label{font-size:14px;font-weight:700;color:#0f172a}
        .sum-total-val{font-size:22px;font-weight:800;color:#d97706}
        .note-inp{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;resize:none;transition:border-color 0.15s;margin-top:14px}
        .note-inp:focus{border-color:#d97706}
        .order-btn{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;margin-top:16px;box-shadow:0 4px 16px rgba(217,119,6,0.35)}
        .order-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(217,119,6,0.4)}
        .order-btn:disabled{opacity:0.55;cursor:not-allowed}
        .login-note{font-size:12px;color:#94a3b8;text-align:center;margin-top:10px;line-height:1.5}
        .success-wrap{text-align:center;padding:60px 24px;animation:slideUp 0.4s ease}
        @media(max-width:780px){.main{grid-template-columns:1fr}.sum-panel{position:static}}
        @media(max-width:600px){.topnav{padding:0 16px}.main{padding:16px}}
      `}</style>

      {/* NAV */}
      <nav className="topnav">
        <button className="back" onClick={() => router.push('/materials-page')}>
          ← Буцах
        </button>
        <span className="nav-title">🛒 Миний сагс</span>
        <div className="nav-r">
          {user ? (
            <button onClick={() => router.push('/my-orders')} style={{ background: '#f1f5f9', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
              📦 Захиалгын түүх
            </button>
          ) : (
            <button onClick={() => router.push('/auth/login')} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 9, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Нэвтрэх
            </button>
          )}
        </div>
      </nav>

      {success ? (
        /* Амжилтын дэлгэц */
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
            <div className="success-wrap">
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Захиалга амжилттай!</div>
              <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                Таны захиалга бүртгэгдлээ.<br />
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#d97706', fontSize: 16 }}>{success}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => router.push('/my-orders')}
                  style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 11, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  📦 Захиалга харах
                </button>
                <button
                  onClick={() => router.push('/materials-page')}
                  style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 11, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Материал харах
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="main">
          {/* Сагсны зүйлс */}
          <div className="cart-panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">Сонгосон материалууд</div>
                <div className="panel-sub">{items.length} төрлийн материал</div>
              </div>
              {items.length > 0 && (
                <button className="clear-btn" onClick={() => saveItems([])}>Бүгдийг устгах</button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="empty">
                <div style={{ fontSize: 52, marginBottom: 14 }}>🛒</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Сагс хоосон байна</div>
                <div style={{ fontSize: 13, marginBottom: 24 }}>Материал хуудаснаас материал сонгоно уу</div>
                <button
                  onClick={() => router.push('/materials-page')}
                  style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 11, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Материал харах →
                </button>
              </div>
            ) : items.map(item => (
              <div key={item.id} className="item-row">
                {item.image_url ? (
                  <img src={item.image_url} className="item-img" alt={item.name} />
                ) : (
                  <div className="item-img-ph">🪵</div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="item-name">{item.name}</div>
                  <div className="item-code">{item.code}</div>
                  {item.type_name && <div className="item-type">{item.type_name}</div>}
                </div>

                {/* Тоо хэмжээний удирдлага */}
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                  <input
                    className="qty-val"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.quantity}
                    onChange={e => updateQty(item.id, parseFloat(e.target.value) || 0)}
                    style={{ background: 'white' }}
                  />
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                </div>

                {/* Үнэ */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="item-price">₮{(item.price * item.quantity).toLocaleString()}</div>
                  <div className="item-price-sub">₮{item.price.toLocaleString()} / {item.unit}</div>
                </div>

                <button className="del-btn" onClick={() => remove(item.id)}>×</button>
              </div>
            ))}
          </div>

          {/* Нийт дүн + Захиалах */}
          <div className="sum-panel">
            <div className="sum-head">
              <div className="sum-title">Захиалгын дүн</div>
            </div>
            <div className="sum-body">
              <div className="sum-row">
                <span className="sum-label">Нийт материал</span>
                <span className="sum-val">{items.length} төрөл</span>
              </div>
              <div className="sum-row">
                <span className="sum-label">Нийт тоо хэмжээ</span>
                <span className="sum-val">{items.reduce((s, i) => s + i.quantity, 0).toFixed(1)}</span>
              </div>
              <div className="sum-div" />
              <div className="sum-total-row">
                <span className="sum-total-label">Нийт дүн</span>
                <span className="sum-total-val">₮{total.toLocaleString()}</span>
              </div>

              <textarea
                className="note-inp"
                rows={3}
                placeholder="Нэмэлт тэмдэглэл (заавал биш)..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />

                    // placeOrder функцыг устгана

        // "Захиалга өгөх" товчийг олоод солих:
        <button
        className="order-btn"
        onClick={() => router.push('/checkout')}
        disabled={items.length === 0}
        >
        Захиалга хийх →
        </button>

              {!user && (
                <div className="login-note">
                  Захиалга өгөхийн тулд
                  <button onClick={() => router.push('/auth/login')} style={{ color: '#d97706', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                    нэвтрэнэ
                  </button>
                  үү
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}