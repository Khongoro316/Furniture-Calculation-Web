'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface FurnitureType { id: number; name: string; description: string; is_active: boolean; }
interface InputField { id: number; field_key: string; label: string; unit: string; min_value: number; max_value: number; default_value: number; sort_order: number; }
interface Formula { id: number; part_key: string; part_label: string; formula_width: string; formula_height: string; formula_qty: string; formula_edge: string; has_edge: boolean; }

export default function FurnitureTypesPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [types, setTypes] = useState<FurnitureType[]>([]);
  const [selected, setSelected] = useState<FurnitureType | null>(null);
  const [fields, setFields] = useState<InputField[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [activeTab, setActiveTab] = useState<'fields'|'formulas'>('fields');
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showFormulaForm, setShowFormulaForm] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [newField, setNewField] = useState({ field_key:'', label:'', unit:'', min_value:0, max_value:9999, default_value:0, sort_order:0 });
  const [newFormula, setNewFormula] = useState({ part_key:'', part_label:'', formula_width:'', formula_height:'', formula_qty:'', formula_edge:'', has_edge:false, sort_order:0 });

  useEffect(() => {
    const u = localStorage.getItem('user'); const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t); else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role !== 'super_admin') { router.push('/dashboard'); return; }
    loadTypes();
  }, [mounted, user]);

  const loadTypes = async () => {
    const res = await api.get('/api/furniture-types').catch(() => ({ data: [] }));
    setTypes(res.data);
  };

  const loadDetails = async (type: FurnitureType) => {
    setSelected(type);
    const [f, fm] = await Promise.all([
      api.get(`/api/furniture-types/${type.id}/fields`),
      api.get(`/api/furniture-types/${type.id}/formulas`),
    ]);
    setFields(f.data); setFormulas(fm.data);
  };

  const createType = async () => {
    if (!typeName) return;
    await api.post('/api/furniture-types', { name: typeName, description: typeDesc });
    setTypeName(''); setTypeDesc(''); setShowTypeForm(false); loadTypes();
  };

  const createField = async () => {
    if (!selected || !newField.field_key) return;
    await api.post(`/api/furniture-types/${selected.id}/fields`, newField);
    setNewField({ field_key:'', label:'', unit:'', min_value:0, max_value:9999, default_value:0, sort_order:0 });
    setShowFieldForm(false); loadDetails(selected);
  };

  const createFormula = async () => {
    if (!selected || !newFormula.part_key) return;
    await api.post(`/api/furniture-types/${selected.id}/formulas`, newFormula);
    setNewFormula({ part_key:'', part_label:'', formula_width:'', formula_height:'', formula_qty:'', formula_edge:'', has_edge:false, sort_order:0 });
    setShowFormulaForm(false); loadDetails(selected);
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout title="Тавилгын төрөл"
      action={<button onClick={() => setShowTypeForm(true)} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Төрөл нэмэх</button>}>
      <style>{`
        .layout{display:grid;grid-template-columns:240px 1fr;gap:14px;align-items:start}
        .panel{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .panel-head{padding:14px 16px;border-bottom:0.5px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .panel-title{font-size:13px;font-weight:700;color:#0f172a}
        .type-item{padding:10px 16px;cursor:pointer;border-bottom:0.5px solid #f1f5f9;transition:background 0.1s}
        .type-item:last-child{border-bottom:none}
        .type-item:hover{background:#f8fafc}
        .type-item.active{background:#fef3c7;border-left:3px solid #d97706}
        .tabs{display:flex;border-bottom:0.5px solid #e2e8f0}
        .tab{flex:1;padding:10px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;color:#64748b;border:none;background:none;transition:all 0.15s;border-bottom:2px solid transparent;font-family:inherit}
        .tab.active{color:#d97706;border-bottom-color:#d97706}
        .tbl{width:100%;border-collapse:collapse}
        .tbl th{padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;background:#f8fafc;border-bottom:0.5px solid #e2e8f0}
        .tbl td{padding:10px 14px;font-size:12px;color:#374151;border-bottom:0.5px solid #f1f5f9}
        .tbl tr:last-child td{border-bottom:none}
        .tbl tr:hover td{background:#fafafa}
        .mono{font-family:monospace;color:#d97706;font-weight:600}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-height:90vh;overflow-y:auto}
        .field{margin-bottom:12px}
        .fl{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
        .fi{width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;color:#0f172a;background:white}
        .modal-btns{display:flex;gap:10px;margin-top:16px}
        .bp{flex:1;background:#d97706;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .bs{flex:1;background:white;color:#374151;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .add-sm{font-size:11px;font-weight:600;padding:5px 10px;border-radius:7px;border:0.5px solid #fde68a;background:#fef3c7;color:#4338ca;cursor:pointer;font-family:inherit}
        @media(max-width:768px){.layout{grid-template-columns:1fr}}
      `}</style>

      <div className="layout">
        {/* Зүүн — төрлүүд */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Тавилгын төрлүүд</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{types.length} төрөл</span>
          </div>
          {types.length === 0 && <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Төрөл байхгүй байна</div>}
          {types.map(t => (
            <div key={t.id} className={`type-item ${selected?.id === t.id ? 'active' : ''}`} onClick={() => { loadDetails(t); setActiveTab('fields'); }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
              {t.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.description}</div>}
            </div>
          ))}
        </div>

        {/* Баруун — талбар/томьёо */}
        <div className="panel">
          {!selected ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🪑</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Тавилгын төрөл сонгоно уу</div>
              <div style={{ fontSize: 13 }}>Зүүн талаас сонгоод оролтын талбар, томьёог харна уу</div>
            </div>
          ) : (
            <>
              <div className="panel-head">
                <span className="panel-title">{selected.name}</span>
                <button className="add-sm" onClick={() => activeTab === 'fields' ? setShowFieldForm(true) : setShowFormulaForm(true)}>
                  + {activeTab === 'fields' ? 'Талбар нэмэх' : 'Томьёо нэмэх'}
                </button>
              </div>
              <div className="tabs">
                <button className={`tab ${activeTab === 'fields' ? 'active' : ''}`} onClick={() => setActiveTab('fields')}>
                  Оролтын талбарууд ({fields.length})
                </button>
                <button className={`tab ${activeTab === 'formulas' ? 'active' : ''}`} onClick={() => setActiveTab('formulas')}>
                  Тооцооны томьёо ({formulas.length})
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {activeTab === 'fields' && (
                  <table className="tbl">
                    <thead><tr><th>field_key</th><th>Нэр</th><th>Нэгж</th><th>Min</th><th>Max</th><th>Default</th></tr></thead>
                    <tbody>
                      {fields.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>Талбар байхгүй байна</td></tr>}
                      {fields.map(f => (
                        <tr key={f.id}>
                          <td className="mono">{f.field_key}</td>
                          <td style={{ fontWeight: 500 }}>{f.label}</td>
                          <td style={{ color: '#94a3b8' }}>{f.unit || '—'}</td>
                          <td>{f.min_value}</td>
                          <td>{f.max_value}</td>
                          <td style={{ fontWeight: 600, color: '#d97706' }}>{f.default_value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {activeTab === 'formulas' && (
                  <table className="tbl">
                    <thead><tr><th>Эд анги</th><th>Өргөн</th><th>Өндөр</th><th>Тоо</th><th>Ирмэг</th></tr></thead>
                    <tbody>
                      {formulas.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>Томьёо байхгүй байна</td></tr>}
                      {formulas.map(f => (
                        <tr key={f.id}>
                          <td style={{ fontWeight: 600 }}>{f.part_label}</td>
                          <td className="mono">{f.formula_width}</td>
                          <td className="mono">{f.formula_height}</td>
                          <td className="mono">{f.formula_qty}</td>
                          <td className="mono" style={{ color: f.formula_edge ? '#059669' : '#94a3b8' }}>{f.formula_edge || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Тавилгын төрөл нэмэх modal */}
      {showTypeForm && (
        <div className="modal-bg" onClick={() => setShowTypeForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Шинэ тавилгын төрөл</div>
            <div className="field"><label className="fl">Нэр *</label><input className="fi" placeholder="Шкаф" value={typeName} onChange={e => setTypeName(e.target.value)} /></div>
            <div className="field"><label className="fl">Тайлбар</label><input className="fi" placeholder="..." value={typeDesc} onChange={e => setTypeDesc(e.target.value)} /></div>
            <div className="modal-btns">
              <button className="bp" onClick={createType}>Хадгалах</button>
              <button className="bs" onClick={() => setShowTypeForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}

      {/* Талбар нэмэх modal */}
      {showFieldForm && (
        <div className="modal-bg" onClick={() => setShowFieldForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Оролтын талбар нэмэх</div>
            {[
              { key: 'field_key', label: 'field_key * (жишээ: width)', type: 'text' },
              { key: 'label', label: 'Нэр * (жишээ: Өргөн)', type: 'text' },
              { key: 'unit', label: 'Нэгж (мм, ш, %)', type: 'text' },
            ].map(f => (
              <div key={f.key} className="field">
                <label className="fl">{f.label}</label>
                <input className="fi" type={f.type} value={(newField as any)[f.key]} onChange={e => setNewField(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { key: 'min_value', label: 'Min' },
                { key: 'max_value', label: 'Max' },
                { key: 'default_value', label: 'Default' },
              ].map(f => (
                <div key={f.key} className="field">
                  <label className="fl">{f.label}</label>
                  <input className="fi" type="number" value={(newField as any)[f.key]} onChange={e => setNewField(p => ({ ...p, [f.key]: Number(e.target.value) }))} />
                </div>
              ))}
            </div>
            <div className="modal-btns">
              <button className="bp" onClick={createField}>Хадгалах</button>
              <button className="bs" onClick={() => setShowFieldForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}

      {/* Томьёо нэмэх modal */}
      {showFormulaForm && (
        <div className="modal-bg" onClick={() => setShowFormulaForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Томьёо нэмэх</div>
            {[
              { key: 'part_key', label: 'part_key * (жишээ: side_panel)' },
              { key: 'part_label', label: 'Нэр * (жишээ: Хажуу хавтан)' },
              { key: 'formula_width', label: 'Өргөний томьёо (жишээ: height)' },
              { key: 'formula_height', label: 'Өндрийн томьёо (жишээ: depth)' },
              { key: 'formula_qty', label: 'Тооны томьёо (жишээ: 2)' },
              { key: 'formula_edge', label: 'Ирмэгийн томьёо (жишээ: 2*height/1000)' },
            ].map(f => (
              <div key={f.key} className="field">
                <label className="fl">{f.label}</label>
                <input className="fi" value={(newFormula as any)[f.key]} onChange={e => setNewFormula(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={newFormula.has_edge} onChange={e => setNewFormula(p => ({ ...p, has_edge: e.target.checked }))} />
              Ирмэг наалттай
            </label>
            <div className="modal-btns">
              <button className="bp" onClick={createFormula}>Хадгалах</button>
              <button className="bs" onClick={() => setShowFormulaForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
