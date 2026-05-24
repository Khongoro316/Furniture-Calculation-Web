'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface CartItem {
  id: number; code: string; name: string;
  unit: string; price: number; quantity: number;
  image_url?: string; type_name?: string;
}
interface Service {
  id: number; name: string; unit: string; price: number;
  description: string; service_types: { name: string };
}
interface ServiceType { id: number; name: string; services: Service[]; }
interface CalcPart {
  part_key: string; part_label: string;
  width_mm: number; height_mm: number; qty: number;
  area_m2: number; edge_length_m: number;
}

const CART_KEY = 'furni_cart';
const PAYMENT_METHODS = [
  { value: 'cash',     label: 'Бэлэн мөнгө',       icon: '💵', desc: 'Байгууллагад очиж төлөх' },
  { value: 'transfer', label: 'Банкны шилжүүлэг',   icon: '🏦', desc: 'Дансаар шилжүүлэх' },
  { value: 'qpay',     label: 'QPay',                icon: '📱', desc: 'QPay-р төлөх' },
];

const Steps = ({ current }: { current: number }) => {
  const steps = ['Сагс', 'Үйлчилгээ', 'Төлбөр', 'Баталгаажуулалт'];
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:32 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%',
              background: i < current ? '#059669' : i === current ? '#d97706' : '#e2e8f0',
              color: i <= current ? 'white' : '#94a3b8',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:800, transition:'all 0.3s',
              boxShadow: i === current ? '0 0 0 4px rgba(217,119,6,0.2)' : 'none',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize:11, fontWeight: i===current ? 700 : 500, color: i===current ? '#d97706' : i<current ? '#059669' : '#94a3b8', whiteSpace:'nowrap' }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width:60, height:2, background: i<current ? '#059669' : '#e2e8f0', margin:'0 4px', marginBottom:22, transition:'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
};

const MatPh = ({ name, url }: { name: string; url?: string }) => (
  url
    ? <img src={url} alt={name} style={{ width:48, height:48, borderRadius:10, objectFit:'cover', flexShrink:0, border:'1px solid #e2e8f0' }} />
    : <div style={{ width:48, height:48, borderRadius:10, background:'linear-gradient(135deg,#fef3c7,#fde68a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🪵</div>
);

function CheckoutInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { user, setAuth } = useAuthStore();

  const [mounted, setMounted]   = useState(false);
  const [step, setStep]         = useState(0);

  // Step 0
  const [cartItems, setCartItems]       = useState<CartItem[]>([]);
  const [calcId, setCalcId]             = useState<number | null>(null);
  const [calcParts, setCalcParts]       = useState<CalcPart[]>([]);
  const [mode, setMode]                 = useState<'cart' | 'calc'>('cart');

  // Step 1
  const [serviceTypes, setServiceTypes]       = useState<ServiceType[]>([]);
  const [selectedServices, setSelectedServices] = useState<{ service: Service; qty: number }[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Step 2
  const [payMethod, setPayMethod] = useState('cash');
  const [note, setNote]           = useState('');
  const [agreed, setAgreed]       = useState(false);

  // Step 3
  const [orderResult, setOrderResult] = useState<any>(null);
  const [placing, setPlacing]         = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    else { router.push('/auth/login'); return; }
    setMounted(true);

    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCartItems(JSON.parse(saved));
    } catch {}

    const cid = params.get('calc_id');
    if (cid) {
      setCalcId(Number(cid));
      setMode('calc');
      loadCalc(Number(cid));
    }
  }, []);

  useEffect(() => {
    if (mounted && step === 1) loadServices();
  }, [step, mounted]);

  const loadCalc = async (id: number) => {
    try {
      const res = await api.get(`/api/calculations/${id}`);
      setCalcParts(JSON.parse(res.data.result_data)?.parts || []);
    } catch {}
  };

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const res = await api.get('/api/services/types');
      setServiceTypes(res.data || []);
    } catch {} finally { setServicesLoading(false); }
  };

  const updateCartQty = (id: number, qty: number) => {
    const next = qty <= 0
      ? cartItems.filter(i => i.id !== id)
      : cartItems.map(i => i.id === id ? { ...i, quantity: qty } : i);
    setCartItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const toggleService = (svc: Service) => {
    const idx = selectedServices.findIndex(s => s.service.id === svc.id);
    setSelectedServices(idx >= 0
      ? selectedServices.filter((_, i) => i !== idx)
      : [...selectedServices, { service: svc, qty: 1 }]
    );
  };

  const updateServiceQty = (id: number, qty: number) => {
    if (qty <= 0) { setSelectedServices(p => p.filter(s => s.service.id !== id)); return; }
    setSelectedServices(p => p.map(s => s.service.id === id ? { ...s, qty } : s));
  };

  const matTotal  = mode === 'cart' ? cartItems.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
  const svcTotal  = selectedServices.reduce((s, i) => s + i.service.price * i.qty, 0);
  const grandTotal = matTotal + svcTotal;

  const placeOrder = async () => {
    if (!agreed) { alert('Үйлчилгээний нөхцөлтэй зөвшөөрнө үү'); return; }
    setPlacing(true);
    try {
      const orderRes = await api.post('/api/orders', {
        total_amount:   grandTotal,
        note,
        calculation_id: calcId || null,
        items: mode === 'cart' ? cartItems.map(i => ({
          material_id: i.id, quantity: i.quantity, unit_price: i.price,
        })) : [],
        services: selectedServices.map(s => ({
          service_id: s.service.id, quantity: s.qty, unit_price: s.service.price,
        })),
      });

      // Төлбөр бүртгэх
      if (grandTotal > 0) {
        await api.post(`/api/orders/${orderRes.data.id}/payment`, {
          amount: grandTotal, method: payMethod,
        }).catch(() => {});
      }

      localStorage.removeItem(CART_KEY);
      setOrderResult(orderRes.data);
      setStep(3);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Захиалга өгөхөд алдаа гарлаа');
    } finally { setPlacing(false); }
  };

  if (!mounted) return null;

  // Горим сонгох card-ийн style
  const modeCardStyle = (k: string): React.CSSProperties => ({
    flex: 1,
    background: mode === k ? '#fffbf5' : 'white',
    border: `2px solid ${mode === k ? '#d97706' : '#e2e8f0'}`,
    borderRadius: 14,
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f1f5f9;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
        .topnav{background:white;border-bottom:1px solid #e2e8f0;height:62px;display:flex;align-items:center;padding:0 28px;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .back{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border:none;background:none;font-family:inherit;padding:7px 11px;border-radius:8px;transition:all 0.15s}
        .back:hover{background:#f1f5f9;color:#0f172a}
        .wrap{max-width:900px;margin:0 auto;padding:28px 20px 60px}
        .grid{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start}
        .panel{background:white;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;animation:fadeUp 0.3s ease}
        .ph{padding:18px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .ph-title{font-size:15px;font-weight:800;color:#0f172a}
        .ph-sub{font-size:12px;color:#94a3b8;margin-top:2px}
        .item{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid #f8fafc;transition:background 0.1s}
        .item:last-child{border-bottom:none}
        .item:hover{background:#fafafa}
        .item-info{flex:1;min-width:0}
        .item-name{font-size:13px;font-weight:700;color:#0f172a;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .item-code{font-family:monospace;font-size:10px;color:#d97706;background:#fef3c7;padding:2px 6px;border-radius:4px;display:inline-block}
        .item-type{font-size:11px;color:#94a3b8;margin-top:2px}
        .qty-row{display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:9px;overflow:hidden}
        .qty-b{width:28px;height:28px;border:none;background:white;cursor:pointer;font-size:15px;font-weight:700;color:#374151;display:flex;align-items:center;justify-content:center;transition:background 0.1s}
        .qty-b:hover{background:#f1f5f9}
        .qty-v{width:36px;text-align:center;font-size:12px;font-weight:700;color:#0f172a;border:none;border-left:1.5px solid #e2e8f0;border-right:1.5px solid #e2e8f0;padding:4px 0;font-family:inherit;background:white;outline:none}
        .del-b{width:26px;height:26px;border-radius:7px;border:1px solid #fecaca;background:white;color:#ef4444;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0}
        .del-b:hover{background:#fef2f2}
        .svc-type-label{padding:12px 20px 6px;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;border-top:1px solid #f1f5f9}
        .svc-card{display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #f8fafc;cursor:pointer;transition:all 0.15s}
        .svc-card:hover{background:#fafafa}
        .svc-card.selected{background:#fffbf5}
        .svc-check{width:20px;height:20px;border-radius:6px;border:2px solid #e2e8f0;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all 0.15s;flex-shrink:0}
        .svc-check.on{background:#d97706;border-color:#d97706;color:white;animation:pop 0.3s ease}
        .svc-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .svc-name{font-size:13px;font-weight:700;color:#0f172a}
        .svc-desc{font-size:11px;color:#94a3b8;margin-top:1px}
        .svc-qty-row{display:flex;align-items:center;gap:8px;margin-top:6px;animation:fadeUp 0.2s ease}
        .pay-card{border:2px solid #e2e8f0;border-radius:13px;padding:14px 16px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:12px;margin-bottom:10px}
        .pay-card:hover{border-color:#d97706}
        .pay-card.on{border-color:#d97706;background:#fffbf5}
        .pay-icon{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:20px;background:#f8fafc;flex-shrink:0}
        .pay-radio{width:18px;height:18px;border-radius:50%;border:2px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;margin-left:auto}
        .pay-radio.on{border-color:#d97706}
        .pay-radio-dot{width:8px;height:8px;border-radius:50%;background:#d97706}
        .sum{background:white;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;position:sticky;top:82px}
        .sum-h{padding:16px 20px;border-bottom:1px solid #f1f5f9}
        .sum-b{padding:18px 20px}
        .sum-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px}
        .sum-lbl{color:#64748b;font-weight:500}
        .sum-val{font-weight:700;color:#0f172a}
        .sum-div{height:1px;background:#f1f5f9;margin:14px 0}
        .sum-total{display:flex;justify-content:space-between;align-items:center}
        .sum-total-lbl{font-size:14px;font-weight:700;color:#0f172a}
        .sum-total-val{font-size:24px;font-weight:800;color:#d97706}
        .note-inp{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;resize:none;transition:border-color 0.15s;margin:14px 0}
        .note-inp:focus{border-color:#d97706}
        .agree-row{display:flex;align-items:flex-start;gap:9px;margin-bottom:14px;cursor:pointer}
        .agree-box{width:18px;height:18px;border-radius:5px;border:2px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all 0.15s}
        .agree-box.on{background:#d97706;border-color:#d97706;color:white}
        .agree-text{font-size:12px;color:#64748b;line-height:1.5}
        .agree-link{color:#d97706;font-weight:600}
        .btn-next{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 4px 16px rgba(217,119,6,0.3)}
        .btn-next:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(217,119,6,0.4)}
        .btn-next:disabled{opacity:0.55;cursor:not-allowed}
        .btn-back{width:100%;background:#f1f5f9;color:#374151;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s;margin-top:8px}
        .btn-back:hover{background:#e2e8f0}
        .calc-part{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-radius:9px;background:#f8fafc;margin-bottom:6px;font-size:12px}
        .cp-label{font-weight:700;color:#0f172a}
        .cp-dim{color:#64748b;margin-top:1px}
        .cp-area{font-weight:700;color:#d97706}
        .success{text-align:center;padding:48px 24px;animation:fadeUp 0.5s ease}
        @media(max-width:760px){.grid{grid-template-columns:1fr}.sum{position:static}}
        @media(max-width:500px){.wrap{padding:16px}}
      `}</style>

      <nav className="topnav">
        <button className="back" onClick={() => router.back()}>← Буцах</button>
        <span style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginLeft:8 }}>
          {step===0 ? '🛒 Захиалга бэлтгэх' : step===1 ? '🔧 Үйлчилгээ нэмэх' : step===2 ? '💳 Төлбөр хийх' : '✅ Захиалга баталгаажлаа'}
        </span>
      </nav>

      <div className="wrap">
        <Steps current={step} />

        {/* ═══ STEP 3: АМЖИЛТ ═══ */}
        {step === 3 && orderResult && (
          <div style={{ maxWidth:480, margin:'0 auto' }}>
            <div className="panel">
              <div className="success">
                <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Захиалга амжилттай!</div>
                <div style={{ fontSize:14, color:'#64748b', lineHeight:1.7, marginBottom:24 }}>
                  Таны захиалга бүртгэгдлээ.<br />Байгууллага хүлээн авмагц холбоо барина.
                </div>
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:'16px 20px', marginBottom:24, textAlign:'left' }}>
                  {[
                    { l:'Захиалгын дугаар', v: orderResult.order_no, mono: true },
                    { l:'Нийт дүн',         v: `₮${Number(orderResult.total_amount).toLocaleString()}` },
                    { l:'Төлбөрийн хэлбэр', v: PAYMENT_METHODS.find(m => m.value===payMethod)?.label || payMethod },
                    { l:'Төлөв',            v: 'Хүлээгдэж байна ⏳' },
                  ].map(r => (
                    <div key={r.l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
                      <span style={{ color:'#64748b' }}>{r.l}</span>
                      <span style={{ fontWeight:800, color: r.mono ? '#d97706' : '#0f172a', fontFamily: r.mono ? 'monospace' : 'inherit' }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                  <button onClick={() => router.push('/my-orders')} style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'white', border:'none', borderRadius:11, padding:'12px 24px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>📦 Захиалга харах</button>
                  <button onClick={() => router.push('/materials-page')} style={{ background:'#f1f5f9', color:'#374151', border:'none', borderRadius:11, padding:'12px 20px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Материал харах</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step < 3 && (
          <div className="grid">
            <div>
              {/* ═══ STEP 0 ═══ */}
              {step === 0 && (
                <>
                  {/* Горим сонгох */}
                  <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                    {([
                      { k:'cart', label:'🛒 Сагснаас захиалах',      desc:'Материал сонгон авах' },
                      { k:'calc', label:'📐 Тооцооллоос захиалах',   desc:'Тооцоолсон хэмжээгээрээ' },
                    ] as const).map(m => (
                      <div key={m.k} onClick={() => setMode(m.k)} style={modeCardStyle(m.k)}>
                        <div style={{ fontSize:14, fontWeight:700, color: mode===m.k ? '#d97706' : '#0f172a' }}>{m.label}</div>
                        <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{m.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* CART mode */}
                  {mode === 'cart' && (
                    <div className="panel">
                      <div className="ph">
                        <div>
                          <div className="ph-title">Сонгосон материалууд</div>
                          <div className="ph-sub">{cartItems.length} төрлийн материал</div>
                        </div>
                        {cartItems.length > 0 && (
                          <button onClick={() => { setCartItems([]); localStorage.removeItem(CART_KEY); }}
                            style={{ fontSize:11, fontWeight:600, color:'#ef4444', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit' }}>
                            Бүгдийг устгах
                          </button>
                        )}
                      </div>
                      {cartItems.length === 0 ? (
                        <div style={{ padding:'48px 20px', textAlign:'center', color:'#94a3b8' }}>
                          <div style={{ fontSize:40, marginBottom:12 }}>🛒</div>
                          <div style={{ fontSize:14, fontWeight:600, color:'#374151', marginBottom:8 }}>Сагс хоосон байна</div>
                          <button onClick={() => router.push('/materials-page')} style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'white', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                            Материал сонгох →
                          </button>
                        </div>
                      ) : cartItems.map(item => (
                        <div key={item.id} className="item">
                          <MatPh name={item.name} url={item.image_url} />
                          <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className="item-code">{item.code}</div>
                            {item.type_name && <div className="item-type">{item.type_name}</div>}
                          </div>
                          <div className="qty-row">
                            <button className="qty-b" onClick={() => updateCartQty(item.id, item.quantity - 1)}>−</button>
                            <input className="qty-v" type="number" min="0.1" step="0.1" value={item.quantity}
                              onChange={e => updateCartQty(item.id, parseFloat(e.target.value) || 0)} />
                            <button className="qty-b" onClick={() => updateCartQty(item.id, item.quantity + 1)}>+</button>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>₮{(item.price * item.quantity).toLocaleString()}</div>
                            <div style={{ fontSize:10, color:'#94a3b8' }}>₮{item.price.toLocaleString()} / {item.unit}</div>
                          </div>
                          <button className="del-b" onClick={() => updateCartQty(item.id, 0)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CALC mode */}
                  {mode === 'calc' && (
                    <div className="panel">
                      <div className="ph">
                        <div>
                          <div className="ph-title">Тооцооллын үр дүн</div>
                          <div className="ph-sub">{calcId ? `Тооцоолол #${calcId}` : 'Тооцоолол сонгоогүй'}</div>
                        </div>
                        <button onClick={() => router.push('/calculate')} style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'white', border:'none', borderRadius:9, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          📐 Тооцоолол хийх
                        </button>
                      </div>
                      {calcParts.length === 0 ? (
                        <div style={{ padding:'40px 20px', textAlign:'center', color:'#94a3b8' }}>
                          <div style={{ fontSize:36, marginBottom:10 }}>📐</div>
                          <div style={{ fontSize:14, fontWeight:600, color:'#374151', marginBottom:6 }}>Тооцоолол хийгдээгүй байна</div>
                          <button onClick={() => router.push('/calculate')} style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'white', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                            Тооцоолол хийх →
                          </button>
                        </div>
                      ) : (
                        <div style={{ padding:'16px 20px' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Хавтангийн жагсаалт</div>
                          {calcParts.map(p => (
                            <div key={p.part_key} className="calc-part">
                              <div>
                                <div className="cp-label">{p.part_label}</div>
                                <div className="cp-dim">{p.width_mm} × {p.height_mm}мм × {p.qty}ш</div>
                              </div>
                              <div className="cp-area">{p.area_m2.toFixed(4)} м²</div>
                            </div>
                          ))}
                          <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:10, padding:'12px 14px', marginTop:12 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                              <span style={{ color:'#92400e', fontWeight:600 }}>Нийт талбай (хаягдалтай)</span>
                              <span style={{ fontWeight:800, color:'#d97706' }}>
                                {calcParts.reduce((s, p) => s + p.area_m2, 0).toFixed(4)} м²
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ═══ STEP 1: ҮЙЛЧИЛГЭЭ ═══ */}
              {step === 1 && (
                <div className="panel">
                  <div className="ph">
                    <div>
                      <div className="ph-title">Нэмэлт үйлчилгээ</div>
                      <div className="ph-sub">Зүсэлт, ирмэг наалт болон бусад үйлчилгээ нэмнэ үү</div>
                    </div>
                  </div>
                  {servicesLoading ? (
                    <div style={{ padding:'40px 20px', textAlign:'center', color:'#94a3b8' }}>Ачааллаж байна...</div>
                  ) : serviceTypes.length === 0 ? (
                    <div style={{ padding:'40px 20px', textAlign:'center', color:'#94a3b8' }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>🔧</div>
                      <div style={{ fontWeight:600, color:'#374151', marginBottom:4 }}>Үйлчилгээ байхгүй байна</div>
                      <div style={{ fontSize:12 }}>Нягтлан үйлчилгээ бүртгэсний дараа харагдана</div>
                    </div>
                  ) : serviceTypes.map(st => (
                    <div key={st.id}>
                      <div className="svc-type-label">
                        {st.name.toLowerCase().includes('зүс') ? '✂️' : st.name.toLowerCase().includes('ирмэг') ? '📏' : '🔧'} {st.name}
                      </div>
                      {st.services?.map(svc => {
                        const sel = selectedServices.find(s => s.service.id === svc.id);
                        return (
                          <div key={svc.id} className={`svc-card ${sel ? 'selected' : ''}`} onClick={() => toggleService(svc)}>
                            <div className={`svc-check ${sel ? 'on' : ''}`}>{sel ? '✓' : ''}</div>
                            <div className="svc-icon" style={{ background: sel ? '#fef3c7' : '#f8fafc' }}>
                              {svc.name.toLowerCase().includes('зүс') ? '✂️' : svc.name.toLowerCase().includes('ирмэг') ? '📏' : '🔧'}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="svc-name">{svc.name}</div>
                              {svc.description && <div className="svc-desc">{svc.description}</div>}
                              {sel && (
                                <div className="svc-qty-row" onClick={e => e.stopPropagation()}>
                                  <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Тоо хэмжээ:</span>
                                  <div className="qty-row">
                                    <button className="qty-b" onClick={e => { e.stopPropagation(); updateServiceQty(svc.id, sel.qty - 1); }}>−</button>
                                    <input className="qty-v" type="number" min="0.1" step="0.1" value={sel.qty}
                                      onChange={e => { e.stopPropagation(); updateServiceQty(svc.id, parseFloat(e.target.value) || 1); }}
                                      onClick={e => e.stopPropagation()} />
                                    <button className="qty-b" onClick={e => { e.stopPropagation(); updateServiceQty(svc.id, sel.qty + 1); }}>+</button>
                                  </div>
                                  <span style={{ fontSize:12, color:'#d97706', fontWeight:700 }}>₮{(svc.price * sel.qty).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <div style={{ fontSize:13, fontWeight:800, color:'#d97706' }}>₮{Number(svc.price).toLocaleString()}</div>
                              <div style={{ fontSize:10, color:'#94a3b8' }}>/ {svc.unit}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ STEP 2: ТӨЛБӨР ═══ */}
              {step === 2 && (
                <div className="panel">
                  <div className="ph">
                    <div>
                      <div className="ph-title">Төлбөрийн хэлбэр</div>
                      <div className="ph-sub">Та хэрхэн төлбөр хийхээ сонгоно уу</div>
                    </div>
                  </div>
                  <div style={{ padding:'20px' }}>
                    {PAYMENT_METHODS.map(pm => (
                      <div key={pm.value} className={`pay-card ${payMethod===pm.value ? 'on' : ''}`} onClick={() => setPayMethod(pm.value)}>
                        <div className="pay-icon">{pm.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color: payMethod===pm.value ? '#d97706' : '#0f172a' }}>{pm.label}</div>
                          <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{pm.desc}</div>
                        </div>
                        <div className={`pay-radio ${payMethod===pm.value ? 'on' : ''}`}>
                          {payMethod===pm.value && <div className="pay-radio-dot" />}
                        </div>
                      </div>
                    ))}

                    {payMethod === 'transfer' && (
                      <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#166534', marginBottom:8 }}>Дансны мэдээлэл</div>
                        {[
                          { l:'Банк',             v:'Хаан банк' },
                          { l:'Данс',             v:'5000123456' },
                          { l:'Эзэмшигч',        v:'Тавилгын цех ХХК' },
                          { l:'Гүйлгээний утга', v:'Захиалга + утасны дугаар' },
                        ].map(r => (
                          <div key={r.l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid #dcfce7' }}>
                            <span style={{ color:'#64748b' }}>{r.l}</span>
                            <span style={{ fontWeight:700, color:'#0f172a' }}>{r.v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {payMethod === 'qpay' && (
                      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:'16px', marginBottom:14, textAlign:'center' }}>
                        <div style={{ fontSize:32, marginBottom:8 }}>📱</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8', marginBottom:4 }}>QPay-р төлөх</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>Захиалга баталгаажсаны дараа QPay QR код илгээгдэнэ</div>
                      </div>
                    )}

                    <textarea
                      className="note-inp" rows={3}
                      placeholder="Нэмэлт тэмдэглэл (хүргэлтийн хаяг, тусгай хүсэлт)..."
                      value={note} onChange={e => setNote(e.target.value)}
                    />

                    <div className="agree-row" onClick={() => setAgreed(!agreed)}>
                      <div className={`agree-box ${agreed ? 'on' : ''}`}>{agreed ? '✓' : ''}</div>
                      <span className="agree-text">
                        Би <span className="agree-link">үйлчилгээний нөхцөл</span> болон
                        <span className="agree-link"> нууцлалын бодлого</span>-той танилцаж, зөвшөөрч байна.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ SUMMARY ═══ */}
            <div>
              <div className="sum">
                <div className="sum-h">
                  <div style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>Захиалгын дүн</div>
                </div>
                <div className="sum-b">
                  {mode === 'cart' && cartItems.length > 0 && (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Материал</div>
                      {cartItems.map(i => (
                        <div key={i.id} className="sum-row">
                          <span className="sum-lbl" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'60%' }}>{i.name}</span>
                          <span className="sum-val">₮{(i.price * i.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="sum-div" />
                    </>
                  )}
                  {selectedServices.length > 0 && (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Үйлчилгээ</div>
                      {selectedServices.map(s => (
                        <div key={s.service.id} className="sum-row">
                          <span className="sum-lbl" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'60%' }}>{s.service.name}</span>
                          <span className="sum-val">₮{(s.service.price * s.qty).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="sum-div" />
                    </>
                  )}
                  <div className="sum-total">
                    <span className="sum-total-lbl">Нийт дүн</span>
                    <span className="sum-total-val">₮{grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="sum-div" />

                  {step === 0 && (
                    <>
                      <button className="btn-next"
                        onClick={() => setStep(1)}
                        disabled={(mode==='cart' && cartItems.length===0) || (mode==='calc' && calcParts.length===0)}>
                        Үйлчилгээ нэмэх →
                      </button>
                      <button className="btn-back" onClick={() => router.push('/materials-page')}>Материал нэмэх</button>
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <button className="btn-next" onClick={() => setStep(2)}>Төлбөр рүү →</button>
                      <button className="btn-back" onClick={() => setStep(0)}>← Буцах</button>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <button className="btn-next" onClick={placeOrder} disabled={placing || !agreed || grandTotal===0}>
                        {placing ? '⏳ Захиалж байна...' : '✅ Захиалга баталгаажуулах'}
                      </button>
                      <button className="btn-back" onClick={() => setStep(1)}>← Буцах</button>
                    </>
                  )}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:14, fontSize:11, color:'#94a3b8' }}>
                    🔒 Таны мэдээлэл аюулгүй хадгалагдана
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        Ачааллаж байна...
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
