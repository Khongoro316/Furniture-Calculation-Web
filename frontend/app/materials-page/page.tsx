'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useCart } from '../../hooks/useCart';
import CartToast from '../../components/CartToast';

interface Material {
  id: number;
  code: string;
  name: string;
  unit: string;
  thickness: number | null;
  price: number;
  stock: number;
  is_active: boolean;
  image_url?: string;
  material_types?: {
    id: number;
    name: string;
    material_categories?: { id: number; name: string };
  };
  material_images?: { url: string; is_primary: boolean; sort_order: number }[];
}

interface Category {
  id: number;
  name: string;
  material_types: { id: number; name: string }[];
}

// ── Материалын визуал (зураг байхгүй үед) ────────────────────────────────────
const getVisual = (catName = '', typeName = '') => {
  const t = typeName.toLowerCase();
  if (t.includes('лдсп') || t.includes('ldsp')) return { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#92400e', p: 'grid' };
  if (t.includes('мдф') || t.includes('mdf')) return { bg: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)', color: '#14532d', p: 'stripe' };
  if (t.includes('hdf')) return { bg: 'linear-gradient(135deg,#eff6ff,#bfdbfe)', color: '#1e3a8a', p: 'dot' };
  if (t.includes('abs') || catName.toLowerCase().includes('ирмэг')) return { bg: 'linear-gradient(135deg,#fdf2f8,#f5d0fe)', color: '#701a75', p: 'band' };
  return { bg: 'linear-gradient(135deg,#f8fafc,#e2e8f0)', color: '#374151', p: 'circle' };
};

const MatImg = ({ m, h = 160 }: { m: Material; h?: number }) => {
  const imgs = m.material_images || [];
  const primary = imgs.find(i => i.is_primary) || imgs[0];
  if (primary?.url || m.image_url) {
    return (
      <div style={{ height: h, overflow: 'hidden', position: 'relative', background: '#f9fafb' }}>
        <img
          src={primary?.url || m.image_url}
          alt={m.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
          className="mat-img"
        />
        {imgs.length > 1 && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
            +{imgs.length - 1}
          </div>
        )}
      </div>
    );
  }
  const v = getVisual(m.material_types?.material_categories?.name, m.material_types?.name);
  return (
    <div style={{ height: h, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }} viewBox="0 0 200 160">
        {v.p === 'grid' && [20,40,60,80,100,120,140,160,180].map(x => <line key={x} x1={x} y1="0" x2={x} y2="160" stroke={v.color} strokeWidth="0.5" />)}
        {v.p === 'stripe' && [0,20,40,60,80,100,120,140,160,180,200].map((x,i) => <line key={i} x1={x} y1="0" x2={x-30} y2="160" stroke={v.color} strokeWidth="0.8" />)}
        {v.p === 'dot' && Array.from({length:8}).map((_,r) => Array.from({length:10}).map((_,c) => <circle key={`${r}${c}`} cx={c*22+11} cy={r*22+11} r="3" fill={v.color} />))}
        {v.p === 'band' && [10,30,50,70,90,110,130,150].map(y => <rect key={y} x="0" y={y} width="200" height="8" fill={v.color} rx="2" />)}
        {v.p === 'circle' && [40,80,120,160].map(cx => [40,80,120].map(cy => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="10" fill="none" stroke={v.color} strokeWidth="1" />))}
      </svg>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: v.color, background: 'rgba(255,255,255,0.9)', padding: '4px 12px', borderRadius: 20, marginBottom: m.thickness ? 5 : 0 }}>
          {m.material_types?.name || '—'}
        </div>
        {m.thickness && (
          <div style={{ fontSize: 10, color: v.color, fontWeight: 700, background: 'rgba(255,255,255,0.75)', padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>
            {m.thickness}мм
          </div>
        )}
      </div>
    </div>
  );
};

export default function MaterialsPagePublic() {
  const router = useRouter();
  const { addToCart, toasts, count } = useCart();

  const [authUser, setAuthUser] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Шүүлт & хайлт
  const [activeCat, setActiveCat] = useState<number | 'all'>('all');
  const [activeType, setActiveType] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Сагсанд нэмэх тоо хэмжээ
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Дэлгэрэнгүй modal
  const [detailMat, setDetailMat] = useState<Material | null>(null);
  const [detailQty, setDetailQty] = useState(1);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) try { setAuthUser(JSON.parse(u)); } catch {}
  }, []);

  // useEffect дотор categories татахад:
useEffect(() => {
  setLoading(true);
  Promise.all([
    api.get('/api/materials').catch(() => ({ data: [] })),
    api.get('/api/materials/categories').catch(() => ({ data: [] })),
  ]).then(([m, c]) => {
    setMaterials(m.data || []);

    // ── ДАВХАРДАЛТЫГ ЗАСАХ ──
    // Нэрээр deduplicate хийж, материал байгаа категориудыг харуулна
    const matData = m.data || [];
    const rawCats = c.data || [];

    const uniqueCats = rawCats.reduce((acc: any[], cat: any) => {
      if (acc.find(a => a.name === cat.name)) return acc; // давхардал хасах
      
      // Тухайн ангилалд хамаарах материалын тоо
      const catMaterials = matData.filter((mat: any) =>
        mat.material_types?.material_categories?.name === cat.name
      );
      
      // Зөвхөн материал байгаа ангилалуудыг харуулна
      if (catMaterials.length === 0) return acc;

      // Дэд төрлийг давхардалгүй, материал байгаа зүйлсийг гаргана
      const uniqueTypes = cat.material_types?.reduce((tacc: any[], t: any) => {
        if (tacc.find(ta => ta.name === t.name)) return tacc;
        const typeMaterials = matData.filter((mat: any) => mat.material_types?.id === t.id);
        if (typeMaterials.length === 0) return tacc;
        return [...tacc, t];
      }, []) || [];

      return [...acc, { ...cat, material_types: uniqueTypes }];
    }, []);

    setCategories(uniqueCats);
  }).finally(() => setLoading(false));
}, []);

  // URL query params-аар type шүүлт
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeId = params.get('type');
    if (typeId) setActiveType(Number(typeId));
  }, []);

  // Шүүгдсэн материалууд
  let filtered = materials.filter(m => m.is_active !== false);
  if (activeCat !== 'all') {
    filtered = filtered.filter(m => m.material_types?.material_categories?.id === activeCat);
  }
  if (activeType) {
    filtered = filtered.filter(m => m.material_types?.id === activeType);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.material_types?.name?.toLowerCase().includes(q)
    );
  }
  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'new') filtered = [...filtered].slice().reverse();

  const handleAddToCart = (e: React.MouseEvent, m: Material) => {
    e.stopPropagation();
    addToCart({
      id: m.id,
      code: m.code,
      name: m.name,
      unit: m.unit,
      price: m.price,
      image_url: m.material_images?.find(i => i.is_primary)?.url || m.material_images?.[0]?.url || m.image_url,
      type_name: m.material_types?.name,
    });
    setAddedIds(prev => { const s = new Set(prev); s.add(m.id); setTimeout(() => setAddedIds(p => { const n = new Set(p); n.delete(m.id); return n; }), 1500); return s; });
  };

  const Skel = () => (
    <div style={{ background: 'white', border: '1.5px solid #f3f4f6', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ height: 160, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: 14 }}>
        {[50, 80, 40, 60].map((w, i) => <div key={i} style={{ height: i === 1 ? 13 : 10, width: `${w}%`, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 5, marginBottom: 8 }} />)}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f1f5f9;color:#0f172a;-webkit-font-smoothing:antialiased}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}

        /* NAV */
        .topnav{background:white;border-bottom:1px solid #e2e8f0;height:64px;display:flex;align-items:center;padding:0 32px;position:sticky;top:0;z-index:100;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .nav-brand{display:flex;align-items:center;gap:8px;cursor:pointer;margin-right:24px}
        .nav-logo{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:17px}
        .nav-brand-name{font-size:16px;font-weight:800;color:#0f172a;letter-spacing:-0.01em}
        .nav-back{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border:none;background:none;font-family:inherit;padding:7px 11px;border-radius:8px;transition:all 0.15s;flex-shrink:0}
        .nav-back:hover{background:#f1f5f9;color:#0f172a}
        .nav-sep{width:1px;height:22px;background:#e2e8f0;margin:0 8px}
        .nav-title{font-size:14px;font-weight:700;color:#0f172a}
        .nav-r{margin-left:auto;display:flex;align-items:center;gap:8px}

        /* CART BUTTON */
        .cart-btn{display:flex;align-items:center;gap:7px;background:#1c1917;color:white;border:none;border-radius:11px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;position:relative}
        .cart-btn:hover{background:#374151;transform:translateY(-1px)}
        .cart-count{background:#d97706;color:white;font-size:10px;font-weight:800;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}

      
        .hs-item{display:flex;flex-direction:column;gap:3px}
        .hs-val{font-size:18px;font-weight:800;color:white}
        .hs-label{font-size:11px;color:rgba(255,255,255,0.45);font-weight:500}
        .hs-div{width:1px;background:rgba(255,255,255,0.12);margin:2px 0}

        /* CONTROLS */
        .controls{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
        .search-box{flex:1;min-width:220px;display:flex;align-items:center;gap:9px;background:white;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 15px;transition:all 0.15s}
        .search-box:focus-within{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.08)}
        .search-box input{background:none;border:none;outline:none;font-size:13px;color:#0f172a;width:100%;font-family:inherit}
        .search-box input::placeholder{color:#94a3b8}
        .sort-sel{border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 14px;font-size:13px;font-weight:600;color:#374151;background:white;outline:none;cursor:pointer;font-family:inherit;transition:border-color 0.15s}
        .sort-sel:focus{border-color:#d97706}
        .view-toggle{display:flex;background:white;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden}
        .vt-btn{width:38px;height:38px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:#94a3b8;transition:all 0.15s}
        .vt-btn.on{background:#1c1917;color:white}

        /* CATEGORY TABS */
       .cat-tabs{
  display:flex;gap:6px;margin-bottom:8px;
  overflow-x:auto;flex-wrap:nowrap;
  padding-bottom:4px;
  scrollbar-width:none;
}
.cat-tabs::-webkit-scrollbar{display:none}

/* type-row мөн адилхан */
.type-row{
  display:flex;gap:6px;margin-bottom:14px;
  overflow-x:auto;flex-wrap:nowrap;
  scrollbar-width:none;
}
.type-row::-webkit-scrollbar{display:none}
        .ct{font-size:12px;font-weight:600;padding:7px 16px;border-radius:100px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s;white-space:nowrap}
        .ct.on{background:#1c1917;color:white;border-color:#1c1917}
        .ct:hover:not(.on){border-color:#d97706;color:#d97706}

        /* TYPE FILTER */
        .type-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
        .tp{font-size:11px;font-weight:600;padding:5px 13px;border-radius:100px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;color:#64748b;font-family:inherit;transition:all 0.15s;white-space:nowrap}
        .tp.on{background:#d97706;color:white;border-color:#d97706}
        .tp:hover:not(.on){border-color:#d97706;color:#d97706}

        /* RESULT COUNT */
        .result-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
        .result-count{font-size:13px;color:#64748b;font-weight:500}
        .result-count strong{color:#0f172a}

        /* GRID */
        .prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
        .prod-card{background:white;border:1.5px solid #f3f4f6;border-radius:16px;overflow:hidden;cursor:pointer;transition:all 0.22s;animation:fadeUp 0.3s ease}
        .prod-card:hover{border-color:#e0e0e0;box-shadow:0 10px 32px rgba(0,0,0,0.09);transform:translateY(-4px)}
        .prod-card:hover .mat-img{transform:scale(1.06)}
        .prod-body{padding:14px}
        .prod-code{font-family:monospace;font-size:11px;color:#d97706;font-weight:700;background:#fef3c7;padding:2px 7px;border-radius:5px;display:inline-block;margin-bottom:6px}
        .prod-name{font-size:13px;font-weight:700;color:#0f172a;margin-bottom:3px;line-height:1.4}
        .prod-meta{font-size:11px;color:#94a3b8;margin-bottom:11px}
        .prod-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .prod-price{font-size:16px;font-weight:800;color:#0f172a}
        .prod-unit{font-size:10px;color:#94a3b8;margin-top:1px}
        .stock-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;white-space:nowrap}

        /* ADD BUTTON */
        .add-btn{width:32px;height:32px;border-radius:9px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all 0.2s;flex-shrink:0}
        .add-btn:hover{background:#1c1917;border-color:#1c1917;color:white;transform:scale(1.05)}
        .add-btn.added{background:#059669;border-color:#059669;animation:pop 0.35s ease;color:white}

        /* LIST VIEW */
        .list-row{background:white;border:1.5px solid #f3f4f6;border-radius:14px;display:flex;align-items:center;gap:14px;padding:12px 16px;cursor:pointer;transition:all 0.15s;margin-bottom:8px;animation:fadeUp 0.3s ease}
        .list-row:hover{border-color:#e0e0e0;box-shadow:0 4px 16px rgba(0,0,0,0.06);transform:translateY(-1px)}
        .list-img{width:60px;height:60px;border-radius:11px;overflow:hidden;flex-shrink:0}
        .list-add-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.2s;flex-shrink:0;margin-left:auto}
        .list-add-btn:hover{background:#1c1917;border-color:#1c1917;color:white}
        .list-add-btn.added{background:#059669;border-color:#059669;color:white;animation:pop 0.35s ease}

        /* DETAIL MODAL */
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:500;display:flex;align-items:flex-end;justify-content:center;padding:0;backdrop-filter:blur(4px)}
        .detail-modal{background:white;border-radius:24px 24px 0 0;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,0.2);animation:slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)}
        @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
        .dm-img{width:100%;height:260px;overflow:hidden;position:relative;background:#f9fafb}
        .dm-img img{width:100%;height:100%;object-fit:cover}
        .dm-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);cursor:pointer;font-size:18px;color:#374151;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:all 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
        .dm-close:hover{background:white;color:#0f172a}
        .dm-body{padding:20px 22px 28px}
        .dm-code{font-family:monospace;font-size:12px;color:#d97706;font-weight:700;background:#fef3c7;padding:3px 10px;border-radius:6px;display:inline-block;margin-bottom:8px}
        .dm-name{font-size:20px;font-weight:800;color:#0f172a;margin-bottom:4px;letter-spacing:-0.01em}
        .dm-type{font-size:13px;color:#64748b;margin-bottom:16px}
        .dm-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
        .dm-info-item{background:#f8fafc;border-radius:11px;padding:12px 14px}
        .dm-info-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px}
        .dm-info-val{font-size:14px;font-weight:700;color:#0f172a}
        .dm-qty-row{display:flex;align-items:center;gap:12px;margin-bottom:16px}
        .dm-qty-label{font-size:13px;font-weight:600;color:#374151}
        .qty-ctrl{display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:11px;overflow:hidden}
        .qty-btn{width:36px;height:36px;border:none;background:white;cursor:pointer;font-size:18px;font-weight:700;color:#374151;display:flex;align-items:center;justify-content:center;transition:background 0.12s;font-family:inherit}
        .qty-btn:hover{background:#f1f5f9}
        .qty-inp{width:48px;text-align:center;font-size:14px;font-weight:700;color:#0f172a;border:none;border-left:1.5px solid #e2e8f0;border-right:1.5px solid #e2e8f0;padding:6px 0;font-family:inherit;background:white;outline:none}
        .dm-add-btn{flex:1;background:linear-gradient(135deg,#1c1917,#374151);color:white;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px}
        .dm-add-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.2)}
        .dm-cart-btn{background:#d97706;color:white;border:none;border-radius:12px;padding:14px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .dm-cart-btn:hover{background:#b45309}

        .empty{text-align:center;padding:64px 20px;color:#94a3b8}
        .main{max-width:1280px;margin:0 auto;padding:0 28px 48px}

        @media(max-width:1100px){.prod-grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}}
        @media(max-width:768px){.controls{flex-wrap:wrap}.main{padding:0 16px 40px}.topnav{padding:0 16px}.prod-grid{grid-template-columns:repeat(2,1fr);gap:12px}}
        @media(max-width:480px){.prod-grid{grid-template-columns:repeat(2,1fr);gap:10px}}
      `}</style>

      {/* ── NAV ── */}
      <nav className="topnav">
        <div className="nav-brand" onClick={() => router.push('/')}>
          <div className="nav-logo">🪑</div>
          <span className="nav-brand-name">FurniCalc</span>
        </div>
        <div className="nav-sep" />
        <span className="nav-title">🪵 Материалын сан</span>

        <div className="nav-r">
          {/* Сагс */}
         <button className="cart-btn" onClick={() => router.push('/cart')}>
  🛒 Сагс
  {count > 0 && <span className="cart-count">{count}</span>}
</button>

          {authUser ? (
            <button
              onClick={() => router.push('/my-orders')}
              style={{ background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              📦 Миний захиалга
            </button>
          ) : (
            <button
              onClick={() => router.push('/auth/login')}
              style={{ background: 'white', color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d97706'; (e.currentTarget as HTMLElement).style.color = '#d97706'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#0f172a'; }}
            >
              Нэвтрэх
            </button>
          )}
        </div>
      </nav>

      <div className="main">
        {/* ── HERO ── */}
        <div style={{
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e2e8f0'
}}>
  
</div>
            

        {/* ── CONTROLS ── */}
        <div className="controls">
          <div className="search-box">
            <span style={{ fontSize: 16, color: '#94a3b8' }}>🔍</span>
            <input
              placeholder="Нэр, код, төрлөөр хайх..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            )}
          </div>
          <select className="sort-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="default">Эрэмбэлэх</option>
            <option value="price-asc">Үнэ: бага → их</option>
            <option value="price-desc">Үнэ: их → бага</option>
            <option value="new">Шинэ эхэндээ</option>
          </select>
          <div className="view-toggle">
            <button className={`vt-btn ${viewMode === 'grid' ? 'on' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
            <button className={`vt-btn ${viewMode === 'list' ? 'on' : ''}`} onClick={() => setViewMode('list')}>☰</button>
          </div>
        </div>

        {/* ── CATEGORY TABS ── */}
        <div className="cat-tabs">
          <button
            className={`ct ${activeCat === 'all' ? 'on' : ''}`}
            onClick={() => { setActiveCat('all'); setActiveType(null); }}
          >
            Бүгд ({materials.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`ct ${activeCat === cat.id ? 'on' : ''}`}
              onClick={() => { setActiveCat(cat.id); setActiveType(null); }}
            >
              {cat.name} ({materials.filter(m => m.material_types?.material_categories?.id === cat.id).length})
            </button>
          ))}
        </div>

        {/* ── TYPE FILTER (дэд төрөл) ── */}
        {activeCat !== 'all' && (() => {
          const cat = categories.find(c => c.id === activeCat);
          if (!cat?.material_types?.length) return null;
          return (
            <div className="type-row">
              <button className={`tp ${!activeType ? 'on' : ''}`} onClick={() => setActiveType(null)}>
                Бүгд
              </button>
              {cat.material_types.map(t => (
                <button key={t.id} className={`tp ${activeType === t.id ? 'on' : ''}`} onClick={() => setActiveType(activeType === t.id ? null : t.id)}>
                  {t.name}
                </button>
              ))}
            </div>
          );
        })()}

        {/* ── RESULT BAR ── */}
        <div className="result-bar">
          <span className="result-count">
            <strong>{filtered.length}</strong> материал олдлоо
            {search && ` — "${search}"`}
          </span>
          {(search || activeCat !== 'all' || activeType) && (
            <button
              onClick={() => { setSearch(''); setActiveCat('all'); setActiveType(null); }}
              style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              × Шүүлт цэвэрлэх
            </button>
          )}
        </div>

        {/* ── MATERIALS ── */}
        {loading ? (
          <div className="prod-grid">
            {Array.from({ length: 8 }).map((_, i) => <Skel key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Материал олдсонгүй</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Хайлтаа өөрчилнө үү</div>
            <button onClick={() => { setSearch(''); setActiveCat('all'); setActiveType(null); }}
              style={{ background: '#1c1917', color: 'white', border: 'none', borderRadius: 11, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Бүгдийг харах
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="prod-grid">
            {filtered.map(m => {
              const isAdded = addedIds.has(m.id);
              return (
                <div key={m.id} className="prod-card" onClick={() => { setDetailMat(m); setDetailQty(1); }}>
                  <MatImg m={m} />
                  <div className="prod-body">
                    <div className="prod-code">{m.code}</div>
                    <div className="prod-name">{m.name}</div>
                    <div className="prod-meta">
                      {m.material_types?.material_categories?.name} · {m.material_types?.name}
                      {m.thickness ? ` · ${m.thickness}мм` : ''}
                    </div>
                    <div className="prod-bottom">
                      <div>
                        <div className="prod-price">₮{Number(m.price).toLocaleString()}</div>
                        <div className="prod-unit">/ {m.unit}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="stock-badge" style={{
                          background: Number(m.stock) > 20 ? '#dcfce7' : Number(m.stock) > 5 ? '#fef9c3' : '#fee2e2',
                          color: Number(m.stock) > 20 ? '#166534' : Number(m.stock) > 5 ? '#92400e' : '#991b1b',
                        }}>
                          {Number(m.stock) > 20 ? 'Байгаа' : Number(m.stock) > 0 ? 'Бага' : 'Дуусаж'}
                        </span>
                        <button
                          className={`add-btn ${isAdded ? 'added' : ''}`}
                          onClick={e => handleAddToCart(e, m)}
                          title="Сагсанд нэмэх"
                        >
                          {isAdded ? '✓' : '🛒'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div>
            {filtered.map(m => {
              const isAdded = addedIds.has(m.id);
              return (
                <div key={m.id} className="list-row" onClick={() => { setDetailMat(m); setDetailQty(1); }}>
                  <div className="list-img">
                    <MatImg m={m} h={60} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <span className="prod-code" style={{ margin: 0 }}>{m.code}</span>
                      <span className="stock-badge" style={{
                        background: Number(m.stock) > 20 ? '#dcfce7' : '#fef9c3',
                        color: Number(m.stock) > 20 ? '#166534' : '#92400e',
                      }}>
                        {Number(m.stock) > 20 ? 'Байгаа' : 'Бага'}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {m.material_types?.material_categories?.name} · {m.material_types?.name}
                      {m.thickness ? ` · ${m.thickness}мм` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>₮{Number(m.price).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>/ {m.unit}</div>
                  </div>
                  <button
                    className={`list-add-btn ${isAdded ? 'added' : ''}`}
                    onClick={e => handleAddToCart(e, m)}
                  >
                    {isAdded ? '✓' : '🛒'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {detailMat && (
        <div className="modal-bg" onClick={() => setDetailMat(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            {/* Зураг */}
            <div className="dm-img">
              <MatImg m={detailMat} h={260} />
              <button className="dm-close" onClick={() => setDetailMat(null)}>×</button>
            </div>

            <div className="dm-body">
              <div className="dm-code">{detailMat.code}</div>
              <div className="dm-name">{detailMat.name}</div>
              <div className="dm-type">
                {detailMat.material_types?.material_categories?.name} → {detailMat.material_types?.name}
              </div>

              <div className="dm-info-grid">
                <div className="dm-info-item">
                  <div className="dm-info-label">Үнэ</div>
                  <div className="dm-info-val">₮{Number(detailMat.price).toLocaleString()}</div>
                </div>
                <div className="dm-info-item">
                  <div className="dm-info-label">Нэгж</div>
                  <div className="dm-info-val">{detailMat.unit}</div>
                </div>
                {detailMat.thickness && (
                  <div className="dm-info-item">
                    <div className="dm-info-label">Зузаан</div>
                    <div className="dm-info-val">{detailMat.thickness}мм</div>
                  </div>
                )}
                <div className="dm-info-item">
                  <div className="dm-info-label">Үлдэгдэл</div>
                  <div className="dm-info-val" style={{ color: Number(detailMat.stock) > 0 ? '#059669' : '#ef4444' }}>
                    {Number(detailMat.stock)} {detailMat.unit}
                  </div>
                </div>
              </div>

              {/* Тоо хэмжээ */}
              <div className="dm-qty-row">
                <span className="dm-qty-label">Тоо хэмжээ</span>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => setDetailQty(q => Math.max(0.1, parseFloat((q - 0.5).toFixed(1))))}>−</button>
                  <input
                    className="qty-inp"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={detailQty}
                    onChange={e => setDetailQty(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  />
                  <button className="qty-btn" onClick={() => setDetailQty(q => parseFloat((q + 0.5).toFixed(1)))}>+</button>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#d97706', marginLeft: 8 }}>
                  ₮{(detailMat.price * detailQty).toLocaleString()}
                </span>
              </div>

              {/* Товчнууд */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="dm-add-btn"
                  onClick={() => {
                    addToCart({
                      id: detailMat.id, code: detailMat.code, name: detailMat.name,
                      unit: detailMat.unit, price: detailMat.price,
                      image_url: detailMat.material_images?.find(i => i.is_primary)?.url || detailMat.material_images?.[0]?.url || detailMat.image_url,
                      type_name: detailMat.material_types?.name,
                    }, detailQty);
                    setDetailMat(null);
                  }}
                >
                  🛒 Сагсанд нэмэх
                </button>
                <button className="dm-cart-btn" onClick={() => router.push('/checkout')}>
  Захиалга хийх →
</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      <CartToast toasts={toasts} onNavigateCart={() => router.push('/cart')} />
    </>
  );
}