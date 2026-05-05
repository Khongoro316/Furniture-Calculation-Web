'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';

interface MaterialImage {
  id: number;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

interface Material {
  id: number;
  code: string;
  name: string;
  unit: string;
  thickness: number | null;
  sheet_length: number | null;
  sheet_width: number | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  material_types: {
    id: number;
    name: string;
    material_categories: { name: string };
  };
  material_images?: MaterialImage[];
}

interface Category {
  id: number;
  name: string;
  material_types: { id: number; name: string }[];
}

const UNITS = ['м²', 'м', 'ш', 'кг', 'л'];

export default function MaterialsPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState({
    type_id: '', code: '', name: '', unit: 'м²',
    thickness: '', sheet_length: '', sheet_width: '',
    price: '', stock: '0',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [imgModal, setImgModal] = useState<Material | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // edit modal дотор одоогийн зурагнуудыг тусад нь хадгалах
  const [editImages, setEditImages] = useState<MaterialImage[]>([]);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setAuth(JSON.parse(u), t);
    else { router.push('/auth/login'); return; }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!['accountant', 'admin', 'super_admin'].includes(user.role)) {
      router.push('/dashboard'); return;
    }
    loadData();
  }, [mounted, user]);

  const loadData = async () => {
    setTableLoading(true);
    const [m, c] = await Promise.all([
      api.get('/api/materials?org_id=1').catch(() => ({ data: [] })),
      api.get('/api/materials/categories').catch(() => ({ data: [] })),
    ]);
    setMaterials(m.data || []);
    setCategories(c.data || []);
    setTableLoading(false);
  };

  const allTypes = categories.flatMap(c =>
    c.material_types.map(t => ({ ...t, catName: c.name }))
  );

  const filtered = materials.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
    const matchCat = !filterCat || m.material_types?.material_categories?.name === filterCat;
    return matchSearch && matchCat;
  });

  const resetForm = () => {
    setForm({ type_id: '', code: '', name: '', unit: 'м²', thickness: '', sheet_length: '', sheet_width: '', price: '', stock: '0' });
    previews.forEach(u => URL.revokeObjectURL(u));
    setSelectedFiles([]);
    setPreviews([]);
    setEditMaterial(null);
    setEditImages([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openEdit = (m: Material) => {
    setEditMaterial(m);
    setEditImages(m.material_images || []);
    const typeId = allTypes.find(t => t.name === m.material_types?.name)?.id || '';
    setForm({
      type_id: String(typeId),
      code: m.code, name: m.name, unit: m.unit,
      thickness: m.thickness ? String(m.thickness) : '',
      sheet_length: m.sheet_length ? String(m.sheet_length) : '',
      sheet_width: m.sheet_width ? String(m.sheet_width) : '',
      price: String(m.price), stock: String(m.stock),
    });
    setSelectedFiles([]);
    setPreviews([]);
    setShowForm(true);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...selectedFiles, ...files].slice(0, 10);
    previews.forEach(u => URL.revokeObjectURL(u));
    setSelectedFiles(combined);
    setPreviews(combined.map(f => URL.createObjectURL(f)));
  };

  const removePreview = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setSelectedFiles(f => f.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!form.type_id || !form.code || !form.name || !form.price) {
      alert('Төрөл, код, нэр, үнэ заавал бөглөнө үү'); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('org_id', '1');
      fd.append('type_id', form.type_id);
      fd.append('code', form.code);
      fd.append('name', form.name);
      fd.append('unit', form.unit);
      fd.append('price', form.price);
      fd.append('stock', form.stock || '0');
      if (form.thickness) fd.append('thickness', form.thickness);
      if (form.sheet_length) fd.append('sheet_length', form.sheet_length);
      if (form.sheet_width) fd.append('sheet_width', form.sheet_width);
      selectedFiles.forEach(f => fd.append('images', f));

      if (editMaterial) {
        await api.put(`/api/materials/${editMaterial.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/api/materials', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Хадгалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/materials/${id}`);
      setDeleteId(null);
      loadData();
    } catch { alert('Устгахад алдаа гарлаа'); }
  };

  const handleDeleteImg = async (imgId: number, fromEdit = false) => {
    await api.delete(`/api/materials/images/${imgId}`).catch(() => {});
    if (fromEdit) {
      setEditImages(p => p.filter(i => i.id !== imgId));
    }
    setImgModal(prev => prev
      ? { ...prev, material_images: prev.material_images?.filter(i => i.id !== imgId) }
      : null
    );
    loadData();
  };

  const handleSetPrimary = async (matId: number, imgId: number) => {
    await api.patch(`/api/materials/${matId}/images/${imgId}/primary`).catch(() => {});
    setEditImages(p => p.map(i => ({ ...i, is_primary: i.id === imgId })));
    loadData();
    setImgModal(null);
  };

  if (!mounted || !user) return null;

  const catNames = [...new Set(
    materials.map(m => m.material_types?.material_categories?.name).filter(Boolean)
  )];

  return (
    <AppLayout
      title="Материал удирдах"
      action={
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(217,119,6,0.3)' }}
        >
          + Материал нэмэх
        </button>
      }
    >
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px}

        .tbl-wrap{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
        .tbl-head{display:grid;grid-template-columns:64px 110px 1fr 140px 76px 110px 100px 130px;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;gap:10px;align-items:center}
        .tbl-row{display:grid;grid-template-columns:64px 110px 1fr 140px 76px 110px 100px 130px;padding:10px 16px;border-bottom:1px solid #f1f5f9;align-items:center;gap:10px;transition:background 0.12s}
        .tbl-row:last-child{border-bottom:none}
        .tbl-row:hover{background:#fafbfc}

        .thumb{width:52px;height:52px;border-radius:10px;overflow:hidden;border:1.5px solid #e5e7eb;background:#f9fafb;cursor:pointer;position:relative;flex-shrink:0}
        .thumb img{width:100%;height:100%;object-fit:cover;display:block}
        .thumb-cnt{position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.62);color:white;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px}
        .no-img{width:52px;height:52px;border-radius:10px;border:1.5px dashed #d1d5db;display:flex;align-items:center;justify-content:center;font-size:20px;color:#d1d5db;cursor:pointer;transition:all 0.15s}
        .no-img:hover{border-color:#d97706;color:#d97706}

        .code-badge{font-family:monospace;font-size:11px;font-weight:700;color:#b45309;background:#fef3c7;padding:3px 8px;border-radius:6px}
        .stock-ok{background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:3px 9px;border-radius:100px}
        .stock-low{background:#fef9c3;color:#854d0e;font-size:11px;font-weight:700;padding:3px 9px;border-radius:100px}
        .stock-out{background:#fee2e2;color:#991b1b;font-size:11px;font-weight:700;padding:3px 9px;border-radius:100px}

        .act-btn{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:5px 10px;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;background:white;font-family:inherit;color:#374151;transition:all 0.15s}
        .act-btn:hover{background:#f8fafc;border-color:#94a3b8}
        .act-btn.edit:hover{border-color:#d97706;color:#d97706;background:#fffbf5}
        .act-btn.img-btn:hover{border-color:#8b5cf6;color:#7c3aed;background:#faf5ff}
        .act-btn.del:hover{border-color:#ef4444;color:#ef4444;background:#fef2f2}

        .filter-bar{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
        .search-input{border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 14px;font-size:13px;outline:none;font-family:inherit;width:260px;transition:border-color 0.15s}
        .search-input:focus{border-color:#d97706}
        .flt-btn{font-size:12px;font-weight:600;padding:7px 14px;border-radius:100px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s;white-space:nowrap}
        .flt-btn.on{background:#1c1917;color:white;border-color:#1c1917}
        .flt-btn:hover:not(.on){border-color:#d97706;color:#d97706}

        /* MODAL */
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal{background:white;border-radius:20px;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.22);display:flex;flex-direction:column}
        .modal-head{padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2}
        .modal-title{font-size:16px;font-weight:800;color:#0f172a}
        .mclose{width:30px;height:30px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;font-size:18px;color:#64748b;display:flex;align-items:center;justify-content:center;transition:all 0.15s;line-height:1}
        .mclose:hover{background:#e2e8f0;color:#0f172a}
        .modal-body{padding:22px;flex:1}
        .modal-foot{display:flex;gap:10px;padding:16px 22px;border-top:1px solid #f1f5f9;background:white;position:sticky;bottom:0;z-index:2}
        .btn-save{flex:1;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:11px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 2px 8px rgba(217,119,6,0.25)}
        .btn-save:hover:not(:disabled){opacity:0.92;transform:translateY(-1px)}
        .btn-save:disabled{opacity:0.55;cursor:not-allowed;transform:none}
        .btn-cancel{background:#f1f5f9;color:#374151;border:none;border-radius:11px;padding:13px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:background 0.15s}
        .btn-cancel:hover{background:#e2e8f0}

        /* Form */
        .sec-div{font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;padding:4px 0 8px;border-bottom:1px solid #f1f5f9;margin:16px 0 14px}
        .sec-div:first-child{margin-top:0}
        .field{margin-bottom:13px}
        .fl{font-size:11px;font-weight:700;color:#374151;display:block;margin-bottom:5px}
        .req{color:#ef4444;margin-left:2px}
        .fi{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:13px;color:#0f172a;outline:none;font-family:inherit;transition:border-color 0.15s;background:white}
        .fi:focus{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.08)}
        .fi::placeholder{color:#94a3b8}
        .frow2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .frow3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}

        /* Upload */
        .upload-zone{border:2px dashed #e2e8f0;border-radius:12px;padding:20px;text-align:center;cursor:pointer;transition:all 0.2s;background:#fafafa}
        .upload-zone:hover{border-color:#d97706;background:#fffbf5}
        .prev-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px}
        .prev-item{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;border:2px solid #e2e8f0}
        .prev-item img{width:100%;height:100%;object-fit:cover;display:block}
        .prev-item.first{border-color:#d97706}
        .prev-del{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:rgba(239,68,68,0.88);color:white;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1}
        .prev-lbl{position:absolute;bottom:3px;left:3px;font-size:9px;font-weight:700;background:#d97706;color:white;padding:2px 6px;border-radius:4px}

        .exist-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px}
        .exist-item{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;border:2px solid #e2e8f0}
        .exist-item.primary{border-color:#d97706}
        .exist-item img{width:100%;height:100%;object-fit:cover;display:block}
        .exist-del{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:rgba(239,68,68,0.88);color:white;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;font-weight:700}
        .exist-lbl{position:absolute;bottom:3px;left:3px;font-size:9px;font-weight:700;background:#d97706;color:white;padding:2px 6px;border-radius:4px}

        /* Image viewer */
        .img-modal{background:white;border-radius:20px;width:100%;max-width:640px;max-height:88vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.22)}
        .img-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px}
        .img-card{border-radius:12px;overflow:hidden;border:2px solid #e2e8f0;position:relative}
        .img-card.primary{border-color:#d97706}
        .img-card img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
        .img-card-foot{display:flex;gap:6px;padding:8px}
        .ia-btn{flex:1;font-size:11px;font-weight:600;padding:6px 0;border:none;border-radius:7px;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .ia-star{background:#fef3c7;color:#92400e}
        .ia-star:hover{background:#fde68a}
        .ia-del{background:#fef2f2;color:#dc2626}
        .ia-del:hover{background:#fee2e2}
        .ia-badge{position:absolute;top:6px;left:6px;background:#d97706;color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px}

        /* Del confirm */
        .del-modal{background:white;border-radius:20px;width:100%;max-width:360px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,0.22);text-align:center}

        .empty{padding:60px 20px;text-align:center}

        @media(max-width:960px){
          .tbl-head,.tbl-row{grid-template-columns:56px 96px 1fr 90px 110px}
          .hide-md{display:none!important}
        }
      `}</style>

      {/* ШҮҮЛТ */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔍  Нэр эсвэл код хайх..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className={`flt-btn ${!filterCat ? 'on' : ''}`} onClick={() => setFilterCat('')}>
          Бүгд ({materials.length})
        </button>
        {catNames.map(cat => (
          <button
            key={cat}
            className={`flt-btn ${filterCat === cat ? 'on' : ''}`}
            onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
          >
            {cat} ({materials.filter(m => m.material_types?.material_categories?.name === cat).length})
          </button>
        ))}
      </div>

      {/* ХҮСНЭГТ */}
      <div className="tbl-wrap">
        <div className="tbl-head">
          <div>Зураг</div>
          <div>Код</div>
          <div>Нэр</div>
          <div className="hide-md">Ангилал / Төрөл</div>
          <div className="hide-md">Зузаан</div>
          <div>Үнэ</div>
          <div>Нөөц</div>
          <div>Үйлдэл</div>
        </div>

        {tableLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="tbl-row">
              <div className="skel" style={{ width: 52, height: 52, borderRadius: 10 }} />
              {[96, '100%', 120, 60, 90, 70, 110].map((w, j) => (
                <div key={j} className={`skel ${j >= 2 ? 'hide-md' : ''}`} style={{ height: 14, width: w, maxWidth: '100%' }} />
              ))}
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 40, marginBottom: 10 }}>🪵</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Материал олдсонгүй</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              {search ? `"${search}" хайлтад тохирсон зүйл байхгүй` : 'Дээрх товчоор материал нэмнэ үү'}
            </div>
          </div>
        ) : filtered.map(m => {
          const imgs = m.material_images || [];
          const primary = imgs.find(i => i.is_primary) || imgs[0];
          const stockNum = Number(m.stock);

          return (
            <div key={m.id} className="tbl-row">
              {/* Зураг */}
              <div>
                {primary ? (
                  <div className="thumb" onClick={() => setImgModal(m)}>
                    <img src={primary.url} alt={m.name} />
                    {imgs.length > 1 && <span className="thumb-cnt">+{imgs.length - 1}</span>}
                  </div>
                ) : (
                  <div className="no-img" onClick={() => openEdit(m)} title="Зураг нэмэх">📷</div>
                )}
              </div>

              {/* Код */}
              <div><span className="code-badge">{m.code}</span></div>

              {/* Нэр */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.unit}</div>
              </div>

              {/* Ангилал */}
              <div className="hide-md">
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  {m.material_types?.material_categories?.name}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.material_types?.name}</div>
              </div>

              {/* Зузаан */}
              <div className="hide-md">
                <span style={{ fontSize: 12, color: '#475569' }}>
                  {m.thickness ? `${Number(m.thickness)}мм` : '—'}
                </span>
              </div>

              {/* Үнэ */}
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                ₮{Number(m.price).toLocaleString()}
              </div>

              {/* Нөөц */}
              <div>
                <span className={stockNum > 10 ? 'stock-ok' : stockNum > 0 ? 'stock-low' : 'stock-out'}>
                  {stockNum > 0 ? stockNum.toLocaleString() : 'Дуссан'}
                </span>
              </div>

              {/* Үйлдэл */}
              <div style={{ display: 'flex', gap: 5 }}>
                <button className="act-btn edit" onClick={() => openEdit(m)}>✏️ Засах</button>
                {imgs.length > 0 && (
                  <button className="act-btn img-btn" onClick={() => setImgModal(m)}>
                    🖼 {imgs.length}
                  </button>
                )}
                <button className="act-btn del" onClick={() => setDeleteId(m.id)}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ БҮРТГЭХ / ЗАСАХ MODAL ══ */}
      {showForm && (
        <div className="modal-bg" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">
                {editMaterial ? '✏️ Материал засах' : '➕ Шинэ материал нэмэх'}
              </div>
              <button className="mclose" onClick={() => { setShowForm(false); resetForm(); }}>×</button>
            </div>

            <div className="modal-body">
              {/* ─ ҮНДСЭН ─ */}
              <div className="sec-div">Үндсэн мэдээлэл</div>

              <div className="field">
                <label className="fl">Материалын төрөл <span className="req">*</span></label>
                <select
                  className="fi"
                  value={form.type_id}
                  onChange={e => setForm(p => ({ ...p, type_id: e.target.value }))}
                >
                  <option value="">— Ангилал сонгоно уу —</option>
                  {categories.map(cat => (
                    <optgroup key={cat.id} label={`📂 ${cat.name}`}>
                      {cat.material_types.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="frow2">
                <div className="field">
                  <label className="fl">Код <span className="req">*</span></label>
                  <input
                    className="fi"
                    placeholder="LDSP-WH-18"
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="field">
                  <label className="fl">Нэр <span className="req">*</span></label>
                  <input
                    className="fi"
                    placeholder="Цагаан ЛДСП 18мм"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="frow3">
                <div className="field">
                  <label className="fl">Хэмжих нэгж</label>
                  <select className="fi" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="fl">Зузаан (мм)</label>
                  <input className="fi" type="number" placeholder="18" min="0" value={form.thickness}
                    onChange={e => setForm(p => ({ ...p, thickness: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="fl">Үнэ (₮) <span className="req">*</span></label>
                  <input className="fi" type="number" placeholder="28000" min="0" value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                </div>
              </div>

              {/* ─ ХАВТАН ─ */}
              <div className="sec-div">Хавтангийн хэмжээ & Нөөц</div>

              <div className="frow3">
                <div className="field">
                  <label className="fl">Урт (мм)</label>
                  <input className="fi" type="number" placeholder="2800" value={form.sheet_length}
                    onChange={e => setForm(p => ({ ...p, sheet_length: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="fl">Өргөн (мм)</label>
                  <input className="fi" type="number" placeholder="2070" value={form.sheet_width}
                    onChange={e => setForm(p => ({ ...p, sheet_width: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="fl">Нөөц ({form.unit})</label>
                  <input className="fi" type="number" placeholder="0" min="0" value={form.stock}
                    onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
                </div>
              </div>

              {/* ─ ЗУРАГ ─ */}
              <div className="sec-div">Зураг (олон зураг оруулж болно)</div>

              {/* Одоо байгаа зурагнууд */}
              {editImages.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 7 }}>
                    Одоогийн зурагнууд — {editImages.length} ширхэг
                  </div>
                  <div className="exist-grid">
                    {editImages.map(img => (
                      <div key={img.id} className={`exist-item ${img.is_primary ? 'primary' : ''}`}>
                        <img src={img.url} alt="" />
                        {img.is_primary && <span className="exist-lbl">Үндсэн</span>}
                        <button
                          className="exist-del"
                          title="Устгах"
                          onClick={() => handleDeleteImg(img.id, true)}
                        >×</button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Шинэ зураг */}
              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFiles}
                />
                <div style={{ fontSize: 26, marginBottom: 5 }}>📷</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 3 }}>
                  Зураг сонгох
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  JPG, PNG, WEBP · Дээд тал 10 зураг · Тус бүр 5MB
                </div>
              </div>

              {previews.length > 0 && (
                <>
                  <div className="prev-grid">
                    {previews.map((url, i) => (
                      <div key={i} className={`prev-item ${i === 0 ? 'first' : ''}`}>
                        <img src={url} alt="" />
                        {i === 0 && <span className="prev-lbl">Үндсэн</span>}
                        <button className="prev-del" onClick={() => removePreview(i)}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700, marginTop: 8 }}>
                    ✓ {selectedFiles.length} зураг сонгогдлоо
                  </div>
                </>
              )}
            </div>

            <div className="modal-foot">
              <button className="btn-cancel" onClick={() => { setShowForm(false); resetForm(); }}>
                Болих
              </button>
              <button className="btn-save" onClick={handleSave} disabled={loading}>
                {loading
                  ? '⏳ Хадгалж байна...'
                  : editMaterial ? '💾 Өөрчлөлт хадгалах' : '➕ Материал нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ЗУРГИЙН MODAL ══ */}
      {imgModal && (
        <div className="modal-bg" onClick={() => setImgModal(null)}>
          <div className="img-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title">{imgModal.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {imgModal.material_images?.length ?? 0} зураг
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setImgModal(null); openEdit(imgModal); }}
                  style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, cursor: 'pointer', background: 'white', fontFamily: 'inherit', color: '#374151', transition: 'all 0.15s' }}
                >
                  + Зураг нэмэх
                </button>
                <button className="mclose" onClick={() => setImgModal(null)}>×</button>
              </div>
            </div>
            <div className="img-grid">
              {(imgModal.material_images || []).map(img => (
                <div key={img.id} className={`img-card ${img.is_primary ? 'primary' : ''}`}>
                  <img src={img.url} alt="" />
                  {img.is_primary && <span className="ia-badge">⭐ Үндсэн</span>}
                  <div className="img-card-foot">
                    {!img.is_primary && (
                      <button className="ia-btn ia-star" onClick={() => handleSetPrimary(imgModal.id, img.id)}>
                        ⭐ Үндсэн болгох
                      </button>
                    )}
                    <button
                      className="ia-btn ia-del"
                      style={{ flex: img.is_primary ? 1 : 'unset', minWidth: 36 }}
                      onClick={() => handleDeleteImg(img.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ УСТГАХ БАТАЛГАА ══ */}
      {deleteId !== null && (
        <div className="modal-bg" onClick={() => setDeleteId(null)}>
          <div className="del-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Материал устгах уу?
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
              Материал идэвхгүй болж, жагсаалтаас хасагдана.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 11, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Болих
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{ flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', border: 'none', borderRadius: 11, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Устгах
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
