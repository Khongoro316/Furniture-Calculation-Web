'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface Material {
  id: number;
  code: string;
  name: string;
  unit: string;
  thickness: number | null;
  price: number;
  stock: number;
  is_active: boolean;
  material_types: { name: string; material_categories: { name: string } };
}

interface Category {
  id: number;
  name: string;
  material_types: { id: number; name: string }[];
}

const S: Record<string, string> = {
  label: 'font-size:11px;font-weight:500;margin-bottom:5px;display:block;color:#374151',
  input: 'width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit',
  select: 'width:100%;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;background:white;font-family:inherit',
};

export default function MaterialsPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    type_id: '', code: '', name: '', unit: 'м²',
    thickness: '', sheet_length: '', sheet_width: '', price: '', stock: '0'
  });

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['accountant','admin','super_admin'].includes(user.role)) { router.push('/dashboard'); return; }
    loadData();
  }, [mounted, user]);

  const loadData = async () => {
    const [m, c] = await Promise.all([
      api.get('/api/materials?org_id=1').catch(() => ({ data: [] })),
      api.get('/api/materials/categories').catch(() => ({ data: [] })),
    ]);
    setMaterials(m.data);
    setCategories(c.data);
  };

  const allTypes = categories.flatMap(c => c.material_types.map(t => ({ ...t, catName: c.name })));

  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.code || !form.name || !form.type_id) return;
    setLoading(true);
    try {
      await api.post('/api/materials', {
        ...form, org_id: 1, type_id: Number(form.type_id),
        price: Number(form.price), stock: Number(form.stock),
        thickness: form.thickness ? Number(form.thickness) : null,
        sheet_length: form.sheet_length ? Number(form.sheet_length) : null,
        sheet_width: form.sheet_width ? Number(form.sheet_width) : null,
      });
      setShowForm(false);
      setForm({ type_id: '', code: '', name: '', unit: 'м²', thickness: '', sheet_length: '', sheet_width: '', price: '', stock: '0' });
      loadData();
    } catch (err: any) { alert(err.response?.data?.message || 'Алдаа гарлаа'); }
    finally { setLoading(false); }
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout
      title="Материал удирдах"
      action={
        <button onClick={() => setShowForm(true)} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Нэмэх
        </button>
      }
    >
      <style>{`
        .tbl{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .tbl-head{display:grid;grid-template-columns:100px 1fr 120px 80px 100px 90px 80px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:8px}
        .tbl-row{display:grid;grid-template-columns:100px 1fr 120px 80px 100px 90px 80px;padding:12px 16px;border-bottom:0.5px solid #f1f5f9;align-items:center;gap:8px;transition:background 0.1s}
        .tbl-row:last-child{border-bottom:none}
        .tbl-row:hover{background:#fafafa}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:white;border-radius:16px;padding:24px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-height:92vh;overflow-y:auto}
        .field{margin-bottom:12px}
        .modal-btns{display:flex;gap:10px;margin-top:16px}
        .btn-p{flex:1;background:#d97706;color:white;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-s{flex:1;background:white;color:#374151;border:0.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        @media(max-width:900px){
          .tbl-head,.tbl-row{grid-template-columns:80px 1fr 100px 70px 90px}
          .hide-md{display:none}
        }
        @media(max-width:600px){
          .tbl-head,.tbl-row{grid-template-columns:1fr 80px 80px}
          .hide-sm{display:none}
        }
      `}</style>

      {/* Search + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          placeholder="🔍 Нэр, код хайх..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '9px 14px', fontSize: 13, outline: 'none', background: 'white', fontFamily: 'inherit' }}
        />
        {[
          { label: 'Нийт', val: materials.length, color: '#0f172a' },
          { label: 'Идэвхтэй', val: materials.filter(m => m.is_active).length, color: '#059669' },
          { label: 'Идэвхгүй', val: materials.filter(m => !m.is_active).length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="tbl">
        <div className="tbl-head">
          <div>Код</div>
          <div>Нэр</div>
          <div className="hide-sm">Ангилал / Төрөл</div>
          <div>Нэгж</div>
          <div className="hide-md">Зузаан</div>
          <div>Үнэ ₮</div>
          <div>Үлдэгдэл</div>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Материал байхгүй байна</div>
        )}
        {filtered.map(m => (
          <div key={m.id} className="tbl-row">
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#d97706', fontWeight: 600 }}>{m.code}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.name}</div>
              <div style={{ fontSize: 11, color: m.is_active ? '#059669' : '#ef4444', marginTop: 2 }}>
                {m.is_active ? '● Идэвхтэй' : '○ Идэвхгүй'}
              </div>
            </div>
            <div className="hide-sm" style={{ fontSize: 11, color: '#64748b' }}>
              {m.material_types?.material_categories?.name}<br />
              <span style={{ color: '#0891b2' }}>{m.material_types?.name}</span>
            </div>
            <div style={{ fontSize: 12, color: '#374151' }}>{m.unit}</div>
            <div className="hide-md" style={{ fontSize: 12, color: '#374151' }}>{m.thickness ? `${m.thickness}мм` : '—'}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{Number(m.price).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#374151' }}>{Number(m.stock).toFixed(1)}</div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Шинэ материал нэмэх</div>

            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>
                Материалын төрөл *
              </label>
              <select value={form.type_id} onChange={e => setForm(p => ({ ...p, type_id: e.target.value }))} style={{ width: '100%', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', background: 'white', fontFamily: 'inherit', color: '#0f172a' }}>
                <option value="">-- Сонгоно уу --</option>
                {allTypes.map(t => <option key={t.id} value={t.id}>{t.catName} → {t.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { key: 'code', label: 'Код *', placeholder: 'LDSP-WH-18' },
                { key: 'name', label: 'Нэр *', placeholder: 'Цагаан ЛДСП 18мм' },
              ].map(f => (
                <div key={f.key} className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>{f.label}</label>
                  <input placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { key: 'thickness', label: 'Зузаан (мм)', placeholder: '18' },
                { key: 'sheet_length', label: 'Урт (мм)', placeholder: '2800' },
                { key: 'sheet_width', label: 'Өргөн (мм)', placeholder: '2070' },
              ].map(f => (
                <div key={f.key} className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>{f.label}</label>
                  <input type="number" placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="field">
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>Нэгж</label>
                <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  style={{ width: '100%', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', background: 'white', fontFamily: 'inherit', color: '#0f172a' }}>
                  <option value="м²">м²</option>
                  <option value="м">м</option>
                  <option value="ш">ш</option>
                </select>
              </div>
              <div className="field">
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>Үнэ ₮ *</label>
                <input type="number" placeholder="28000" value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  style={{ width: '100%', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
              </div>
              <div className="field">
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>Үлдэгдэл</label>
                <input type="number" placeholder="0" value={form.stock}
                  onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                  style={{ width: '100%', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
              </div>
            </div>

            <div className="modal-btns">
              <button className="btn-p" onClick={handleCreate} disabled={loading}>
                {loading ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
              <button className="btn-s" onClick={() => setShowForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
