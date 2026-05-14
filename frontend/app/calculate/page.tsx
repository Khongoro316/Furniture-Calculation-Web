'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface FurnitureType { id: number; name: string; description: string; }
interface InputField { id: number; field_key: string; label: string; unit: string; min_value: number; max_value: number; default_value: number; sort_order: number; }
interface Part { part_key: string; part_label: string; width_mm: number; height_mm: number; qty: number; area_m2: number; edge_length_m: number; }
interface CalcResult { parts: Part[]; total_area: number; total_area_real: number; total_edge: number; }

export default function CalculatePage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [furnitureTypes, setFurnitureTypes] = useState<FurnitureType[]>([]);
  const [selectedType, setSelectedType] = useState<FurnitureType | null>(null);
  const [fields, setFields] = useState<InputField[]>([]);
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
// State нэмэх (бусад state-уудын хажууд)
const [savedCalcId, setSavedCalcId] = useState<number | null>(null);
  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    api.get('/api/furniture-types').then(res => setFurnitureTypes(res.data)).catch(() => {});
    if (user) loadHistory();
  }, [mounted, user]);

  useEffect(() => {
    if (!selectedType) return;
    api.get(`/api/furniture-types/${selectedType.id}/fields`).then(res => {
      const sorted = res.data.sort((a: InputField, b: InputField) => a.sort_order - b.sort_order);
      setFields(sorted);
      const defaults: Record<string, number> = {};
      sorted.forEach((f: InputField) => { defaults[f.field_key] = Number(f.default_value); });
      setInputs(defaults);
      setResult(null); setSaved(false);
    }).catch(() => {});
  }, [selectedType]);

  const loadHistory = async () => {
    const res = await api.get('/api/calculations').catch(() => ({ data: [] }));
    setHistory(res.data.slice(0, 5));
  };

  const handleCalculate = async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      const endpoint = user ? '/api/calculations' : '/api/calculations/guest';
      const res = await api.post(endpoint, { furniture_type_id: selectedType.id, inputs, save: false });
      setResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Тооцооны алдаа гарлаа');
    } finally { setLoading(false); }
  };

  
const handleSave = async () => {
  if (!selectedType || !user) { router.push('/auth/login'); return; }
  setSaving(true);
  try {
    const res = await api.post('/api/calculations', {
      furniture_type_id: selectedType.id, inputs, save: true
    });
    setSavedCalcId(res.data.id);  // ← НЭМЭХ
    setSaved(true);
    loadHistory();
  } catch { alert('Хадгалахад алдаа гарлаа'); }
  finally { setSaving(false); }
};
  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8f9fb}
        .page{min-height:100vh;background:#f8f9fb}

        /* TOP NAV */
        .topnav{background:white;border-bottom:1px solid #f0f0f0;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 8px rgba(0,0,0,0.05)}
        .tn-left{display:flex;align-items:center;gap:12px}
        .back-btn{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#6b7280;cursor:pointer;border:none;background:none;font-family:inherit;padding:7px 12px;border-radius:8px;transition:all 0.15s}
        .back-btn:hover{background:#f5f5f7;color:#1c1917}
        .page-title{font-size:15px;font-weight:700;color:#1c1917}
        .tn-right{display:flex;align-items:center;gap:10px}
        .user-chip{display:flex;align-items:center;gap:8px;background:#f5f5f7;border-radius:10px;padding:5px 12px 5px 6px;cursor:pointer;transition:all 0.15s}
        .user-chip:hover{background:#fef3c7}
        .uc-av{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white}
        .uc-name{font-size:12px;font-weight:600;color:#1c1917}
        .uc-role{font-size:10px;color:#9ca3af}
        .dashboard-btn{background:#1c1917;color:white;border:none;border-radius:9px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .dashboard-btn:hover{background:#374151}

        /* MAIN */
        .main{max-width:1200px;margin:0 auto;padding:28px 24px}

        /* FURNITURE TYPE SELECT */
        .type-select-wrap{margin-bottom:24px}
        .type-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
        .type-card{background:white;border:2px solid #f0f0f0;border-radius:14px;padding:16px;cursor:pointer;transition:all 0.2s;text-align:center}
        .type-card:hover{border-color:#d97706;box-shadow:0 4px 16px rgba(217,119,6,0.15);transform:translateY(-2px)}
        .type-card.selected{border-color:#d97706;background:#f5f7ff;box-shadow:0 4px 16px rgba(217,119,6,0.2)}
        .type-icon{font-size:36px;margin-bottom:8px}
        .type-name{font-size:13px;font-weight:700;color:#1c1917}
        .type-desc{font-size:11px;color:#9ca3af;margin-top:3px}

        /* CALC LAYOUT */
        .calc-layout{display:grid;grid-template-columns:340px 1fr;gap:20px;align-items:start}

        /* INPUT PANEL */
        .panel{background:white;border-radius:16px;border:1px solid #f0f0f0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
        .panel-head{padding:16px 20px;border-bottom:1px solid #f8f8f8;display:flex;align-items:center;gap:8px}
        .panel-title{font-size:14px;font-weight:700;color:#1c1917}
        .panel-body{padding:20px}
        .field{margin-bottom:14px}
        .field-label{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:flex;align-items:center;justify-content:space-between}
        .field-unit{font-size:11px;color:#9ca3af;font-weight:400}
        .inp-row{display:flex;align-items:center;border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;transition:all 0.15s;background:white}
        .inp-row:focus-within{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .inp-row input{flex:1;border:none;outline:none;padding:10px 12px;font-size:14px;font-weight:600;color:#1c1917;font-family:inherit;background:transparent}
        .inp-unit{padding:0 12px;font-size:11px;color:#9ca3af;background:#f9fafb;height:100%;display:flex;align-items:center;border-left:1px solid #f3f4f6;font-weight:600;white-space:nowrap;min-height:42px}
        .inp-btns{display:flex;flex-direction:column;border-left:1px solid #f3f4f6}
        .inp-btn{width:28px;height:21px;border:none;background:none;cursor:pointer;color:#9ca3af;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all 0.1s}
        .inp-btn:hover{background:#f3f4f6;color:#1c1917}
        .calc-action-btn{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:11px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 6px 20px rgba(217,119,6,0.3);margin-top:4px}
        .calc-action-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 28px rgba(217,119,6,0.4)}
        .calc-action-btn:disabled{opacity:0.5;cursor:not-allowed}
        .save-btn{width:100%;background:#059669;color:white;border:none;border-radius:11px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px;transition:all 0.2s}
        .save-btn:hover:not(:disabled){background:#047857;transform:translateY(-1px)}
        .save-btn:disabled{opacity:0.5;cursor:not-allowed}

        /* RESULT PANEL */
        .res-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
        .res-card{border-radius:12px;padding:14px;text-align:center}
        .res-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;opacity:0.75;margin-bottom:5px}
        .res-val{font-size:22px;font-weight:800;line-height:1}
        .res-unit{font-size:11px;opacity:0.65;margin-top:4px}
        .parts-wrap{border:1px solid #f3f4f6;border-radius:12px;overflow:hidden}
        .parts-head{display:grid;grid-template-columns:1fr 80px 80px 50px 90px 90px;padding:10px 14px;background:#f9fafb;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;gap:8px;border-bottom:1px solid #f3f4f6}
        .parts-row{display:grid;grid-template-columns:1fr 80px 80px 50px 90px 90px;padding:11px 14px;border-bottom:1px solid #f9fafb;font-size:12px;gap:8px;align-items:center;transition:background 0.1s}
        .parts-row:last-child{border-bottom:none}
        .parts-row:hover{background:#fafafa}
        .parts-total{display:grid;grid-template-columns:1fr 80px 80px 50px 90px 90px;padding:11px 14px;font-size:12px;gap:8px;background:#f8f9ff;border-top:1.5px solid #e5e7eb;font-weight:700}
        .tag{font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;display:inline-block}
        .empty-result{text-align:center;padding:60px 20px;color:#9ca3af}
        .empty-icon{font-size:48px;margin-bottom:12px}

        /* HISTORY */
        .hist-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #f9fafb;cursor:pointer;transition:background 0.1s}
        .hist-item:last-child{border-bottom:none}
        .hist-item:hover{background:#fafafa}

        /* SAVED */
        .saved-banner{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:11px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-top:8px;font-size:13px;font-weight:600;color:#166534}

        /* GUEST BANNER */
        .guest-banner{background:linear-gradient(135deg,#f5f3ff,#fdf4ff);border:1.5px solid #e9d5ff;border-radius:12px;padding:14px 16px;margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .gb-text{font-size:13px;color:#6d28d9;font-weight:500;line-height:1.5}
        .gb-btn{background:#7c3aed;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.15s}
        .gb-btn:hover{background:#6d28d9}

        @media(max-width:900px){
          .calc-layout{grid-template-columns:1fr}
          .parts-head,.parts-row,.parts-total{grid-template-columns:1fr 70px 70px 40px 80px}
          .hide-md{display:none}
          .type-grid{grid-template-columns:repeat(3,1fr)}
        }
        @media(max-width:600px){
          .main{padding:16px}
          .res-summary{grid-template-columns:repeat(3,1fr)}
          .type-grid{grid-template-columns:repeat(2,1fr)}
          .parts-head,.parts-row,.parts-total{grid-template-columns:1fr 60px 60px 70px}
          .hide-sm{display:none}
        }
      `}</style>

      <div className="page">
        {/* TOP NAV */}
        <nav className="topnav">
          <div className="tn-left">
            <button className="back-btn" onClick={() => router.push('/')}>← Буцах</button>
            <span style={{ color:'#e5e7eb' }}>|</span>
            <span className="page-title">📐 Материалын тооцоолол</span>
          </div>
          <div className="tn-right">
            {user ? (
              <>
                <div className="user-chip" onClick={() => router.push('/dashboard')}>
                  <div className="uc-av">{user.first_name?.[0]}{user.last_name?.[0]}</div>
                  <div>
                    <div className="uc-name">{user.last_name} {user.first_name}</div>
                    <div className="uc-role">Хэрэглэгч</div>
                  </div>
                </div>
                <button className="dashboard-btn" onClick={() => router.push('/dashboard')}>Хяналтын самбар</button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/auth/login')} style={{ background:'none', border:'1.5px solid #e5e7eb', borderRadius:9, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'#374151' }}>
                  Нэвтрэх
                </button>
                <button onClick={() => router.push('/auth/register')} style={{ background:'#1c1917', color:'white', border:'none', borderRadius:9, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Бүртгүүлэх
                </button>
              </>
            )}
          </div>
        </nav>

        <div className="main">
          {/* ТАВИЛГЫН ТӨРӨЛ */}
          <div className="type-select-wrap">
            <div style={{ fontSize:13, fontWeight:700, color:'#1c1917', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }}>🪑</span> Тавилгын төрөл сонгоно уу
            </div>
            <div className="type-grid">
              {furnitureTypes.length === 0 && (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'32px 0', color:'#9ca3af', fontSize:14 }}>
                  Тавилгын төрөл байхгүй байна
                </div>
              )}
              {furnitureTypes.map(ft => (
                <div
                  key={ft.id}
                  className={`type-card ${selectedType?.id === ft.id ? 'selected' : ''}`}
                  onClick={() => setSelectedType(ft)}
                >
                  <div className="type-icon">🪑</div>
                  <div className="type-name">{ft.name}</div>
                  {ft.description && <div className="type-desc">{ft.description}</div>}
                </div>
              ))}
            </div>
          </div>

          {selectedType && (
            <div className="calc-layout">
              {/* ОРОЛТ */}
              <div>
                <div className="panel">
                  <div className="panel-head">
                    <span style={{ fontSize:16 }}>📏</span>
                    <span className="panel-title">{selectedType.name} — хэмжээ</span>
                  </div>
                  <div className="panel-body">
                    {fields.map(field => (
                      <div key={field.field_key} className="field">
                        <div className="field-label">
                          {field.label}
                          {field.unit && <span className="field-unit">{field.unit}</span>}
                        </div>
                        <div className="inp-row">
                          <input
                            type="number"
                            value={inputs[field.field_key] ?? ''}
                            min={Number(field.min_value)}
                            max={Number(field.max_value)}
                            placeholder={String(field.default_value)}
                            onChange={e => setInputs(prev => ({ ...prev, [field.field_key]: Number(e.target.value) }))}
                          />
                          <div className="inp-btns">
                            <button className="inp-btn" onClick={() => setInputs(p => ({ ...p, [field.field_key]: (p[field.field_key] || 0) + 1 }))}>▲</button>
                            <button className="inp-btn" onClick={() => setInputs(p => ({ ...p, [field.field_key]: Math.max(0, (p[field.field_key] || 0) - 1) }))}>▼</button>
                          </div>
                          {field.unit && <div className="inp-unit">{field.unit}</div>}
                        </div>
                      </div>
                    ))}

                    <button
                      className="calc-action-btn"
                      onClick={handleCalculate}
                      disabled={loading || fields.length === 0}
                    >
                      {loading ? '⏳ Тооцоолж байна...' : '⚡ Тооцоолол хийх'}
                    </button>

                    {result && !saved && (
                      <button className="save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? '⏳ Хадгалж байна...' : '💾 Тооцоо хадгалах'}
                      </button>
                    )}

                    {saved && (
                      <div className="saved-banner">
                        ✅ Тооцоо амжилттай хадгалагдлаа
                      </div>
                    )}

                    {!user && result && (
                      <div className="guest-banner">
                        <div className="gb-text">
                          💡 Тооцоогоо хадгалж захиалга хийхийн тулд нэвтэрнэ үү
                        </div>
                        <button className="gb-btn" onClick={() => router.push('/auth/login')}>
                          Нэвтрэх →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ХИЙСЭН ТООЦООЛЛЫН ТҮҮХ */}
                {user && history.length > 0 && (
                  <div className="panel" style={{ marginTop:16 }}>
                    <div className="panel-head">
                      <span style={{ fontSize:16 }}>🕐</span>
                      <span className="panel-title">Сүүлийн тооцоолол</span>
                    </div>
                    {history.map((h: any, i: number) => (
                      <div key={i} className="hist-item">
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#1c1917' }}>
                            {h.furniture_types?.name || 'Тавилга'}
                          </div>
                          <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                            {new Date(h.created_at).toLocaleDateString('mn-MN')}
                          </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'#d97706' }}>
                            {Number(h.total_area).toFixed(2)} м²
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ҮР ДҮН */}
              <div className="panel">
                <div className="panel-head">
                  <span style={{ fontSize:16 }}>📊</span>
                  <span className="panel-title">Тооцооны үр дүн</span>
                  {result && (
                    <span style={{ marginLeft:'auto', fontSize:11, color:'#9ca3af' }}>
                      {selectedType.name}
                    </span>
                  )}
                </div>
                <div className="panel-body">
                  {!result ? (
                    <div className="empty-result">
                      <div className="empty-icon">📐</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#1c1917', marginBottom:8 }}>
                        Тооцоолол хийгдээгүй байна
                      </div>
                      <div style={{ fontSize:13, lineHeight:1.6 }}>
                        Зүүн талд хэмжээ оруулаад<br />
                        <strong style={{ color:'#d97706' }}>⚡ Тооцоолол хийх</strong> товч дарна уу
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Summary */}
                      <div className="res-summary">
                        <div className="res-card" style={{ background:'#fef3c7' }}>
                          <div className="res-label" style={{ color:'#92400e' }}>Нийт талбай</div>
                          <div className="res-val" style={{ color:'#92400e' }}>{result.total_area.toFixed(3)}</div>
                          <div className="res-unit" style={{ color:'#6d28d9' }}>м²</div>
                        </div>
                        <div className="res-card" style={{ background:'#fff7ed' }}>
                          <div className="res-label" style={{ color:'#c2410c' }}>Хаягдалтай</div>
                          <div className="res-val" style={{ color:'#c2410c' }}>{result.total_area_real.toFixed(3)}</div>
                          <div className="res-unit" style={{ color:'#ea580c' }}>м²</div>
                        </div>
                        <div className="res-card" style={{ background:'#f0fdf4' }}>
                          <div className="res-label" style={{ color:'#166534' }}>Ирмэг наалт</div>
                          <div className="res-val" style={{ color:'#166534' }}>{result.total_edge.toFixed(2)}</div>
                          <div className="res-unit" style={{ color:'#16a34a' }}>м</div>
                        </div>
                      </div>

                      {/* Parts table */}
                      <div className="parts-wrap">
                        <div className="parts-head">
                          <div>Эд анги</div>
                          <div>Өргөн мм</div>
                          <div>Өндөр мм</div>
                          <div>Тоо</div>
                          <div>Талбай м²</div>
                          <div className="hide-md">Ирмэг м</div>
                        </div>
                        {result.parts.map((part, i) => (
                          <div key={i} className="parts-row">
                            <div style={{ fontWeight:600, color:'#1c1917' }}>{part.part_label}</div>
                            <div style={{ color:'#d97706', fontWeight:600 }}>{part.width_mm.toLocaleString()}</div>
                            <div style={{ color:'#d97706', fontWeight:600 }}>{part.height_mm.toLocaleString()}</div>
                            <div>
                              <span className="tag" style={{ background:'#fef3c7', color:'#1e40af' }}>×{part.qty}</span>
                            </div>
                            <div style={{ fontWeight:600 }}>{part.area_m2.toFixed(4)}</div>
                            <div className="hide-md" style={{ color: part.edge_length_m > 0 ? '#059669' : '#d1d5db', fontWeight: part.edge_length_m > 0 ? 600 : 400 }}>
                              {part.edge_length_m > 0 ? part.edge_length_m.toFixed(3) : '—'}
                            </div>
                          </div>
                        ))}
                        <div className="parts-total">
                          <div>Нийт</div>
                          <div></div><div></div><div></div>
                          <div style={{ color:'#d97706' }}>{result.total_area.toFixed(4)}</div>
                          <div className="hide-md" style={{ color:'#059669' }}>{result.total_edge.toFixed(3)}</div>
                        </div>
                      </div>

                      {user && saved && (
  <div style={{ marginTop: 16 }}>
    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
      Тооцооллоо хадгалсан. Одоо захиалга өгч болно.
    </div>
    {/* ЭНЭ ТОВЧИЙГ СОЛИХ */}
    <button
      onClick={() => router.push(`/checkout?calc_id=${savedCalcId}`)}
      style={{
        width: '100%',
        background: 'linear-gradient(135deg,#d97706,#b45309)',
        color: 'white', border: 'none', borderRadius: 11,
        padding: '13px', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 6px 20px rgba(217,119,6,0.3)',
      }}
    >
      ✅ Захиалга хийх →
    </button>
  </div>
)}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}