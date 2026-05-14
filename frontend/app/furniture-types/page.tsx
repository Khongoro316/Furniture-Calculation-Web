'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface FurnitureType { id: number; name: string; description: string; is_active: boolean; }
interface InputField {
  id: number; field_key: string; label: string; unit: string;
  min_value: number; max_value: number; default_value: number; sort_order: number;
}
interface Formula {
  id: number; part_key: string; part_label: string;
  formula_width: string; formula_height: string;
  formula_qty: string; formula_edge: string; has_edge: boolean; sort_order: number;
}

// ── Томьёоны тайлбар helper ──────────────────────────────────────────────────
const FORMULA_EXAMPLES = {
  // Шүүгээ
  wardrobe: {
    fields: [
      { field_key: 'W', label: 'Нийт өргөн', unit: 'мм', default_value: 1200, min_value: 600, max_value: 3000 },
      { field_key: 'H', label: 'Нийт өндөр', unit: 'мм', default_value: 2100, min_value: 1200, max_value: 2700 },
      { field_key: 'D', label: 'Гүн', unit: 'мм', default_value: 600, min_value: 300, max_value: 900 },
      { field_key: 'shelf_count', label: 'Тавиурын тоо', unit: 'ш', default_value: 3, min_value: 1, max_value: 10 },
    ],
    formulas: [
      { part_key: 'top',    part_label: 'Дээд тавцан',   formula_width: 'W',   formula_height: 'D',       formula_qty: '1', formula_edge: '2*(W+D)/1000', has_edge: true },
      { part_key: 'bottom', part_label: 'Доод тавцан',   formula_width: 'W',   formula_height: 'D',       formula_qty: '1', formula_edge: '2*(W+D)/1000', has_edge: true },
      { part_key: 'left',   part_label: 'Зүүн хавтан',   formula_width: 'H-36',formula_height: 'D',       formula_qty: '1', formula_edge: '2*H/1000',     has_edge: true },
      { part_key: 'right',  part_label: 'Баруун хавтан', formula_width: 'H-36',formula_height: 'D',       formula_qty: '1', formula_edge: '2*H/1000',     has_edge: true },
      { part_key: 'shelf',  part_label: 'Тавиур',         formula_width: 'W-36',formula_height: 'D-20',   formula_qty: 'shelf_count', formula_edge: '(W-36)/1000*shelf_count', has_edge: true },
      { part_key: 'back',   part_label: 'Арын хавтан',   formula_width: 'W',   formula_height: 'H',       formula_qty: '1', formula_edge: '0', has_edge: false },
    ],
  },
};

// Томьёоны тайлбар
const FormulaHelp = ({ fields }: { fields: InputField[] }) => {
  const vars = fields.map(f => f.field_key);
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 10 }}>📐 Томьёо бичих заавар</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { ex: 'W', desc: 'Оролтын талбарын утга' },
          { ex: 'W - 36', desc: 'Хасах (хавтангийн зузааны хоёр дахин)' },
          { ex: 'W / 2', desc: 'Хуваах (2 хэсэгт хуваах)' },
          { ex: 'W * 2', desc: 'Үржүүлэх' },
          { ex: '2 * (W + H) / 1000', desc: 'Ирмэг (м-ээр)' },
          { ex: 'shelf_count + 1', desc: 'Тоог нэмэх' },
        ].map(e => (
          <div key={e.ex} style={{ fontSize: 11 }}>
            <code style={{ background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>{e.ex}</code>
            <span style={{ color: '#64748b', marginLeft: 5 }}>{e.desc}</span>
          </div>
        ))}
      </div>
      {vars.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Бүртгэлтэй хувьсагчид:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {vars.map(v => (
              <code key={v} style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace' }}>{v}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Томьёо preview
const FormulaPreview = ({ formula, fields }: { formula: any; fields: InputField[] }) => {
  const [vals, setVals] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const defaults: Record<string, number> = {};
    fields.forEach(f => { defaults[f.field_key] = f.default_value || 0; });
    setVals(defaults);
  }, [fields]);

  useEffect(() => {
    if (!formula.formula_width) return;
    try {
      const math = (window as any).mathjs;
      if (!math) return;
      const w = Number(math.evaluate(formula.formula_width, vals));
      const h = Number(math.evaluate(formula.formula_height, vals));
      const q = Number(math.evaluate(formula.formula_qty, vals));
      const area = (w * h * q) / 1_000_000;
      const edge = formula.has_edge && formula.formula_edge
        ? Number(math.evaluate(formula.formula_edge, vals)) : 0;
      setResult({ w: Math.round(w), h: Math.round(h), q: Math.round(q), area: area.toFixed(4), edge: edge.toFixed(3) });
    } catch { setResult(null); }
  }, [vals, formula]);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Урьдчилан харах (default утгаар):</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        {fields.map(f => (
          <div key={f.field_key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 10, color: '#94a3b8' }}>{f.field_key}=</label>
            <input type="number" value={vals[f.field_key] ?? f.default_value}
              onChange={e => setVals(p => ({ ...p, [f.field_key]: Number(e.target.value) }))}
              style={{ width: 56, border: '1px solid #e2e8f0', borderRadius: 5, padding: '2px 5px', fontSize: 11, fontFamily: 'monospace' }} />
          </div>
        ))}
      </div>
      {result && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', fontSize: 11, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>📏 <b>{result.w}</b> × <b>{result.h}</b> мм</span>
          <span>×<b>{result.q}</b> ш</span>
          <span>= <b style={{ color: '#059669' }}>{result.area}</b> м²</span>
          {formula.has_edge && <span>ирмэг: <b style={{ color: '#0891b2' }}>{result.edge}</b> м</span>}
        </div>
      )}
    </div>
  );
};

export default function FurnitureTypesPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [types, setTypes] = useState<FurnitureType[]>([]);
  const [selected, setSelected] = useState<FurnitureType | null>(null);
  const [fields, setFields] = useState<InputField[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [activeTab, setActiveTab] = useState<'fields' | 'formulas' | 'preview'>('fields');
  const [saving, setSaving] = useState(false);

  // Тавилгын төрөл form
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');

  // Талбар form
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editField, setEditField] = useState<InputField | null>(null);
  const [newField, setNewField] = useState({
    field_key: '', label: '', unit: 'мм', min_value: 0, max_value: 9999, default_value: 600, sort_order: 0,
  });

  // Томьёо form
  const [showFormulaForm, setShowFormulaForm] = useState(false);
  const [editFormula, setEditFormula] = useState<Formula | null>(null);
  const [newFormula, setNewFormula] = useState({
    part_key: '', part_label: '', formula_width: '', formula_height: '',
    formula_qty: '1', formula_edge: '', has_edge: false, sort_order: 0,
  });

  // Preview тооцоолол
  const [previewInputs, setPreviewInputs] = useState<Record<string, number>>({});
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Загвар ашиглах
  const [showTemplate, setShowTemplate] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    else { router.push('/auth/login'); return; }
    setMounted(true);
    // mathjs load
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.0/math.min.js';
    s.onload = () => { (window as any).mathjs = (window as any).math; };
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role !== 'super_admin') { router.push('/dashboard'); return; }
    loadTypes();
  }, [mounted, user]);

  useEffect(() => {
    if (selected && activeTab === 'preview') {
      const defaults: Record<string, number> = {};
      fields.forEach(f => { defaults[f.field_key] = f.default_value || 0; });
      setPreviewInputs(defaults);
      setPreviewResult(null);
    }
  }, [activeTab, fields]);

  const loadTypes = async () => {
    const res = await api.get('/api/furniture-types').catch(() => ({ data: [] }));
    setTypes(res.data);
  };
const deleteType = async (e: React.MouseEvent, type: FurnitureType) => {
  e.stopPropagation();
  if (!confirm(`"${type.name}" тавилгын төрлийг устгах уу?\n\nХолбогдох талбар, томьёо бүгд устгагдана.`)) return;
  try {
    const res = await api.delete(`/api/furniture-types/${type.id}`);
    if (selected?.id === type.id) setSelected(null);
    loadTypes();
    if (res.data.deactivated) {
      alert('Тооцоололтой холбоотой тул устгахын оронд идэвхгүй болголоо.');
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Устгахад алдаа гарлаа');
  }
};
  
  const loadDetails = async (type: FurnitureType) => {
    setSelected(type);
    setActiveTab('fields');
    setPreviewResult(null);
    const [f, fm] = await Promise.all([
      api.get(`/api/furniture-types/${type.id}/fields`),
      api.get(`/api/furniture-types/${type.id}/formulas`),
    ]);
    setFields(f.data);
    setFormulas(fm.data);
  };

  const createType = async () => {
    if (!typeName) return;
    setSaving(true);
    await api.post('/api/furniture-types', { name: typeName, description: typeDesc });
    setTypeName(''); setTypeDesc(''); setShowTypeForm(false);
    loadTypes();
    setSaving(false);
  };

  const createField = async () => {
    if (!selected || !newField.field_key || !newField.label) {
      alert('field_key болон нэрийг бөглөнө үү'); return;
    }
    setSaving(true);
    try {
      await api.post(`/api/furniture-types/${selected.id}/fields`, newField);
      setNewField({ field_key: '', label: '', unit: 'мм', min_value: 0, max_value: 9999, default_value: 600, sort_order: fields.length });
      setShowFieldForm(false);
      loadDetails(selected);
    } catch (err: any) { alert(err.response?.data?.message || 'Алдаа гарлаа'); }
    finally { setSaving(false); }
  };

  const deleteField = async (id: number) => {
    if (!selected || !confirm('Энэ талбарыг устгах уу?')) return;
    await api.delete(`/api/furniture-types/${selected.id}/fields/${id}`).catch(() => {});
    loadDetails(selected);
  };

  const createFormula = async () => {
    if (!selected || !newFormula.part_key || !newFormula.part_label || !newFormula.formula_width) {
      alert('Бүх шаардлагатай талбарыг бөглөнө үү'); return;
    }
    setSaving(true);
    try {
      await api.post(`/api/furniture-types/${selected.id}/formulas`, newFormula);
      setNewFormula({ part_key: '', part_label: '', formula_width: '', formula_height: '', formula_qty: '1', formula_edge: '', has_edge: false, sort_order: formulas.length });
      setShowFormulaForm(false);
      loadDetails(selected);
    } catch (err: any) { alert(err.response?.data?.message || 'Алдаа гарлаа'); }
    finally { setSaving(false); }
  };

  const deleteFormula = async (id: number) => {
    if (!selected || !confirm('Энэ томьёог устгах уу?')) return;
    await api.delete(`/api/furniture-types/${selected.id}/formulas/${id}`).catch(() => {});
    loadDetails(selected);
  };

  // Preview тооцоолол
  const runPreview = async () => {
    if (!selected) return;
    setPreviewLoading(true);
    try {
      const res = await api.post('/api/calculations', {
        furniture_type_id: selected.id,
        inputs: previewInputs,
        save: false,
      });
      setPreviewResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Тооцооны алдаа гарлаа');
    } finally { setPreviewLoading(false); }
  };

  // Загвараас нэмэх
  const applyTemplate = async (tpl: typeof FORMULA_EXAMPLES.wardrobe) => {
    if (!selected) return;
    setSaving(true);
    try {
      for (const f of tpl.fields) {
        await api.post(`/api/furniture-types/${selected.id}/fields`, f).catch(() => {});
      }
      for (const f of tpl.formulas) {
        await api.post(`/api/furniture-types/${selected.id}/formulas`, f).catch(() => {});
      }
      setShowTemplate(false);
      loadDetails(selected);
    } finally { setSaving(false); }
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout
      title="Тавилгын төрөл & Тооцооны томьёо"
      action={
        <button
          onClick={() => setShowTypeForm(true)}
          style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Тавилга нэмэх
        </button>
      }
    >
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .layout{display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:start}
        /* Type list */
        .type-list{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
        .tl-head{padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:800;color:#0f172a}
        .type-item{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid #f8fafc;cursor:pointer;transition:all 0.15s}
        .type-item:hover{background:#f8fafc}
        .type-item.on{background:#fef3c7;border-left:3px solid #d97706}
        .type-icon{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
        .type-name{font-size:13px;font-weight:700;color:#0f172a}
        .type-desc{font-size:11px;color:#94a3b8;margin-top:1px}
        .type-badge{margin-left:auto;font-size:10px;fontWeight:700;padding:2px 7px;border-radius:100px}
        /* Detail */
        .detail{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
        .det-head{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:12px}
        .det-title{font-size:15px;font-weight:800;color:#0f172a}
        .tabs{display:flex;border-bottom:1px solid #f1f5f9}
        .tab{flex:1;padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border:none;background:none;font-family:inherit;border-bottom:2px solid transparent;transition:all 0.15s}
        .tab.on{color:#d97706;border-bottom-color:#d97706}
        .tbl{width:100%;border-collapse:collapse}
        .tbl th{padding:9px 14px;background:#f8fafc;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;text-align:left;border-bottom:1px solid #f1f5f9}
        .tbl td{padding:11px 14px;border-bottom:1px solid #f8fafc;font-size:12px;color:#374151;vertical-align:top}
        .tbl tr:last-child td{border-bottom:none}
        .tbl tr:hover td{background:#fafafa}
        .mono{font-family:monospace;font-size:11px;color:#d97706;background:#fef3c7;padding:2px 6px;border-radius:4px}
        .formula-code{font-family:monospace;font-size:11px;color:#1d4ed8;background:#dbeafe;padding:2px 6px;border-radius:4px;white-space:nowrap}
        .del-btn{font-size:11px;color:#ef4444;border:1px solid #fecaca;background:white;border-radius:6px;padding:3px 8px;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .del-btn:hover{background:#fef2f2}
        /* Modal */
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:20px;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.2);display:flex;flex-direction:column}
        .modal-head{padding:16px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2}
        .modal-title{font-size:15px;font-weight:800;color:#0f172a}
        .mclose{width:28px;height:28px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:16px;color:#64748b;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .modal-body{padding:20px 22px}
        .modal-foot{display:flex;gap:10px;padding:14px 22px;border-top:1px solid #f1f5f9;background:white;position:sticky;bottom:0}
        .btn-save{flex:1;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:11px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-save:disabled{opacity:0.55;cursor:not-allowed}
        .btn-cancel{background:#f1f5f9;color:#374151;border:none;border-radius:11px;padding:12px 18px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
        .field{margin-bottom:12px}
        .fl{font-size:11px;font-weight:700;color:#374151;display:block;margin-bottom:5px}
        .req{color:#ef4444;margin-left:2px}
        .fi{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 13px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;transition:border-color 0.15s;background:white}
        .fi:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.08)}
        .frow2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .frow3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .fi-mono{font-family:monospace;background:#f8fafc}
        .sec-div{font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:8px;border-bottom:1px solid #f1f5f9;margin:16px 0 12px}
        .sec-div:first-child{margin-top:0}
        /* Preview */
        .prev-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:10px}
        .prev-part{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;background:white;border:1px solid #f1f5f9;margin-bottom:6px;font-size:12px}
        .prev-part:last-child{margin-bottom:0}
        .tpl-card{border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 16px;cursor:pointer;transition:all 0.15s;margin-bottom:8px}
        .tpl-card:hover{border-color:#d97706;background:#fffbf5}
        @media(max-width:900px){.layout{grid-template-columns:1fr}}
      `}</style>

      <div className="layout">
        {/* ── ЗҮҮН: Тавилгын төрлийн жагсаалт ── */}
        <div>
          <div className="type-list">
            <div className="tl-head">🪑 Тавилгын төрлүүд ({types.length})</div>
            {types.map(t => (
  <div key={t.id}
    className={`type-item ${selected?.id === t.id ? 'on' : ''}`}
    onClick={() => loadDetails(t)}
  >
    <div className="type-icon">🪑</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="type-name">{t.name}</div>
      {t.description && <div className="type-desc">{t.description}</div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span
        className="type-badge"
        style={{
          background: t.is_active ? '#dcfce7' : '#fee2e2',
          color: t.is_active ? '#166534' : '#991b1b'
        }}
      >
        {t.is_active ? '●' : '○'}
      </span>
      <button
        onClick={(e) => deleteType(e, t)}
        title="Устгах"
        style={{
          width: 22, height: 22,
          borderRadius: 5,
          border: '1px solid #fecaca',
          background: 'white',
          color: '#ef4444',
          cursor: 'pointer',
          fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          flexShrink: 0,
          lineHeight: 1,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
      >
        ×
      </button>
    </div>
  </div>
))}
          </div>

          {/* Загвар */}
          <div style={{ marginTop: 12, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>💡 Загвар ашиглах</div>
            <div style={{ fontSize: 11, color: '#92400e', lineHeight: 1.6, marginBottom: 8 }}>
              Шүүгээний жишиг талбар болон томьёог нэг дороос нэмэх боломжтой.
            </div>
            <button
              onClick={() => setShowTemplate(true)}
              disabled={!selected}
              style={{ width: '100%', background: selected ? '#d97706' : '#e5e7eb', color: selected ? 'white' : '#9ca3af', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >
              📋 Загвар ашиглах
            </button>
          </div>
        </div>

        {/* ── БАРУУН: Дэлгэрэнгүй ── */}
        <div>
          {!selected ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🪑</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Тавилгын төрөл сонгоно уу</div>
              <div style={{ fontSize: 12 }}>Зүүн талаас тавилгын төрөл сонгоход дэлгэрэнгүй мэдээлэл гарна</div>
            </div>
          ) : (
            <div className="detail">
              <div className="det-head">
                <div className="type-icon" style={{ width: 36, height: 36 }}>🪑</div>
                <div>
                  <div className="det-title">{selected.name}</div>
                  {selected.description && <div style={{ fontSize: 12, color: '#94a3b8' }}>{selected.description}</div>}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setShowFieldForm(true); }}
                    style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, padding: '7px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    + Талбар
                  </button>
                  <button
                    onClick={() => { setShowFormulaForm(true); }}
                    style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 8, padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    + Томьёо
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                {[
                  { k: 'fields',   label: `📥 Оролтын талбарууд (${fields.length})` },
                  { k: 'formulas', label: `📐 Тооцооны томьёо (${formulas.length})` },
                  { k: 'preview',  label: '▶️ Урьдчилан тооцоолох' },
                ].map(t => (
                  <button key={t.k} className={`tab ${activeTab === t.k ? 'on' : ''}`} onClick={() => setActiveTab(t.k as any)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── FIELDS TAB ── */}
              {activeTab === 'fields' && (
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#075985' }}>
                    💡 Оролтын талбар нь хэрэглэгч тооцоолол хийхдээ оруулах утгуудыг тодорхойлно.
                    Жишээ: <code style={{ background: '#e0f2fe', padding: '1px 5px', borderRadius: 3 }}>W</code> = Өргөн (мм),
                    <code style={{ background: '#e0f2fe', padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>H</code> = Өндөр (мм)
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Хувьсагч</th>
                        <th>Нэр (хэрэглэгчид харагдах)</th>
                        <th>Нэгж</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Default</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                          Талбар байхгүй. "+ Талбар" дарж нэмнэ үү.
                        </td></tr>
                      )}
                      {fields.map(f => (
                        <tr key={f.id}>
                          <td><span className="mono">{f.field_key}</span></td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{f.label}</td>
                          <td style={{ color: '#64748b' }}>{f.unit || '—'}</td>
                          <td style={{ color: '#94a3b8' }}>{f.min_value}</td>
                          <td style={{ color: '#94a3b8' }}>{f.max_value}</td>
                          <td style={{ fontWeight: 700, color: '#d97706' }}>{f.default_value}</td>
                          <td>
                            <button className="del-btn" onClick={() => deleteField(f.id)}>устгах</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── FORMULAS TAB ── */}
              {activeTab === 'formulas' && (
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#166534' }}>
                    💡 Томьёо нь тооцооллын үр дүнд гарч ирэх хавтан бүрийг тодорхойлно.
                    Хувьсагчид нь дээр бүртгэсэн <b>field_key</b>-тэй тохирох ёстой.
                  </div>
                  {fields.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Ашиглаж болох хувьсагчид:</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {fields.map(f => (
                          <div key={f.field_key} style={{ background: '#dbeafe', borderRadius: 6, padding: '3px 10px', fontSize: 11 }}>
                            <code style={{ fontFamily: 'monospace', color: '#1d4ed8', fontWeight: 700 }}>{f.field_key}</code>
                            <span style={{ color: '#64748b', marginLeft: 4 }}>= {f.label} ({f.unit})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Эд анги</th>
                        <th>Өргөн томьёо</th>
                        <th>Өндөр томьёо</th>
                        <th>Тоо томьёо</th>
                        <th>Ирмэг томьёо</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulas.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                          Томьёо байхгүй. "+ Томьёо" дарж нэмнэ үү.
                        </td></tr>
                      )}
                      {formulas.map(f => (
                        <tr key={f.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{f.part_label}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{f.part_key}</div>
                          </td>
                          <td><span className="formula-code">{f.formula_width}</span></td>
                          <td><span className="formula-code">{f.formula_height}</span></td>
                          <td><span className="formula-code">{f.formula_qty}</span></td>
                          <td>
                            {f.has_edge && f.formula_edge
                              ? <span className="formula-code" style={{ background: '#dcfce7', color: '#166534' }}>{f.formula_edge}</span>
                              : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                          </td>
                          <td>
                            <button className="del-btn" onClick={() => deleteFormula(f.id)}>устгах</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── PREVIEW TAB ── */}
              {activeTab === 'preview' && (
                <div style={{ padding: '16px 20px' }}>
                  {fields.length === 0 || formulas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
                      <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                        {fields.length === 0 ? 'Эхлээд оролтын талбар нэмнэ үү' : 'Тооцооны томьёо нэмнэ үү'}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Тест утгуудыг оруулна уу:</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                          {fields.map(f => (
                            <div key={f.field_key}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                                <code style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 11 }}>{f.field_key}</code>
                                {' '}{f.label} ({f.unit})
                              </label>
                              <input
                                type="number"
                                value={previewInputs[f.field_key] ?? f.default_value}
                                onChange={e => setPreviewInputs(p => ({ ...p, [f.field_key]: Number(e.target.value) }))}
                                min={f.min_value}
                                max={f.max_value}
                                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', outline: 'none', background: 'white' }}
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={runPreview}
                          disabled={previewLoading}
                          style={{ marginTop: 14, background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
                        >
                          {previewLoading ? '⏳ Тооцоолж байна...' : '▶️ Тооцоолох'}
                        </button>
                      </div>

                      {previewResult && (
                        <div style={{ animation: 'fadeUp 0.3s ease' }}>
                          {/* Нийт үр дүн */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                            {[
                              { label: 'Нийт талбай', val: `${Number(previewResult.total_area).toFixed(4)} м²`, color: '#d97706', bg: '#fef3c7' },
                              { label: 'Хаягдалтай (+10%)', val: `${Number(previewResult.total_area_real).toFixed(4)} м²`, color: '#dc2626', bg: '#fee2e2' },
                              { label: 'Нийт ирмэг', val: `${Number(previewResult.total_edge).toFixed(3)} м`, color: '#059669', bg: '#dcfce7' },
                            ].map(s => (
                              <div key={s.label} style={{ background: s.bg, borderRadius: 11, padding: '12px 14px', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: s.color, opacity: 0.75, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                              </div>
                            ))}
                          </div>

                          {/* Хавтангийн жагсаалт */}
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                            🪵 Хавтангийн жагсаалт ({previewResult.parts?.length} ширхэг)
                          </div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                            <table className="tbl" style={{ margin: 0 }}>
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
                                {previewResult.parts?.map((p: any, i: number) => (
                                  <tr key={i}>
                                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.part_label}</td>
                                    <td style={{ fontFamily: 'monospace', color: '#d97706', fontWeight: 700 }}>{p.width_mm.toLocaleString()}</td>
                                    <td style={{ fontFamily: 'monospace', color: '#d97706', fontWeight: 700 }}>{p.height_mm.toLocaleString()}</td>
                                    <td>
                                      <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>×{p.qty}</span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{p.area_m2.toFixed(4)}</td>
                                    <td style={{ fontWeight: 600, color: p.edge_length_m > 0 ? '#059669' : '#d1d5db' }}>
                                      {p.edge_length_m > 0 ? p.edge_length_m.toFixed(3) : '—'}
                                    </td>
                                  </tr>
                                ))}
                                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                                  <td>Нийт</td>
                                  <td></td><td></td><td></td>
                                  <td style={{ color: '#d97706' }}>{Number(previewResult.total_area).toFixed(4)}</td>
                                  <td style={{ color: '#059669' }}>{Number(previewResult.total_edge).toFixed(3)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Захиалга үүсгэх хэсэг */}
                          <div style={{ background: 'linear-gradient(135deg,#1c1917,#292524)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 4 }}>Энэ тооцооллоор захиалга хийх үү?</div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                                Нийт {previewResult.parts?.length} хавтан · {Number(previewResult.total_area_real).toFixed(3)} м² (хаягдалтай)
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/checkout?calc_id=preview&type=${selected.id}`)}
                              style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 11, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, boxShadow: '0 4px 14px rgba(217,119,6,0.4)', whiteSpace: 'nowrap' }}
                            >
                              🛒 Захиалга хийх →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ ТАВИЛГЫН ТӨРӨЛ НЭМЭХ MODAL ══ */}
      {showTypeForm && (
        <div className="modal-bg" onClick={() => setShowTypeForm(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">🪑 Шинэ тавилгын төрөл</div>
              <button className="mclose" onClick={() => setShowTypeForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="fl">Нэр <span className="req">*</span></label>
                <input className="fi" placeholder="Жишээ: Шүүгээ, Ширээ, Тавиур..." value={typeName} onChange={e => setTypeName(e.target.value)} />
              </div>
              <div className="field">
                <label className="fl">Тайлбар</label>
                <input className="fi" placeholder="Товч тайлбар..." value={typeDesc} onChange={e => setTypeDesc(e.target.value)} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-cancel" onClick={() => setShowTypeForm(false)}>Болих</button>
              <button className="btn-save" onClick={createType} disabled={saving || !typeName}>
                {saving ? '⏳...' : '✅ Нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ТАЛБАР НЭМЭХ MODAL ══ */}
      {showFieldForm && (
        <div className="modal-bg" onClick={() => setShowFieldForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">📥 Оролтын талбар нэмэх</div>
              <button className="mclose" onClick={() => setShowFieldForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#075985' }}>
                💡 <b>field_key</b> нь томьёонд ашиглах хувьсагчийн нэр. Жишээ: <code style={{ fontFamily: 'monospace' }}>W</code>, <code style={{ fontFamily: 'monospace' }}>H</code>, <code style={{ fontFamily: 'monospace' }}>D</code>
              </div>
              <div className="frow2">
                <div className="field">
                  <label className="fl">field_key (хувьсагч) <span className="req">*</span></label>
                  <input className="fi fi-mono" placeholder="W, H, D, shelf_count..." value={newField.field_key}
                    onChange={e => setNewField(p => ({ ...p, field_key: e.target.value.toUpperCase().replace(/\s/g, '_') }))} />
                </div>
                <div className="field">
                  <label className="fl">Нэр (хэрэглэгчид харагдах) <span className="req">*</span></label>
                  <input className="fi" placeholder="Нийт өргөн, Өндөр..." value={newField.label}
                    onChange={e => setNewField(p => ({ ...p, label: e.target.value }))} />
                </div>
              </div>
              <div className="frow3">
                <div className="field">
                  <label className="fl">Нэгж</label>
                  <input className="fi" placeholder="мм, см, ш..." value={newField.unit}
                    onChange={e => setNewField(p => ({ ...p, unit: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="fl">Хамгийн бага</label>
                  <input className="fi" type="number" value={newField.min_value}
                    onChange={e => setNewField(p => ({ ...p, min_value: Number(e.target.value) }))} />
                </div>
                <div className="field">
                  <label className="fl">Хамгийн их</label>
                  <input className="fi" type="number" value={newField.max_value}
                    onChange={e => setNewField(p => ({ ...p, max_value: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="frow2">
                <div className="field">
                  <label className="fl">Default утга</label>
                  <input className="fi" type="number" value={newField.default_value}
                    onChange={e => setNewField(p => ({ ...p, default_value: Number(e.target.value) }))} />
                </div>
                <div className="field">
                  <label className="fl">Дараалал</label>
                  <input className="fi" type="number" value={newField.sort_order}
                    onChange={e => setNewField(p => ({ ...p, sort_order: Number(e.target.value) }))} />
                </div>
              </div>
              {/* Жишиг утгууд */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Түгээмэл талбарууд:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { k: 'W', l: 'Өргөн', u: 'мм', d: 1200 },
                    { k: 'H', l: 'Өндөр', u: 'мм', d: 2100 },
                    { k: 'D', l: 'Гүн', u: 'мм', d: 600 },
                    { k: 'shelf_count', l: 'Тавиурын тоо', u: 'ш', d: 3 },
                    { k: 'door_count',  l: 'Хаалганы тоо', u: 'ш', d: 2 },
                  ].map(s => (
                    <button key={s.k}
                      onClick={() => setNewField(p => ({ ...p, field_key: s.k, label: s.l, unit: s.u, default_value: s.d }))}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
                      {s.k}: {s.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-cancel" onClick={() => setShowFieldForm(false)}>Болих</button>
              <button className="btn-save" onClick={createField} disabled={saving || !newField.field_key}>
                {saving ? '⏳...' : '+ Талбар нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ТОМЬЁО НЭМЭХ MODAL ══ */}
      {showFormulaForm && (
        <div className="modal-bg" onClick={() => setShowFormulaForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">📐 Тооцооны томьёо нэмэх</div>
              <button className="mclose" onClick={() => setShowFormulaForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <FormulaHelp fields={fields} />

              <div className="sec-div">Хавтангийн мэдээлэл</div>
              <div className="frow2">
                <div className="field">
                  <label className="fl">part_key (код) <span className="req">*</span></label>
                  <input className="fi fi-mono" placeholder="top_panel, left_side..." value={newFormula.part_key}
                    onChange={e => setNewFormula(p => ({ ...p, part_key: e.target.value.toLowerCase().replace(/\s/g, '_') }))} />
                </div>
                <div className="field">
                  <label className="fl">Эд ангийн нэр <span className="req">*</span></label>
                  <input className="fi" placeholder="Дээд тавцан, Хажуу хавтан..." value={newFormula.part_label}
                    onChange={e => setNewFormula(p => ({ ...p, part_label: e.target.value }))} />
                </div>
              </div>

              <div className="sec-div">Томьёонууд</div>
              <div className="frow2">
                <div className="field">
                  <label className="fl">Өргөний томьёо (мм) <span className="req">*</span></label>
                  <input className="fi fi-mono" placeholder="W - 36" value={newFormula.formula_width}
                    onChange={e => setNewFormula(p => ({ ...p, formula_width: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="fl">Өндрийн томьёо (мм) <span className="req">*</span></label>
                  <input className="fi fi-mono" placeholder="H - 36" value={newFormula.formula_height}
                    onChange={e => setNewFormula(p => ({ ...p, formula_height: e.target.value }))} />
                </div>
              </div>
              <div className="frow2">
                <div className="field">
                  <label className="fl">Тооны томьёо <span className="req">*</span></label>
                  <input className="fi fi-mono" placeholder="1, 2, shelf_count..." value={newFormula.formula_qty}
                    onChange={e => setNewFormula(p => ({ ...p, formula_qty: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="fl">Дараалал</label>
                  <input className="fi" type="number" value={newFormula.sort_order}
                    onChange={e => setNewFormula(p => ({ ...p, sort_order: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="sec-div">Ирмэг наалт</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}
                onClick={() => setNewFormula(p => ({ ...p, has_edge: !p.has_edge }))}>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${newFormula.has_edge ? '#d97706' : '#e2e8f0'}`, background: newFormula.has_edge ? '#d97706' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', transition: 'all 0.15s' }}>
                  {newFormula.has_edge ? '✓' : ''}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: newFormula.has_edge ? '#d97706' : '#374151' }}>
                  Ирмэг наалт тооцоолох
                </span>
              </div>
              {newFormula.has_edge && (
                <div className="field">
                  <label className="fl">Ирмэгийн томьёо (м-ээр)</label>
                  <input className="fi fi-mono" placeholder="2 * (W + H) / 1000" value={newFormula.formula_edge}
                    onChange={e => setNewFormula(p => ({ ...p, formula_edge: e.target.value }))} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    ⚠️ Үр дүн метрээр гарах ёстой тул 1000-д хуваана
                  </div>
                </div>
              )}

              {/* Жишиг товчнууд */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Түгээмэл хэсгүүд:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { key: 'top',     label: 'Дээд тавцан',   w: 'W',      h: 'D',      q: '1', e: '2*(W+D)/1000',   he: true },
                    { key: 'bottom',  label: 'Доод тавцан',   w: 'W',      h: 'D',      q: '1', e: '2*(W+D)/1000',   he: true },
                    { key: 'left',    label: 'Зүүн хавтан',   w: 'H-36',   h: 'D',      q: '1', e: '2*(H-36)/1000',  he: true },
                    { key: 'right',   label: 'Баруун хавтан', w: 'H-36',   h: 'D',      q: '1', e: '2*(H-36)/1000',  he: true },
                    { key: 'shelf',   label: 'Тавиур',         w: 'W-36',   h: 'D-20',   q: 'shelf_count', e: '(W-36)/1000*shelf_count', he: true },
                    { key: 'back',    label: 'Арын хавтан',   w: 'W',      h: 'H',      q: '1', e: '0',              he: false },
                  ].map(s => (
                    <button key={s.key}
                      onClick={() => setNewFormula(p => ({ ...p, part_key: s.key, part_label: s.label, formula_width: s.w, formula_height: s.h, formula_qty: s.q, formula_edge: s.e, has_edge: s.he }))}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {newFormula.formula_width && fields.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <FormulaPreview formula={newFormula} fields={fields} />
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-cancel" onClick={() => setShowFormulaForm(false)}>Болих</button>
              <button className="btn-save" onClick={createFormula} disabled={saving || !newFormula.part_key || !newFormula.formula_width}>
                {saving ? '⏳...' : '+ Томьёо нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ЗАГВАР MODAL ══ */}
      {showTemplate && selected && (
        <div className="modal-bg" onClick={() => setShowTemplate(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">📋 Загвар ашиглах — {selected.name}</div>
              <button className="mclose" onClick={() => setShowTemplate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e' }}>
                ⚠️ Загвар нэмэхэд тухайн тавилгын одоогийн талбар болон томьёонд <b>нэмэгдэнэ</b>. Давхар нэмэгдэж болзошгүй тул анхаарна уу.
              </div>

              <div className="tpl-card" onClick={() => applyTemplate(FORMULA_EXAMPLES.wardrobe)}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>🗄️ Шүүгээний загвар</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 10 }}>
                  4 оролтын талбар (W, H, D, shelf_count) + 6 хавтан томьёо
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Дээд тавцан', 'Доод тавцан', 'Зүүн хавтан', 'Баруун хавтан', 'Тавиур', 'Арын хавтан'].map(l => (
                    <span key={l} style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, color: '#374151' }}>{l}</span>
                  ))}
                </div>
                <div style={{ marginTop: 12, background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', borderRadius: 8, padding: '8px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
                  {saving ? '⏳ Нэмж байна...' : '✅ Энэ загварыг нэмэх'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}