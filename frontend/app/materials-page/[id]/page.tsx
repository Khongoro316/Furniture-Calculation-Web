'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../lib/axios';
import { useCart } from '../../../hooks/useCart';
import CartToast from '../../../components/CartToast';

interface Material {
  id: number; code: string; name: string;
  unit: string; price: number; stock: number;
  thickness?: number; sheet_length?: number; sheet_width?: number;
  description?: string; is_active: boolean;
  material_types?: { id: number; name: string; material_categories?: { name: string } };
  material_images?: { id: number; url: string; is_primary: boolean; sort_order: number }[];
}

// ── Зурагны visual ──────────────────────────────────────────────────────────
const getVisual = (typeName = '') => {
  const t = typeName.toLowerCase();
  if (t.includes('лдсп') || t.includes('ldsp')) return { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#92400e' };
  if (t.includes('мдф') || t.includes('mdf')) return { bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', color: '#14532d' };
  if (t.includes('hdf')) return { bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', color: '#1e3a8a' };
  if (t.includes('abs') || t.includes('ирмэг')) return { bg: 'linear-gradient(135deg,#fdf2f8,#f5d0fe)', color: '#701a75' };
  return { bg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', color: '#374151' };
};

export default function MaterialDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { addToCart, toasts } = useCart();

  const [mat, setMat] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState<Material[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/api/materials/${id}`)
      .then(r => {
        setMat(r.data);
        // Холбоотой материал татах
        if (r.data.material_types?.id) {
          api.get(`/api/materials?type_id=${r.data.material_types.id}`)
            .then(r2 => setRelated((r2.data || []).filter((m: Material) => m.id !== Number(id)).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(() => router.push('/materials-page'))
      .finally(() => setLoading(false));
  }, [id]);

  // Гар дарах keyboard navigation
  useEffect(() => {
    if (!mat) return;
    const imgs = mat.material_images || [];
    if (imgs.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setImgIdx(p => (p - 1 + imgs.length) % imgs.length);
      if (e.key === 'ArrowRight') setImgIdx(p => (p + 1) % imgs.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mat]);

  const handleAdd = () => {
    if (!mat) return;
    const imgs = mat.material_images || [];
    addToCart({
      id: mat.id, code: mat.code, name: mat.name,
      unit: mat.unit, price: mat.price,
      image_url: imgs.find(i => i.is_primary)?.url || imgs[0]?.url,
      type_name: mat.material_types?.name,
    }, qty);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!mat) return null;

  const imgs = mat.material_images || [];
  const hasImg = imgs.length > 0;
  const v = getVisual(mat.material_types?.name);
  const totalPrice = mat.price * qty;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f1f5f9;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}

        .topnav{background:white;border-bottom:1px solid #e2e8f0;height:62px;display:flex;align-items:center;padding:0 28px;position:sticky;top:0;z-index:50;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .back{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#64748b;border:none;background:none;font-family:inherit;padding:7px 11px;border-radius:8px;cursor:pointer;transition:all 0.15s}
        .back:hover{background:#f1f5f9;color:#0f172a}
        .breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8;margin-left:8px}
        .breadcrumb a{color:#64748b;cursor:pointer;text-decoration:none}
        .breadcrumb a:hover{color:#d97706}
        .breadcrumb span{color:#94a3b8}

        .main{max-width:1100px;margin:0 auto;padding:24px 20px 60px}
        .layout{display:grid;grid-template-columns:1fr 400px;gap:24px;align-items:start;animation:fadeUp 0.3s ease}

        /* IMAGE SECTION */
        .img-main{border-radius:18px;overflow:hidden;background:white;border:1px solid #e2e8f0;position:relative;aspect-ratio:4/3;cursor:zoom-in}
        .img-main img{width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease}
        .img-main:hover img{transform:scale(1.04)}
        .img-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
        .img-nav{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.12);backdrop-filter:blur(4px)}
        .img-nav:hover{background:white;box-shadow:0 4px 12px rgba(0,0,0,0.18)}
        .img-nav.prev{left:10px}
        .img-nav.next{right:10px}
        .img-counter{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.55);color:white;font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;backdrop-filter:blur(4px)}
        .img-dots{display:flex;gap:5px;justify-content:center;margin-top:10px}
        .img-dot{width:6px;height:6px;border-radius:50%;background:#e2e8f0;cursor:pointer;transition:all 0.2s}
        .img-dot.on{width:18px;border-radius:3px;background:#d97706}
        .thumbnails{display:flex;gap:8px;margin-top:10px;overflow-x:auto;scrollbar-width:none}
        .thumbnails::-webkit-scrollbar{display:none}
        .thumb{width:68px;height:68px;border-radius:10px;overflow:hidden;border:2px solid #e2e8f0;cursor:pointer;flex-shrink:0;transition:border-color 0.15s}
        .thumb.on{border-color:#d97706}
        .thumb img{width:100%;height:100%;object-fit:cover}

        /* INFO SECTION */
        .info-panel{background:white;border:1px solid #e2e8f0;border-radius:18px;padding:24px;position:sticky;top:82px}
        .mat-code{font-family:monospace;font-size:12px;color:#d97706;font-weight:700;background:#fef3c7;padding:3px 10px;border-radius:5px;display:inline-block;margin-bottom:12px}
        .mat-name{font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:6px;line-height:1.2}
        .mat-type{font-size:13px;color:#64748b;margin-bottom:20px;display:flex;align-items:center;gap:6px}
        .mat-price{font-size:32px;font-weight:800;color:#0f172a;margin-bottom:4px}
        .mat-unit{font-size:13px;color:#94a3b8}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0}
        .info-item{background:#f8fafc;border-radius:11px;padding:12px 14px}
        .info-lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px}
        .info-val{font-size:14px;font-weight:700;color:#0f172a}
        .divider{height:1px;background:#f1f5f9;margin:18px 0}
        .qty-section{display:flex;align-items:center;gap:12px;margin-bottom:18px}
        .qty-lbl{font-size:13px;font-weight:600;color:#374151}
        .qty-ctrl{display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:11px;overflow:hidden}
        .qty-b{width:36px;height:36px;border:none;background:white;cursor:pointer;font-size:18px;font-weight:700;color:#374151;display:flex;align-items:center;justify-content:center;transition:background 0.12s}
        .qty-b:hover{background:#f1f5f9}
        .qty-v{width:48px;text-align:center;font-size:14px;font-weight:700;border:none;border-left:1.5px solid #e2e8f0;border-right:1.5px solid #e2e8f0;padding:6px 0;font-family:inherit;background:white;outline:none}
        .qty-total{font-size:18px;font-weight:800;color:#d97706;margin-left:auto}
        .btn-cart{width:100%;background:linear-gradient(135deg,#1c1917,#374151);color:white;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px}
        .btn-cart:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.2)}
        .btn-order{width:100%;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px}
        .btn-order:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(217,119,6,0.4)}

        /* RELATED */
        .related-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .rel-card{background:white;border:1.5px solid #f3f4f6;border-radius:14px;overflow:hidden;cursor:pointer;transition:all 0.2s}
        .rel-card:hover{border-color:#e0e0e0;box-shadow:0 6px 20px rgba(0,0,0,0.07);transform:translateY(-2px)}
        .rel-img{height:100px;overflow:hidden}
        .rel-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s}
        .rel-card:hover .rel-img img{transform:scale(1.05)}
        .rel-body{padding:10px 12px}
        .rel-name{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .rel-price{font-size:13px;font-weight:800;color:#d97706}

        @media(max-width:900px){.layout{grid-template-columns:1fr}.info-panel{position:static}.related-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:500px){.main{padding:16px}.related-grid{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <nav className="topnav">
        <button className="back" onClick={() => router.push('/materials-page')}>← Буцах</button>
        <div className="breadcrumb">
          <a onClick={() => router.push('/')}>Нүүр</a>
          <span>/</span>
          <a onClick={() => router.push('/materials-page')}>Материал</a>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>{mat.code}</span>
        </div>
      </nav>

      <div className="main">
        <div className="layout">
          {/* ── ЗҮҮН: Зурагнууд ── */}
          <div>
            {/* Гол зураг */}
            <div className="img-main">
              {hasImg ? (
                <img src={imgs[imgIdx].url} alt={mat.name} />
              ) : (
                <div className="img-ph" style={{ background: v.bg }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 12, opacity: 0.6 }}>🪵</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: v.color, background: 'rgba(255,255,255,0.85)', padding: '6px 18px', borderRadius: 20 }}>
                      {mat.material_types?.name}
                    </div>
                    {mat.thickness && (
                      <div style={{ fontSize: 13, color: v.color, marginTop: 8, background: 'rgba(255,255,255,0.7)', padding: '3px 12px', borderRadius: 12, display: 'inline-block' }}>
                        {mat.thickness}мм
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Навигацийн товчнууд */}
              {imgs.length > 1 && (
                <>
                  <button className="img-nav prev" onClick={() => setImgIdx(p => (p - 1 + imgs.length) % imgs.length)}>‹</button>
                  <button className="img-nav next" onClick={() => setImgIdx(p => (p + 1) % imgs.length)}>›</button>
                  <div className="img-counter">{imgIdx + 1} / {imgs.length}</div>
                </>
              )}
            </div>

            {/* Dots */}
            {imgs.length > 1 && (
              <div className="img-dots">
                {imgs.map((_, i) => (
                  <div key={i} className={`img-dot ${imgIdx === i ? 'on' : ''}`} onClick={() => setImgIdx(i)} />
                ))}
              </div>
            )}

            {/* Thumbnail жагсаалт */}
            {imgs.length > 1 && (
              <div className="thumbnails">
                {imgs.map((img, i) => (
                  <div key={i} className={`thumb ${imgIdx === i ? 'on' : ''}`} onClick={() => setImgIdx(i)}>
                    <img src={img.url} alt={`${mat.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {/* Дэлгэрэнгүй мэдээлэл хэсэг */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px', marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>📋 Дэлгэрэнгүй мэдээлэл</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { l: 'Ангилал',   v: mat.material_types?.material_categories?.name || '—' },
                  { l: 'Төрөл',     v: mat.material_types?.name || '—' },
                  { l: 'Код',       v: mat.code },
                  { l: 'Нэгж',      v: mat.unit },
                  ...(mat.thickness ? [{ l: 'Зузаан', v: `${mat.thickness}мм` }] : []),
                  ...(mat.sheet_length ? [{ l: 'Хавтангийн урт', v: `${mat.sheet_length}мм` }] : []),
                  ...(mat.sheet_width ? [{ l: 'Хавтангийн өргөн', v: `${mat.sheet_width}мм` }] : []),
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{r.l}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: r.l === 'Код' ? 'monospace' : 'inherit' }}>{r.v}</span>
                  </div>
                ))}
              </div>
              {mat.description && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                  {mat.description}
                </div>
              )}
            </div>
          </div>

          {/* ── БАРУУН: Мэдээлэл + Захиалах ── */}
          <div className="info-panel">
            <div className="mat-code">{mat.code}</div>
            <div className="mat-name">{mat.name}</div>
            <div className="mat-type">
              <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                {mat.material_types?.material_categories?.name}
              </span>
              <span style={{ color: '#94a3b8' }}>→</span>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                {mat.material_types?.name}
              </span>
            </div>

            <div className="mat-price">₮{Number(mat.price).toLocaleString()}</div>
            <div className="mat-unit">нэгж үнэ / {mat.unit}</div>

            <div className="info-grid">
              {mat.thickness && (
                <div className="info-item">
                  <div className="info-lbl">Зузаан</div>
                  <div className="info-val">{mat.thickness}мм</div>
                </div>
              )}
              <div className="info-item">
                <div className="info-lbl">Үлдэгдэл</div>
                <div className="info-val" style={{ color: Number(mat.stock) > 10 ? '#059669' : Number(mat.stock) > 0 ? '#d97706' : '#ef4444' }}>
                  {Number(mat.stock)} {mat.unit}
                </div>
              </div>
              <div className="info-item">
                <div className="info-lbl">Нэгж</div>
                <div className="info-val">{mat.unit}</div>
              </div>
              <div className="info-item">
                <div className="info-lbl">Төлөв</div>
                <div className="info-val">
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: mat.is_active ? '#dcfce7' : '#fee2e2', color: mat.is_active ? '#166534' : '#991b1b' }}>
                    {mat.is_active ? 'Байгаа' : 'Байхгүй'}
                  </span>
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Тоо хэмжээ */}
            <div className="qty-section">
              <span className="qty-lbl">Тоо хэмжээ</span>
              <div className="qty-ctrl">
                <button className="qty-b" onClick={() => setQty(q => Math.max(0.1, parseFloat((q - 0.5).toFixed(1))))}>−</button>
                <input className="qty-v" type="number" min="0.1" step="0.1" value={qty}
                  onChange={e => setQty(Math.max(0.1, parseFloat(e.target.value) || 0.1))} />
                <button className="qty-b" onClick={() => setQty(q => parseFloat((q + 0.5).toFixed(1)))}>+</button>
              </div>
              <div className="qty-total">₮{totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>

            {/* Товчнууд */}
            <button className="btn-cart" onClick={handleAdd}>
              🛒 Сагсанд нэмэх
            </button>
            <button className="btn-order" onClick={() => {
              handleAdd();
              router.push('/checkout');
            }}>
              ✅ Захиалга хийх →
            </button>

            {/* Тооцоолол руу */}
            <div style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 11, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>📐 Хэдий хэмжээ хэрэгтэйгээ мэдэхгүй байна уу?</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Тооцоолол хийж яг хэрэгцээт хэмжээгээ тодорхойлоорой</div>
              </div>
              <button onClick={() => router.push('/calculate')}
                style={{ background: 'white', color: '#d97706', border: '1.5px solid #fde68a', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}>
                Тооцоолол →
              </button>
            </div>
          </div>
        </div>

        {/* ── Холбоотой материал ── */}
        {related.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>🔗 Ижил төрлийн материал</div>
            <div className="related-grid">
              {related.map(r => {
                const rImgs = r.material_images || [];
                const rUrl = rImgs.find(i => i.is_primary)?.url || rImgs[0]?.url;
                const rv = getVisual(r.material_types?.name);
                return (
                  <div key={r.id} className="rel-card" onClick={() => { router.push(`/materials-page/${r.id}`); setImgIdx(0); }}>
                    <div className="rel-img">
                      {rUrl ? <img src={rUrl} alt={r.name} /> :
                        <div style={{ width: '100%', height: '100%', background: rv.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🪵</div>}
                    </div>
                    <div className="rel-body">
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#d97706', marginBottom: 2 }}>{r.code}</div>
                      <div className="rel-name">{r.name}</div>
                      <div className="rel-price">₮{Number(r.price).toLocaleString()}<span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>/{r.unit}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <CartToast toasts={toasts} onNavigateCart={() => router.push('/checkout')} />
    </>
  );
}