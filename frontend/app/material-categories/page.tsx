'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface Category { id: number; name: string; description: string; material_types: MaterialType[]; }
interface MaterialType { id: number; name: string; description: string; }

export default function MaterialCategoriesPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('user'); const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t); else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role !== 'super_admin') { router.push('/dashboard'); return; }
    loadCategories();
  }, [mounted, user]);

  const loadCategories = async () => {
    const res = await api.get('/api/materials/categories').catch(() => ({ data: [] }));
    setCategories(res.data);
    if (selected) {
      const updated = res.data.find((c: Category) => c.id === selected.id);
      if (updated) setSelected(updated);
    }
  };

  const createCategory = async () => {
    if (!catName) return;
    await api.post('/api/materials/categories', { name: catName, description: catDesc });
    setCatName(''); setCatDesc(''); setShowCatForm(false); loadCategories();
  };

  const createType = async () => {
    if (!selected || !typeName) return;
    await api.post('/api/materials/types', { category_id: selected.id, name: typeName, description: typeDesc });
    setTypeName(''); setTypeDesc(''); setShowTypeForm(false); loadCategories();
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout title="Материал ангилал"
      action={<button onClick={() => setShowCatForm(true)} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ангилал нэмэх</button>}>
      <style>{`
        .layout{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .panel{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .ph{padding:14px 16px;border-bottom:0.5px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .pt{font-size:13px;font-weight:700;color:#0f172a}
        .item{padding:12px 16px;cursor:pointer;border-bottom:0.5px solid #f1f5f9;transition:background 0.1s}
        .item:last-child{border-bottom:none}
        .item:hover{background:#f8fafc}
        .item.active{background:#fef3c7;border-left:3px solid #d97706}
        .add-sm{font-size:11px;font-weight:600;padding:5px 10px;border-radius:7px;border:0.5px solid #fde68a;background:#fef3c7;color:#4338ca;cursor:pointer;font-family:inherit}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .field{margin-bottom:12px}
        .fl{font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
        .fi{width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;outline:none;font-family:inherit;color:#0f172a}
        .modal-btns{display:flex;gap:10px;margin-top:16px}
        .bp{flex:1;background:#d97706;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .bs{flex:1;background:white;color:#374151;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        @media(max-width:640px){.layout{grid-template-columns:1fr}}
      `}</style>

      <div className="layout">
        <div className="panel">
          <div className="ph"><span className="pt">Ангилалууд</span><span style={{ fontSize: 11, color: '#94a3b8' }}>{categories.length} ангилал</span></div>
          {categories.length === 0 && <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Ангилал байхгүй байна</div>}
          {categories.map(c => (
            <div key={c.id} className={`item ${selected?.id === c.id ? 'active' : ''}`} onClick={() => setSelected(c)}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {c.description && <span>{c.description} · </span>}
                <span style={{ color: '#d97706' }}>{c.material_types?.length || 0} төрөл</span>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="ph">
            <span className="pt">{selected ? `${selected.name} — Төрлүүд` : 'Төрлүүд'}</span>
            {selected && <button className="add-sm" onClick={() => setShowTypeForm(true)}>+ Төрөл нэмэх</button>}
          </div>
          {!selected ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Зүүнээс ангилал сонгоно уу
            </div>
          ) : selected.material_types?.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Төрөл байхгүй байна</div>
          ) : (
            selected.material_types?.map(t => (
              <div key={t.id} className="item">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                {t.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.description}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {showCatForm && (
        <div className="modal-bg" onClick={() => setShowCatForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Шинэ ангилал нэмэх</div>
            <div className="field"><label className="fl">Нэр *</label><input className="fi" placeholder="Үндсэн хавтан" value={catName} onChange={e => setCatName(e.target.value)} /></div>
            <div className="field"><label className="fl">Тайлбар</label><input className="fi" placeholder="..." value={catDesc} onChange={e => setCatDesc(e.target.value)} /></div>
            <div className="modal-btns">
              <button className="bp" onClick={createCategory}>Хадгалах</button>
              <button className="bs" onClick={() => setShowCatForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}

      {showTypeForm && selected && (
        <div className="modal-bg" onClick={() => setShowTypeForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Төрөл нэмэх</div>
            <div style={{ fontSize: 12, color: '#d97706', marginBottom: 14 }}>Ангилал: {selected.name}</div>
            <div className="field"><label className="fl">Нэр *</label><input className="fi" placeholder="ЛДСП" value={typeName} onChange={e => setTypeName(e.target.value)} /></div>
            <div className="field"><label className="fl">Тайлбар</label><input className="fi" placeholder="..." value={typeDesc} onChange={e => setTypeDesc(e.target.value)} /></div>
            <div className="modal-btns">
              <button className="bp" onClick={createType}>Хадгалах</button>
              <button className="bs" onClick={() => setShowTypeForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
