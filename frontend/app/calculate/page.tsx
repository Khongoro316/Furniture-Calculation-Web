'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface FurnitureType { id: number; name: string; description: string; }
interface InputField {
  id: number; field_key: string; label: string; unit: string;
  min_value: number; max_value: number; default_value: number; sort_order: number;
}
interface Part {
  part_key: string; part_label: string;
  width_mm: number; height_mm: number; qty: number;
  area_m2: number; edge_length_m: number;
}
interface CalcResult {
  parts: Part[]; total_area: number; total_area_real: number; total_edge: number;
}
interface Material {
  id: number; code: string; name: string; unit: string; price: number;
  thickness?: number; image_url?: string;
  material_types?: { name: string; material_categories?: { name: string } };
  material_images?: { url: string; is_primary: boolean }[];
}
interface Service {
  id: number; name: string; unit: string; price: number; description?: string;
}
interface ServiceType { id: number; name: string; services: Service[]; }

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ['Тооцоолол', 'Хавтан сонгох', 'Зүсэлт/Ирмэг', 'Захиалга'];

const StepBar = ({ current }: { current: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
    {STEPS.map((s, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: i < current ? '#059669' : i === current ? '#d97706' : '#e2e8f0',
            color: i <= current ? 'white' : '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, transition: 'all 0.3s',
            boxShadow: i === current ? '0 0 0 4px rgba(217,119,6,0.2)' : 'none',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          <span style={{
            fontSize: 11, fontWeight: i === current ? 700 : 500,
            color: i === current ? '#d97706' : i < current ? '#059669' : '#94a3b8',
            whiteSpace: 'nowrap',
          }}>{s}</span>
        </div>
        {i < STEPS.length - 1 && (
          <div style={{
            width: 56, height: 2,
            background: i < current ? '#059669' : '#e2e8f0',
            margin: '0 4px', marginBottom: 22, transition: 'background 0.3s',
          }} />
        )}
      </div>
    ))}
  </div>
);

// ── Material image ────────────────────────────────────────────────────────────
const MatImg = ({ m, size = 52 }: { m: Material; size?: number }) => {
  const imgs = m.material_images || [];
  const url = imgs.find(i => i.is_primary)?.url || imgs[0]?.url || m.image_url;
  if (url) return <img src={url} alt={m.name} style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} />;
  const colors: Record<string, string> = { 'ЛДСП': '#fef3c7', 'МДФ': '#dcfce7', 'HDF': '#dbeafe' };
  const bg = colors[m.material_types?.name || ''] || '#f1f5f9';
  return <div style={{ width: size, height: size, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, flexShrink: 0 }}>🪵</div>;
};

export default function CalculatePage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);

  // Step 0 — Тооцоолол
  const [furnitureTypes, setFurnitureTypes] = useState<FurnitureType[]>([]);
  const [selectedType, setSelectedType] = useState<FurnitureType | null>(null);
  const [fields, setFields] = useState<InputField[]>([]);
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCalcId, setSavedCalcId] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Step 1 — Хавтан сонгох
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matLoading, setMatLoading] = useState(false);
  const [selectedMat, setSelectedMat] = useState<Material | null>(null);
  const [matFilter, setMatFilter] = useState('');

  // Step 2 — Зүсэлт/Ирмэг
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<{ service: Service; qty: number }[]>([]);

  // Step 3 — Захиалга
  const [note, setNote] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [agreed, setAgreed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderDone, setOrderDone] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    api.get('/api/furniture-types').then(r => setFurnitureTypes(r.data)).catch(() => {});
    if (user) loadHistory();
  }, [mounted, user]);

  useEffect(() => {
    if (!selectedType) return;
    api.get(`/api/furniture-types/${selectedType.id}/fields`).then(r => {
      const sorted = r.data.sort((a: InputField, b: InputField) => a.sort_order - b.sort_order);
      setFields(sorted);
      const def: Record<string, number> = {};
      sorted.forEach((f: InputField) => { def[f.field_key] = Number(f.default_value); });
      setInputs(def);
      setResult(null); setSavedCalcId(null);
    }).catch(() => {});
  }, [selectedType]);

  useEffect(() => {
    if (step === 1 && materials.length === 0) loadMaterials();
    if (step === 2 && serviceTypes.length === 0) loadServices();
  }, [step]);

  const loadHistory = async () => {
    const r = await api.get('/api/calculations').catch(() => ({ data: [] }));
    setHistory(r.data.slice(0, 6));
  };

  const loadMaterials = async () => {
    setMatLoading(true);
    const r = await api.get('/api/materials').catch(() => ({ data: [] }));
    // Зөвхөн хавтан (ЛДСП, МДФ, HDF) материалуудыг харуулна
    const boards = r.data.filter((m: Material) => {
      const t = m.material_types?.name?.toLowerCase() || '';
      const c = m.material_types?.material_categories?.name?.toLowerCase() || '';
      return t.includes('лдсп') || t.includes('мдф') || t.includes('hdf') || c.includes('хавтан');
    });
    setMaterials(boards.length > 0 ? boards : r.data);
    setMatLoading(false);
  };

  const loadServices = async () => {
    setSvcLoading(true);
    const r = await api.get('/api/services/types').catch(() => ({ data: [] }));
    setServiceTypes(r.data);
    setSvcLoading(false);
  };

  // ── Тооцоолол хийх ───────────────────────────────────────────────────────────
  const handleCalculate = async () => {
    if (!selectedType) return;
    setCalcLoading(true);
    try {
      const endpoint = user ? '/api/calculations' : '/api/calculations/guest';
      const res = await api.post(endpoint, { furniture_type_id: selectedType.id, inputs, save: false });
      setResult(res.data);
      setSavedCalcId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Тооцооны алдаа гарлаа');
    } finally { setCalcLoading(false); }
  };

  // ── Тооцоолол хадгалах ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedType || !user) { router.push('/auth/login'); return; }
    setSaving(true);
    try {
      const res = await api.post('/api/calculations', {
        furniture_type_id: selectedType.id, inputs, save: true,
      });
      setSavedCalcId(res.data.id);
      loadHistory();
    } catch { alert('Хадгалахад алдаа гарлаа'); }
    finally { setSaving(false); }
  };

  // ── Үйлчилгээ toggle ─────────────────────────────────────────────────────────
  const toggleSvc = (svc: Service) => {
    const idx = selectedServices.findIndex(s => s.service.id === svc.id);
    setSelectedServices(idx >= 0
      ? selectedServices.filter((_, i) => i !== idx)
      : [...selectedServices, { service: svc, qty: 1 }]
    );
  };

  const updateSvcQty = (id: number, qty: number) => {
    if (qty <= 0) { setSelectedServices(p => p.filter(s => s.service.id !== id)); return; }
    setSelectedServices(p => p.map(s => s.service.id === id ? { ...s, qty } : s));
  };

  // ── Нийт дүн ─────────────────────────────────────────────────────────────────
  const matCost = selectedMat && result
    ? Number(selectedMat.price) * Number(result.total_area_real)
    : 0;
  const svcCost = selectedServices.reduce((s, i) => s + i.service.price * i.qty, 0);
  const grandTotal = matCost + svcCost;

  // ── Захиалга өгөх ─────────────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (!agreed) { alert('Үйлчилгээний нөхцөлтэй зөвшөөрнө үү'); return; }
    setPlacing(true);
    try {
      const items = selectedMat && result ? [{
        material_id: selectedMat.id,
        quantity: Number(result.total_area_real.toFixed(4)),
        unit_price: selectedMat.price,
      }] : [];

      const res = await api.post('/api/orders', {
        total_amount: grandTotal,
        note,
        calculation_id: savedCalcId || null,
        items,
        services: selectedServices.map(s => ({
          service_id: s.service.id, quantity: s.qty, unit_price: s.service.price,
        })),
      });

      if (grandTotal > 0) {
        await api.post(`/api/orders/${res.data.id}/payment`, {
          amount: grandTotal, method: payMethod,
        }).catch(() => {});
      }

      setOrderDone(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Захиалга өгөхөд алдаа гарлаа');
    } finally { setPlacing(false); }
  };

  // Түүхээс дахин ачаалах
  const loadFromHistory = (h: any) => {
    const ft = furnitureTypes.find(f => f.id === h.furniture_type_id);
    if (ft) {
      setSelectedType(ft);
      try { setInputs(JSON.parse(h.input_data)); } catch {}
      setResult(JSON.parse(h.result_data || '{}'));
      setSavedCalcId(h.id);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f1f5f9;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}

        /* NAV */
        .topnav{background:white;border-bottom:1px solid #e2e8f0;height:62px;display:flex;align-items:center;padding:0 28px;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .back{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#64748b;border:none;background:none;font-family:inherit;padding:7px 11px;border-radius:8px;cursor:pointer;transition:all 0.15s}
        .back:hover{background:#f1f5f9;color:#0f172a}

        /* WRAP */
        .wrap{max-width:1000px;margin:0 auto;padding:24px 20px 60px}
        .grid2{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start}

        /* PANEL */
        .panel{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;animation:fadeUp 0.3s ease}
        .ph{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px}
        .ph-title{font-size:14px;font-weight:800;color:#0f172a}
        .ph-sub{font-size:11px;color:#94a3b8;margin-left:auto}

        /* TYPE GRID */
        .type-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;padding:14px}
        .type-card{border:2px solid #e2e8f0;border-radius:12px;padding:14px 12px;cursor:pointer;text-align:center;transition:all 0.15s}
        .type-card:hover{border-color:#d97706;background:#fffbf5}
        .type-card.on{border-color:#d97706;background:#fffbf5;box-shadow:0 0 0 3px rgba(217,119,6,0.12)}
        .type-icon{font-size:28px;margin-bottom:7px}
        .type-name{font-size:12px;font-weight:700;color:#0f172a}
        .type-desc{font-size:10px;color:#94a3b8;margin-top:3px}

        /* FIELDS */
        .field-wrap{padding:14px 20px}
        .field-item{margin-bottom:14px}
        .field-lbl{font-size:12px;font-weight:700;color:#374151;display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}
        .field-unit{font-size:10px;color:#94a3b8;font-weight:400}
        .inp-row{display:flex;align-items:center;gap:0;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;transition:border-color 0.15s}
        .inp-row:focus-within{border-color:#d97706}
        .inp-num{flex:1;border:none;outline:none;padding:10px 14px;font-size:14px;font-weight:700;color:#0f172a;font-family:inherit;background:white}
        .inp-unit{padding:0 12px;font-size:11px;color:#94a3b8;background:#f8fafc;border-left:1.5px solid #e2e8f0;height:40px;display:flex;align-items:center;white-space:nowrap}
        .inp-btns{display:flex;flex-direction:column;border-left:1.5px solid #e2e8f0}
        .inp-btn{width:28px;height:20px;border:none;background:white;cursor:pointer;font-size:9px;color:#64748b;display:flex;align-items:center;justify-content:center;transition:background 0.1s}
        .inp-btn:hover{background:#f1f5f9}
        .inp-btn:first-child{border-bottom:1px solid #e2e8f0}

        /* CALC BUTTON */
        .calc-btn{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:11px;padding:13px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;margin-top:4px;box-shadow:0 4px 14px rgba(217,119,6,0.3)}
        .calc-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(217,119,6,0.4)}
        .calc-btn:disabled{opacity:0.55;cursor:not-allowed}
        .save-btn{width:100%;background:#059669;color:white;border:none;border-radius:11px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;margin-top:8px}
        .save-btn:hover:not(:disabled){background:#047857}
        .save-btn:disabled{opacity:0.55;cursor:not-allowed}

        /* RESULT */
        .result-wrap{padding:16px 20px;animation:fadeUp 0.3s ease}
        .res-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
        .res-stat{border-radius:11px;padding:12px;text-align:center}
        .res-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;opacity:0.75;margin-bottom:4px}
        .res-val{font-size:20px;font-weight:800;line-height:1}
        .res-unit{font-size:10px;opacity:0.6;margin-top:3px}
        .parts-tbl{width:100%;border-collapse:collapse;font-size:11px}
        .parts-tbl th{padding:8px 10px;background:#f8fafc;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;text-align:left;border-bottom:1px solid #f1f5f9}
        .parts-tbl td{padding:9px 10px;border-bottom:1px solid #f9fafb}
        .parts-tbl tr:last-child td{border-bottom:none}
        .parts-tbl tr:hover td{background:#fafafa}

        /* HISTORY */
        .hist-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f9fafb;cursor:pointer;transition:background 0.12s}
        .hist-item:last-child{border-bottom:none}
        .hist-item:hover{background:#fffbf5}
        .hist-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}

        /* MAT CARDS */
        .mat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:14px}
        .mat-card{border:2px solid #e2e8f0;border-radius:13px;overflow:hidden;cursor:pointer;transition:all 0.2s}
        .mat-card:hover{border-color:#d97706;transform:translateY(-2px)}
        .mat-card.on{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.15)}
        .mat-body{padding:10px 12px}
        .mat-name{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:2px;line-height:1.3}
        .mat-code{font-family:monospace;font-size:10px;color:#d97706;background:#fef3c7;padding:1px 5px;border-radius:3px}
        .mat-price{font-size:14px;font-weight:800;color:#0f172a}
        .mat-unit{font-size:10px;color:#94a3b8}

        /* SERVICES */
        .svc-type{padding:10px 20px 4px;font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;border-top:1px solid #f1f5f9}
        .svc-item{display:flex;align-items:center;gap:10px;padding:11px 20px;border-bottom:1px solid #f8fafc;cursor:pointer;transition:background 0.12s}
        .svc-item:hover{background:#fafafa}
        .svc-item.on{background:#fffbf5}
        .svc-check{width:18px;height:18px;border-radius:5px;border:2px solid #e2e8f0;display:flex;align-items:center;justify-content:center;font-size:10px;transition:all 0.15s;flex-shrink:0}
        .svc-check.on{background:#d97706;border-color:#d97706;color:white}
        .svc-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
        .qty-row{display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-top:5px}
        .qty-b{width:26px;height:26px;border:none;background:white;cursor:pointer;font-size:14px;font-weight:700;color:#374151;display:flex;align-items:center;justify-content:center}
        .qty-b:hover{background:#f1f5f9}
        .qty-v{width:32px;text-align:center;font-size:12px;font-weight:700;border:none;border-left:1.5px solid #e2e8f0;border-right:1.5px solid #e2e8f0;padding:3px 0;font-family:inherit;background:white;outline:none}

        /* SUMMARY */
        .sum{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;position:sticky;top:82px}
        .sum-h{padding:14px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:800;color:#0f172a}
        .sum-b{padding:16px 18px}
        .sum-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:9px}
        .sum-lbl{color:#64748b;font-weight:500}
        .sum-val{font-weight:700;color:#0f172a}
        .sum-div{height:1px;background:#f1f5f9;margin:12px 0}
        .sum-total{display:flex;justify-content:space-between;align-items:center}
        .sum-total-lbl{font-size:14px;font-weight:700;color:#0f172a}
        .sum-total-val{font-size:22px;font-weight:800;color:#d97706}
        .btn-next{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:11px;padding:13px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 4px 14px rgba(217,119,6,0.3);margin-top:14px}
        .btn-next:hover:not(:disabled){transform:translateY(-1px)}
        .btn-next:disabled{opacity:0.55;cursor:not-allowed}
        .btn-prev{width:100%;background:#f1f5f9;color:#374151;border:none;border-radius:11px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:8px}
        .btn-prev:hover{background:#e2e8f0}

        /* PAYMENT */
        .pay-card{border:2px solid #e2e8f0;border-radius:12px;padding:12px 14px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:10px;margin-bottom:8px}
        .pay-card:hover{border-color:#d97706}
        .pay-card.on{border-color:#d97706;background:#fffbf5}
        .note-inp{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;resize:none;transition:border-color 0.15s;margin-top:12px}
        .note-inp:focus{border-color:#d97706}
        .agree-row{display:flex;align-items:flex-start;gap:8px;margin:12px 0;cursor:pointer}
        .agree-box{width:18px;height:18px;border-radius:5px;border:2px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all 0.15s}
        .agree-box.on{background:#d97706;border-color:#d97706;color:white;font-size:11px}
        .mat-filter-row{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 10px}
        .mat-flt{font-size:11px;font-weight:600;padding:5px 12px;border-radius:100px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s;white-space:nowrap}
        .mat-flt.on{background:#1c1917;color:white;border-color:#1c1917}

        .success-wrap{text-align:center;padding:56px 24px;animation:fadeUp 0.5s ease}
        @media(max-width:760px){.grid2{grid-template-columns:1fr}.sum{position:static}}
        @media(max-width:500px){.wrap{padding:16px}.type-grid{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      {/* NAV */}
      <nav className="topnav">
        <button className="back" onClick={() => router.push('/')}>← Нүүр</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginLeft: 8 }}>
          {orderDone ? '✅ Захиалга амжилттай' :
           step === 0 ? '📐 Тооцоолол хийх' :
           step === 1 ? '🪵 Хавтан сонгох' :
           step === 2 ? '✂️ Зүсэлт & Ирмэг наалт' :
           '💳 Захиалга баталгаажуулах'}
        </span>
        {user && (
          <button
            onClick={() => router.push('/my-orders')}
            style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            📦 Миний захиалга
          </button>
        )}
      </nav>

      <div className="wrap">

        {/* ── АМЖИЛТЫН ДЭЛГЭЦ ── */}
        {orderDone && (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div className="panel">
              <div className="success-wrap">
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Захиалга амжилттай!</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                  Таны захиалга бүртгэгдлээ.<br />Байгууллага хүлээн авмагц холбоо барина.
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
                  {[
                    { l: 'Захиалгын дугаар', v: orderDone.order_no, mono: true },
                    { l: 'Нийт дүн',         v: `₮${Number(orderDone.total_amount).toLocaleString()}` },
                    { l: 'Хавтан материал',  v: selectedMat?.name || '—' },
                    { l: 'Нийт талбай',      v: result ? `${Number(result.total_area_real).toFixed(3)} м²` : '—' },
                  ].map(r => (
                    <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>{r.l}</span>
                      <span style={{ fontWeight: 700, color: r.mono ? '#d97706' : '#0f172a', fontFamily: r.mono ? 'monospace' : 'inherit' }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => router.push('/my-orders')} style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 11, padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📦 Захиалга харах</button>
                  <button onClick={() => { setOrderDone(null); setStep(0); setResult(null); setSavedCalcId(null); setSelectedMat(null); setSelectedServices([]); }} style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 11, padding: '12px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Шинэ тооцоолол</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!orderDone && (
          <>
            <StepBar current={step} />

            <div className="grid2">
              {/* ════════════════ ЗҮҮн ════════════════ */}
              <div>

                {/* ═══ STEP 0: ТООЦООЛОЛ ═══ */}
                {step === 0 && (
                  <>
                    {/* Тавилгын төрөл */}
                    <div className="panel" style={{ marginBottom: 14 }}>
                      <div className="ph">
                        <span style={{ fontSize: 16 }}>🪑</span>
                        <span className="ph-title">Тавилгын төрөл сонгох</span>
                      </div>
                      {furnitureTypes.length === 0 ? (
                        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                          Тавилгын төрөл байхгүй байна
                        </div>
                      ) : (
                        <div className="type-grid">
                          {furnitureTypes.map(ft => (
                            <div key={ft.id} className={`type-card ${selectedType?.id === ft.id ? 'on' : ''}`} onClick={() => setSelectedType(ft)}>
                              <div className="type-icon">🪑</div>
                              <div className="type-name">{ft.name}</div>
                              {ft.description && <div className="type-desc">{ft.description}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Хэмжээ оруулах */}
                    {selectedType && (
                      <div className="panel" style={{ marginBottom: 14 }}>
                        <div className="ph">
                          <span style={{ fontSize: 16 }}>📏</span>
                          <span className="ph-title">{selectedType.name} — хэмжээ оруулах</span>
                        </div>
                        <div className="field-wrap">
                          {fields.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Оролтын талбар бүртгэгдээгүй байна</div>
                              <div style={{ fontSize: 12, marginTop: 4 }}>Super admin тооцооны талбар нэмнэ үү</div>
                            </div>
                          ) : fields.map(f => (
                            <div key={f.field_key} className="field-item">
                              <div className="field-lbl">
                                {f.label}
                                {f.unit && <span className="field-unit">{f.unit}</span>}
                              </div>
                              <div className="inp-row">
                                <input
                                  className="inp-num"
                                  type="number"
                                  value={inputs[f.field_key] ?? ''}
                                  min={Number(f.min_value)}
                                  max={Number(f.max_value)}
                                  placeholder={String(f.default_value)}
                                  onChange={e => setInputs(p => ({ ...p, [f.field_key]: Number(e.target.value) }))}
                                />
                                <div className="inp-btns">
                                  <button className="inp-btn" onClick={() => setInputs(p => ({ ...p, [f.field_key]: (p[f.field_key] || 0) + 10 }))}>▲</button>
                                  <button className="inp-btn" onClick={() => setInputs(p => ({ ...p, [f.field_key]: Math.max(0, (p[f.field_key] || 0) - 10) }))}>▼</button>
                                </div>
                                {f.unit && <div className="inp-unit">{f.unit}</div>}
                              </div>
                            </div>
                          ))}
                          <button className="calc-btn" onClick={handleCalculate} disabled={calcLoading || fields.length === 0}>
                            {calcLoading ? '⏳ Тооцоолж байна...' : '⚡ Тооцоолол хийх'}
                          </button>
                          {result && !savedCalcId && user && (
                            <button className="save-btn" onClick={handleSave} disabled={saving}>
                              {saving ? '⏳ Хадгалж байна...' : '💾 Тооцоо хадгалах'}
                            </button>
                          )}
                          {savedCalcId && (
                            <div style={{ background: '#dcfce7', borderRadius: 10, padding: '10px 14px', marginTop: 8, fontSize: 12, fontWeight: 600, color: '#166534', textAlign: 'center' }}>
                              ✅ Тооцоо хадгалагдлаа
                            </div>
                          )}
                          {!user && result && (
                            <div style={{ background: '#fef3c7', borderRadius: 10, padding: '10px 14px', marginTop: 8, fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                              <span>💡 Хадгалж захиалга хийхийн тулд нэвтэрнэ үү</span>
                              <button onClick={() => router.push('/auth/login')} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Нэвтрэх</button>
                            </div>
                          )}
                        </div>

                        {/* Үр дүн */}
                        {result && (
                          <div className="result-wrap" style={{ borderTop: '1px solid #f1f5f9' }}>
                            <div className="res-stats">
                              {[
                                { l: 'Нийт талбай', v: Number(result.total_area).toFixed(3), u: 'м²', bg: '#fef3c7', c: '#d97706' },
                                { l: '+10% хаягдал', v: Number(result.total_area_real).toFixed(3), u: 'м²', bg: '#fee2e2', c: '#dc2626' },
                                { l: 'Ирмэг наалт', v: Number(result.total_edge).toFixed(2), u: 'м', bg: '#dcfce7', c: '#059669' },
                              ].map(s => (
                                <div key={s.l} className="res-stat" style={{ background: s.bg }}>
                                  <div className="res-label" style={{ color: s.c }}>{s.l}</div>
                                  <div className="res-val" style={{ color: s.c }}>{s.v}</div>
                                  <div className="res-unit" style={{ color: s.c }}>{s.u}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                              <table className="parts-tbl">
                                <thead>
                                  <tr>
                                    <th>Эд анги</th>
                                    <th>Өргөн мм</th>
                                    <th>Өндөр мм</th>
                                    <th>Тоо</th>
                                    <th>Талбай м²</th>
                                    <th>Ирмэг м</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.parts.map((p, i) => (
                                    <tr key={i}>
                                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.part_label}</td>
                                      <td style={{ color: '#d97706', fontWeight: 600 }}>{p.width_mm.toLocaleString()}</td>
                                      <td style={{ color: '#d97706', fontWeight: 600 }}>{p.height_mm.toLocaleString()}</td>
                                      <td><span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>×{p.qty}</span></td>
                                      <td style={{ fontWeight: 700 }}>{p.area_m2.toFixed(4)}</td>
                                      <td style={{ color: p.edge_length_m > 0 ? '#059669' : '#d1d5db', fontWeight: p.edge_length_m > 0 ? 600 : 400 }}>
                                        {p.edge_length_m > 0 ? p.edge_length_m.toFixed(3) : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                                    <td>Нийт</td><td></td><td></td><td></td>
                                    <td style={{ color: '#d97706' }}>{Number(result.total_area).toFixed(4)}</td>
                                    <td style={{ color: '#059669' }}>{Number(result.total_edge).toFixed(3)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Хийсэн тооцоолол */}
                    {user && history.length > 0 && (
                      <div className="panel">
                        <div className="ph">
                          <span style={{ fontSize: 16 }}>🕐</span>
                          <span className="ph-title">Хадгалсан тооцоолол</span>
                          <span className="ph-sub">{history.length} тооцоо</span>
                        </div>
                        {history.map((h: any, i: number) => (
                          <div key={i} className="hist-item" onClick={() => loadFromHistory(h)}>
                            <div className="hist-icon">🪑</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{h.furniture_types?.name || 'Тавилга'}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(h.created_at).toLocaleDateString('mn-MN')}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{Number(h.total_area || 0).toFixed(2)} м²</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>Дахин ачаалах</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ═══ STEP 1: ХАВТАН СОНГОХ ═══ */}
                {step === 1 && (
                  <div className="panel">
                    <div className="ph">
                      <span style={{ fontSize: 16 }}>🪵</span>
                      <span className="ph-title">Хавтан материал сонгох</span>
                      {result && <span className="ph-sub">Хэрэгцээт талбай: <b style={{ color: '#d97706' }}>{Number(result.total_area_real).toFixed(3)} м²</b></span>}
                    </div>
                    <div className="mat-filter-row">
                      {['Бүгд', 'ЛДСП', 'МДФ', 'HDF'].map(f => (
                        <button key={f} className={`mat-flt ${matFilter === (f === 'Бүгд' ? '' : f) ? 'on' : ''}`}
                          onClick={() => setMatFilter(f === 'Бүгд' ? '' : f)}>
                          {f}
                        </button>
                      ))}
                    </div>
                    {matLoading ? (
                      <div className="mat-grid">
                        {[1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 140 }} />)}
                      </div>
                    ) : (
                      <div className="mat-grid">
                        {materials
                          .filter(m => !matFilter || m.material_types?.name?.includes(matFilter))
                          .map(m => (
                            <div key={m.id} className={`mat-card ${selectedMat?.id === m.id ? 'on' : ''}`} onClick={() => setSelectedMat(m)}>
                              <div style={{ height: 90, overflow: 'hidden' }}>
                                <MatImg m={m} size={90} />
                              </div>
                              <div className="mat-body">
                                <div className="mat-code">{m.code}</div>
                                <div className="mat-name" style={{ marginTop: 4 }}>{m.name}</div>
                                {m.thickness && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{m.thickness}мм</div>}
                                <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 3 }}>
                                  <span className="mat-price">₮{Number(m.price).toLocaleString()}</span>
                                  <span className="mat-unit">/ {m.unit}</span>
                                </div>
                                {result && (
                                  <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: 5, display: 'inline-block' }}>
                                    Нийт: ₮{(m.price * Number(result.total_area_real)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        {materials.length === 0 && (
                          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🪵</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Хавтан материал байхгүй байна</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ STEP 2: ЗҮСЭЛТ/ИРМЭГ ═══ */}
                {step === 2 && (
                  <div className="panel">
                    <div className="ph">
                      <span style={{ fontSize: 16 }}>✂️</span>
                      <span className="ph-title">Нэмэлт үйлчилгээ</span>
                      <span className="ph-sub">Заавал биш</span>
                    </div>
                    {svcLoading ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Ачааллаж байна...</div>
                    ) : serviceTypes.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Үйлчилгээ байхгүй байна</div>
                        <div style={{ fontSize: 12 }}>Нягтлан үйлчилгээ нэмсний дараа харагдана</div>
                      </div>
                    ) : serviceTypes.map(st => (
                      <div key={st.id}>
                        <div className="svc-type">
                          {st.name.toLowerCase().includes('зүс') ? '✂️' : st.name.toLowerCase().includes('ирмэг') ? '📏' : '🔧'} {st.name}
                        </div>
                        {st.services?.map(svc => {
                          const sel = selectedServices.find(s => s.service.id === svc.id);
                          return (
                            <div key={svc.id} className={`svc-item ${sel ? 'on' : ''}`} onClick={() => toggleSvc(svc)}>
                              <div className={`svc-check ${sel ? 'on' : ''}`}>{sel ? '✓' : ''}</div>
                              <div className="svc-icon" style={{ background: sel ? '#fef3c7' : '#f8fafc' }}>
                                {svc.name.toLowerCase().includes('зүс') ? '✂️' : svc.name.toLowerCase().includes('ирмэг') ? '📏' : '🔧'}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{svc.name}</div>
                                {svc.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{svc.description}</div>}
                                {sel && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }} onClick={e => e.stopPropagation()}>
                                    <div className="qty-row">
                                      <button className="qty-b" onClick={e => { e.stopPropagation(); updateSvcQty(svc.id, sel.qty - 1); }}>−</button>
                                      <input className="qty-v" type="number" min="0.1" step="0.1" value={sel.qty}
                                        onChange={e => { e.stopPropagation(); updateSvcQty(svc.id, parseFloat(e.target.value) || 1); }}
                                        onClick={e => e.stopPropagation()} />
                                      <button className="qty-b" onClick={e => { e.stopPropagation(); updateSvcQty(svc.id, sel.qty + 1); }}>+</button>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>₮{(svc.price * sel.qty).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#d97706' }}>₮{Number(svc.price).toLocaleString()}</div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>/ {svc.unit}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* ═══ STEP 3: ЗАХИАЛГА ═══ */}
                {step === 3 && (
                  <div className="panel">
                    <div className="ph">
                      <span style={{ fontSize: 16 }}>💳</span>
                      <span className="ph-title">Төлбөрийн хэлбэр</span>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      {[
                        { v: 'cash',     l: 'Бэлэн мөнгө',       i: '💵', d: 'Байгууллагад очиж төлөх' },
                        { v: 'transfer', l: 'Банкны шилжүүлэг',   i: '🏦', d: 'Дансаар шилжүүлэх' },
                        { v: 'qpay',     l: 'QPay',                i: '📱', d: 'QPay-р төлөх' },
                      ].map(pm => (
                        <div key={pm.v} className={`pay-card ${payMethod === pm.v ? 'on' : ''}`} onClick={() => setPayMethod(pm.v)}>
                          <span style={{ fontSize: 22, flexShrink: 0 }}>{pm.i}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: payMethod === pm.v ? '#d97706' : '#0f172a' }}>{pm.l}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{pm.d}</div>
                          </div>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${payMethod === pm.v ? '#d97706' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {payMethod === pm.v && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} />}
                          </div>
                        </div>
                      ))}

                      {payMethod === 'transfer' && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 11, padding: '12px 14px', marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Дансны мэдээлэл</div>
                          {[
                            { l: 'Банк', v: 'Хаан банк' },
                            { l: 'Данс', v: '5000123456' },
                            { l: 'Эзэмшигч', v: 'Тавилгын цех ХХК' },
                            { l: 'Утга', v: 'Захиалга + утас' },
                          ].map(r => (
                            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid #dcfce7' }}>
                              <span style={{ color: '#64748b' }}>{r.l}</span>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <textarea className="note-inp" rows={3}
                        placeholder="Нэмэлт тэмдэглэл (хүргэлтийн хаяг, тусгай хүсэлт)..."
                        value={note} onChange={e => setNote(e.target.value)} />

                      <div className="agree-row" onClick={() => setAgreed(!agreed)}>
                        <div className={`agree-box ${agreed ? 'on' : ''}`}>{agreed ? '✓' : ''}</div>
                        <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                          Үйлчилгээний нөхцөл болон нууцлалын бодлоготой зөвшөөрч байна
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ════════════════ БАРУУН: Summary ════════════════ */}
              <div>
                <div className="sum">
                  <div className="sum-h">Захиалгын дүн</div>
                  <div className="sum-b">

                    {/* Тооцооллын үр дүн */}
                    {result && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Тооцооллын үр дүн</div>
                        <div className="sum-row">
                          <span className="sum-lbl">Нийт талбай</span>
                          <span className="sum-val">{Number(result.total_area).toFixed(3)} м²</span>
                        </div>
                        <div className="sum-row">
                          <span className="sum-lbl">+10% хаягдал</span>
                          <span className="sum-val" style={{ color: '#dc2626' }}>{Number(result.total_area_real).toFixed(3)} м²</span>
                        </div>
                        <div className="sum-row">
                          <span className="sum-lbl">Ирмэг</span>
                          <span className="sum-val">{Number(result.total_edge).toFixed(2)} м</span>
                        </div>
                        <div className="sum-div" />
                      </>
                    )}

                    {/* Хавтан */}
                    {selectedMat && result && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Хавтан материал</div>
                        <div className="sum-row">
                          <span className="sum-lbl" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{selectedMat.name}</span>
                          <span className="sum-val">₮{matCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8, marginTop: -6 }}>
                          {Number(result.total_area_real).toFixed(3)} м² × ₮{Number(selectedMat.price).toLocaleString()}
                        </div>
                        <div className="sum-div" />
                      </>
                    )}

                    {/* Үйлчилгээ */}
                    {selectedServices.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Үйлчилгээ</div>
                        {selectedServices.map(s => (
                          <div key={s.service.id} className="sum-row">
                            <span className="sum-lbl" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{s.service.name}</span>
                            <span className="sum-val">₮{(s.service.price * s.qty).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="sum-div" />
                      </>
                    )}

                    {/* Нийт */}
                    <div className="sum-total">
                      <span className="sum-total-lbl">Нийт дүн</span>
                      <span className="sum-total-val">₮{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div className="sum-div" />

                    {/* Товчнууд */}
                    {step === 0 && (
                      <button className="btn-next"
                        onClick={() => setStep(1)}
                        disabled={!result}>
                        Хавтан сонгох →
                      </button>
                    )}
                    {step === 1 && (
                      <>
                        <button className="btn-next" onClick={() => setStep(2)} disabled={!selectedMat}>
                          Үйлчилгээ нэмэх →
                        </button>
                        <button className="btn-prev" onClick={() => setStep(0)}>← Тооцоолол</button>
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <button className="btn-next" onClick={() => {
                          if (!user) { router.push('/auth/login'); return; }
                          setStep(3);
                        }}>
                          Захиалга хийх →
                        </button>
                        <button className="btn-prev" onClick={() => setStep(1)}>← Хавтан</button>
                      </>
                    )}
                    {step === 3 && (
                      <>
                        <button className="btn-next" onClick={placeOrder} disabled={placing || !agreed || grandTotal === 0}>
                          {placing ? '⏳ Захиалж байна...' : '✅ Захиалга баталгаажуулах'}
                        </button>
                        <button className="btn-prev" onClick={() => setStep(2)}>← Үйлчилгээ</button>
                      </>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12, fontSize: 11, color: '#94a3b8' }}>
                      🔒 Таны мэдээлэл аюулгүй хадгалагдана
                    </div>
                  </div>
                </div>

                {/* Хадгалсан тооцоо товч */}
                {step > 0 && savedCalcId && (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '10px 14px', marginTop: 10, fontSize: 12, color: '#166534', fontWeight: 600, textAlign: 'center' }}>
                    ✅ Тооцоо #{savedCalcId} хадгалагдсан
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}