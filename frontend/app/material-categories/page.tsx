'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../components/ui/ToastProvider';

interface MaterialType {
  id: number;
  name: string;
  description: string;
  is_active?: boolean;
}

interface Category {
  id: number;
  name: string;
  description: string;
  material_types: MaterialType[];
}

const emptyCategory = { name: '', description: '' };
const emptyType = { name: '', description: '' };

export default function MaterialCategoriesPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { notify } = useToast();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [typeForm, setTypeForm] = useState(emptyType);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingType, setEditingType] = useState<MaterialType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) setAuth(JSON.parse(storedUser), token);
    else {
      router.push('/auth/login');
      return;
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadCategories();
  }, [mounted, user]);

  const loadCategories = async () => {
    const res = await api.get('/api/materials/categories').catch(() => ({ data: [] }));
    setCategories(res.data || []);
    if (selected) {
      const updated = (res.data || []).find((category: Category) => category.id === selected.id);
      setSelected(updated || null);
    }
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      notify('Ангиллын нэрээ оруулна уу', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingCategory) {
        const res = await api.put(`/api/materials/categories/${editingCategory.id}`, categoryForm);
        notify(res.data?.message || 'Ангилал шинэчлэгдлээ', 'success');
      } else {
        const res = await api.post('/api/materials/categories', categoryForm);
        notify(res.data?.message || 'Ангилал нэмэгдлээ', 'success');
      }
      setShowCatForm(false);
      setEditingCategory(null);
      setCategoryForm(emptyCategory);
      loadCategories();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Ангилал хадгалах үед алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveType = async () => {
    if (!selected || !typeForm.name.trim()) {
      notify('Төрлийн нэрээ оруулна уу', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingType) {
        const res = await api.put(`/api/materials/types/${editingType.id}`, {
          ...typeForm,
          category_id: selected.id,
        });
        notify(res.data?.message || 'Материалын төрөл шинэчлэгдлээ', 'success');
      } else {
        const res = await api.post('/api/materials/types', {
          ...typeForm,
          category_id: selected.id,
        });
        notify(res.data?.message || 'Материалын төрөл нэмэгдлээ', 'success');
      }
      setShowTypeForm(false);
      setEditingType(null);
      setTypeForm(emptyType);
      loadCategories();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Төрөл хадгалах үед алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  const archiveCategory = async (category: Category) => {
    if (!confirm(`"${category.name}" ангиллыг идэвхгүй болгох уу?`)) return;
    try {
      const res = await api.delete(`/api/materials/categories/${category.id}`);
      if (selected?.id === category.id) setSelected(null);
      notify(res.data?.message || 'Ангилал идэвхгүй боллоо', 'success');
      loadCategories();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Устгах үед алдаа гарлаа', 'error');
    }
  };

  const archiveType = async (type: MaterialType) => {
    if (!confirm(`"${type.name}" төрлийг идэвхгүй болгох уу?`)) return;
    try {
      const res = await api.delete(`/api/materials/types/${type.id}`);
      notify(res.data?.message || 'Материалын төрөл идэвхгүй боллоо', 'success');
      loadCategories();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Устгах үед алдаа гарлаа', 'error');
    }
  };

  if (!mounted || !user) return null;

  return (
    <AppLayout
      title="Материал ангилал"
      action={
        <button onClick={() => { setEditingCategory(null); setCategoryForm(emptyCategory); setShowCatForm(true); }} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Ангилал нэмэх
        </button>
      }
    >
      <style>{`
        .layout{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .panel{background:white;border:0.5px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .ph{padding:14px 16px;border-bottom:0.5px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .pt{font-size:13px;font-weight:700;color:#0f172a}
        .item{padding:12px 16px;border-bottom:0.5px solid #f1f5f9;transition:background 0.1s}
        .item:last-child{border-bottom:none}
        .item:hover{background:#f8fafc}
        .item.active{background:#fef3c7;border-left:3px solid #d97706}
        .actions{display:flex;gap:8px;margin-top:10px}
        .action{font-size:11px;font-weight:700;padding:5px 10px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-family:inherit}
        .danger{color:#dc2626;border-color:#fecaca;background:#fff7f7}
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
          <div className="ph"><span className="pt">Ангиллууд</span><span style={{ fontSize: 11, color: '#94a3b8' }}>{categories.length} ангилал</span></div>
          {categories.length === 0 && <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Ангилал байхгүй байна</div>}
          {categories.map((category) => (
            <div key={category.id} className={`item ${selected?.id === category.id ? 'active' : ''}`} onClick={() => setSelected(category)}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{category.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {category.description && <span>{category.description} · </span>}
                <span style={{ color: '#d97706' }}>{category.material_types?.length || 0} төрөл</span>
              </div>
              <div className="actions">
                <button className="action" onClick={(event) => { event.stopPropagation(); setEditingCategory(category); setCategoryForm({ name: category.name, description: category.description || '' }); setShowCatForm(true); }}>Засах</button>
                <button className="action danger" onClick={(event) => { event.stopPropagation(); archiveCategory(category); }}>Идэвхгүй болгох</button>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="ph">
            <span className="pt">{selected ? `${selected.name} төрлүүд` : 'Төрлүүд'}</span>
            {selected && <button className="action" onClick={() => { setEditingType(null); setTypeForm(emptyType); setShowTypeForm(true); }}>+ Төрөл нэмэх</button>}
          </div>
          {!selected ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Зүүнээс ангилал сонгоно уу</div>
          ) : selected.material_types?.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Төрөл байхгүй байна</div>
          ) : (
            selected.material_types.map((type) => (
              <div key={type.id} className="item">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{type.name}</div>
                {type.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{type.description}</div>}
                <div className="actions">
                  <button className="action" onClick={() => { setEditingType(type); setTypeForm({ name: type.name, description: type.description || '' }); setShowTypeForm(true); }}>Засах</button>
                  <button className="action danger" onClick={() => archiveType(type)}>Идэвхгүй болгох</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCatForm && (
        <div className="modal-bg" onClick={() => setShowCatForm(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{editingCategory ? 'Ангилал засах' : 'Шинэ ангилал нэмэх'}</div>
            <div className="field"><label className="fl">Нэр *</label><input className="fi" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="field"><label className="fl">Тайлбар</label><input className="fi" value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="modal-btns">
              <button className="bp" onClick={saveCategory} disabled={loading}>{loading ? 'Хадгалж байна...' : 'Хадгалах'}</button>
              <button className="bs" onClick={() => setShowCatForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}

      {showTypeForm && selected && (
        <div className="modal-bg" onClick={() => setShowTypeForm(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{editingType ? 'Төрөл засах' : 'Төрөл нэмэх'}</div>
            <div style={{ fontSize: 12, color: '#d97706', marginBottom: 14 }}>Ангилал: {selected.name}</div>
            <div className="field"><label className="fl">Нэр *</label><input className="fi" value={typeForm.name} onChange={(event) => setTypeForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="field"><label className="fl">Тайлбар</label><input className="fi" value={typeForm.description} onChange={(event) => setTypeForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="modal-btns">
              <button className="bp" onClick={saveType} disabled={loading}>{loading ? 'Хадгалж байна...' : 'Хадгалах'}</button>
              <button className="bs" onClick={() => setShowTypeForm(false)}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
