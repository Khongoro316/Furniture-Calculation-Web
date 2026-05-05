'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MATERIALS = [
  { id:1, code:'LDSP-WH-18', name:'Цагаан ЛДСП 18мм', cat:'Хавтан', type:'ЛДСП', unit:'м²', thick:'18мм', price:28000, oldPrice:32000, stock:50, isNew:false, img:'🪵' },
  { id:2, code:'LDSP-BR-18', name:'Бор ЛДСП 18мм', cat:'Хавтан', type:'ЛДСП', unit:'м²', thick:'18мм', price:28000, oldPrice:null, stock:30, isNew:false, img:'🪵' },
  { id:3, code:'MDF-WH-16', name:'Цагаан МДФ 16мм', cat:'Хавтан', type:'МДФ', unit:'м²', thick:'16мм', price:32000, oldPrice:35000, stock:15, isNew:true, img:'🪵' },
  { id:4, code:'HDF-WH-4', name:'Цагаан HDF 4мм', cat:'Хавтан', type:'HDF', unit:'м²', thick:'4мм', price:8000, oldPrice:null, stock:40, isNew:false, img:'🪵' },
  { id:5, code:'ABS-WH-04', name:'Цагаан ABS 0.4мм', cat:'Ирмэг наалт', type:'ABS ирмэг', unit:'м', thick:'—', price:800, oldPrice:null, stock:200, isNew:false, img:'📏' },
  { id:6, code:'HNG-BLU-35', name:'Blum нугас 35мм', cat:'Тавилгын тоноглол', type:'Нугас', unit:'ш', thick:'—', price:4500, oldPrice:5000, stock:500, isNew:true, img:'🔩' },
  { id:7, code:'HDL-SS-128', name:'Ган бариул 128мм', cat:'Тавилгын тоноглол', type:'Бариул', unit:'ш', thick:'—', price:2800, oldPrice:null, stock:300, isNew:true, img:'🔧' },
];

export default function MaterialsPagePublic() {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState('Бүгд');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      try {
        setAuthUser(JSON.parse(u));
      } catch {}
    }
  }, []);

  const cats = ['Бүгд', ...Array.from(new Set(MATERIALS.map(m => m.cat)))];

  let filtered = MATERIALS
    .filter(m => activeCat === 'Бүгд' || m.cat === activeCat)
    .filter(m =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase())
    );

  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'new') filtered = [...filtered].filter(m => m.isNew);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8f9fb;color:#1c1917}
        .page{min-height:100vh}
        .topnav{background:white;border-bottom:1px solid #f0f0f0;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 8px rgba(0,0,0,0.05)}
        .back-btn{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#6b7280;cursor:pointer;border:none;background:none;font-family:inherit;padding:7px 12px;border-radius:8px;transition:all 0.15s}
        .back-btn:hover{background:#f5f5f7;color:#1c1917}
        .main{max-width:1200px;margin:0 auto;padding:28px 24px}
        .page-hero{background:linear-gradient(135deg,#1c1917,#292524);border-radius:20px;padding:36px 40px;margin-bottom:24px;position:relative;overflow:hidden}
        .page-hero::before{content:'';position:absolute;top:-60px;right:-60px;width:280px;height:280px;background:radial-gradient(circle,rgba(217,119,6,0.3),transparent 70%);border-radius:50%}
        .ph-eyebrow{font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px}
        .ph-title{font-size:28px;font-weight:800;color:white;margin-bottom:8px;letter-spacing:-0.02em}
        .ph-sub{font-size:14px;color:rgba(255,255,255,0.6);position:relative;z-index:1}
        .controls{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
        .search-box{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;background:white;border:1.5px solid #e5e7eb;border-radius:11px;padding:9px 14px;transition:all 0.15s}
        .search-box:focus-within{border-color:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .search-box input{background:none;border:none;outline:none;font-size:13px;color:#1c1917;width:100%;font-family:inherit}
        .sort-sel{border:1.5px solid #e5e7eb;border-radius:11px;padding:9px 14px;font-size:13px;font-weight:600;color:#374151;background:white;outline:none;cursor:pointer;font-family:inherit}
        .cat-filter{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
        .cf{font-size:12px;font-weight:600;padding:6px 16px;border-radius:100px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;color:#6b7280;font-family:inherit;transition:all 0.15s}
        .cf.on{background:#1c1917;color:white;border-color:#1c1917}
        .count{font-size:13px;color:#9ca3af;margin-bottom:14px}
        .prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
        .prod-card{background:white;border:1.5px solid #f3f4f6;border-radius:16px;overflow:hidden;cursor:pointer;transition:all 0.2s}
        .prod-card:hover{border-color:#e0e0e0;box-shadow:0 8px 28px rgba(0,0,0,0.08);transform:translateY(-3px)}
        .prod-img{height:160px;background:linear-gradient(135deg,#f9fafb,#f3f4f6);display:flex;align-items:center;justify-content:center;font-size:56px;position:relative}
        .prod-badge{position:absolute;top:10px;left:10px;font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px}
        .badge-new{background:#1c1917;color:white}
        .badge-sale{background:#ef4444;color:white}
        .prod-body{padding:14px}
        .prod-code{font-family:monospace;font-size:11px;color:#d97706;background:#fef3c7;padding:3px 8px;border-radius:6px;display:inline-block;margin-bottom:8px}
        .prod-name{font-size:13px;font-weight:700;color:#1c1917;margin-bottom:4px;line-height:1.4}
        .prod-meta{font-size:11px;color:#9ca3af;margin-bottom:10px}
        .prod-bottom{display:flex;align-items:center;justify-content:space-between}
        .prod-price{font-size:17px;font-weight:800;color:#1c1917}
        .prod-old{font-size:11px;color:#9ca3af;text-decoration:line-through;margin-left:4px}
        .prod-unit{font-size:11px;color:#9ca3af}
        .prod-stock{font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px}
        .empty{text-align:center;padding:60px 0;color:#9ca3af}
        @media(max-width:600px){.controls{flex-direction:column}.prod-grid{grid-template-columns:1fr 1fr}}
      `}</style>

      <div className="page">
        <nav className="topnav">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button className="back-btn" onClick={() => router.push('/')}>← Нүүр хуудас</button>
            <span style={{ color:'#e5e7eb' }}>|</span>
            <span style={{ fontSize:14, fontWeight:700, color:'#1c1917' }}>🪵 Материалын сан</span>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => router.push('/cart')}
              style={{ background:'#f5f5f7', color:'#374151', border:'none', borderRadius:9, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
            >
              🛒 Сагс
            </button>

            {authUser ? (
              <button
                onClick={() => router.push('/profile')}
                style={{ background:'#f5f5f7', color:'#374151', border:'none', borderRadius:9, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
              >
                👤 {authUser.first_name}
              </button>
            ) : (
              <button
                onClick={() => router.push('/auth/login')}
                style={{ background:'#1c1917', color:'white', border:'none', borderRadius:9, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
              >
                Нэвтрэх
              </button>
            )}
          </div>
        </nav>

        <div className="main">
          <div className="page-hero">
            <div className="ph-eyebrow">🪵 МАТЕРИАЛЫН САН</div>
            <h1 className="ph-title">Бүх материал нэг дороос</h1>
            <p className="ph-sub">ЛДСП, МДФ, HDF, ABS ирмэг, нугас, бариул — үнэ болон үлдэгдлийг харна уу</p>
          </div>

          <div className="controls">
            <div className="search-box">
              <span style={{ fontSize:15, color:'#9ca3af' }}>🔍</span>
              <input placeholder="Нэр, код хайх..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <select className="sort-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="default">Эрэмбэлэх</option>
              <option value="price-asc">Үнэ: бага → их</option>
              <option value="price-desc">Үнэ: их → бага</option>
              <option value="new">Зөвхөн шинэ</option>
            </select>
          </div>

          <div className="cat-filter">
            {cats.map(c => (
              <button key={c} className={`cf ${activeCat === c ? 'on' : ''}`} onClick={() => setActiveCat(c)}>
                {c}
              </button>
            ))}
          </div>

          <div className="count">{filtered.length} материал олдлоо</div>

          {filtered.length === 0 ? (
            <div className="empty">
              <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:15, fontWeight:600, color:'#374151', marginBottom:6 }}>Материал олдсонгүй</div>
              <div style={{ fontSize:13 }}>Хайлтаа өөрчилнө үү</div>
            </div>
          ) : (
            <div className="prod-grid">
              {filtered.map(m => (
                <div
                  key={m.id}
                  className="prod-card"
                  onClick={() => router.push(`/materials-page/${m.id}`)}
                >
                  <div className="prod-img">
                    <span>{m.img}</span>
                    {m.isNew && <span className="prod-badge badge-new">ШИНЭ</span>}
                    {m.oldPrice && <span className="prod-badge badge-sale" style={{ left:'auto', right:10 }}>ХЯМДРАЛ</span>}
                  </div>

                  <div className="prod-body">
                    <div className="prod-code">{m.code}</div>
                    <div className="prod-name">{m.name}</div>
                    <div className="prod-meta">{m.cat} · {m.type} {m.thick !== '—' ? `· ${m.thick}` : ''}</div>

                    <div className="prod-bottom">
                      <div>
                        <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                          <span className="prod-price">₮{m.price.toLocaleString()}</span>
                          {m.oldPrice && <span className="prod-old">₮{m.oldPrice.toLocaleString()}</span>}
                        </div>
                        <span className="prod-unit">/ {m.unit}</span>
                      </div>

                      <span
                        className="prod-stock"
                        style={{
                          background:m.stock > 50 ? '#dcfce7' : m.stock > 10 ? '#fef9c3' : '#fee2e2',
                          color:m.stock > 50 ? '#166534' : m.stock > 10 ? '#92400e' : '#991b1b'
                        }}
                      >
                        {m.stock} {m.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}