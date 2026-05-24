'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/axios';

const getVisual = (catName = '', typeName = '') => {
  const t = typeName.toLowerCase();
  if (t.includes('лдсп') || t.includes('ldsp')) return { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#92400e', p: 'grid' };
  if (t.includes('мдф') || t.includes('mdf')) return { bg: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)', color: '#14532d', p: 'stripe' };
  if (t.includes('hdf')) return { bg: 'linear-gradient(135deg,#eff6ff,#bfdbfe)', color: '#1e3a8a', p: 'dot' };
  if (t.includes('abs') || catName.toLowerCase().includes('ирмэг')) return { bg: 'linear-gradient(135deg,#fdf2f8,#f5d0fe)', color: '#701a75', p: 'band' };
  return { bg: 'linear-gradient(135deg,#f8fafc,#e2e8f0)', color: '#374151', p: 'circle' };
};

const MatVisual = ({ m, h = 160 }: { m: any; h?: number }) => {
  const imgs = m.material_images || [];
  const primary = imgs.find((i: any) => i.is_primary) || imgs[0];
  if (primary?.url) {
    return (
      <div style={{ height: h, overflow: 'hidden', position: 'relative' }}>
        <img src={primary.url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {imgs.length > 1 && <div style={{ position: 'absolute', bottom: 7, right: 7, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>+{imgs.length - 1}</div>}
      </div>
    );
  }
  const v = getVisual(m.material_types?.material_categories?.name, m.material_types?.name);
  return (
    <div style={{ height: h, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} viewBox="0 0 200 160">
        {v.p === 'grid' && [20,40,60,80,100,120,140,160,180].map(x => <line key={x} x1={x} y1="0" x2={x} y2="160" stroke={v.color} strokeWidth="0.5" />)}
        {v.p === 'stripe' && [0,20,40,60,80,100,120,140,160,180,200].map((x,i) => <line key={i} x1={x} y1="0" x2={x-30} y2="160" stroke={v.color} strokeWidth="0.8" />)}
        {v.p === 'dot' && Array.from({ length: 8 }).map((_,r) => Array.from({ length: 10 }).map((_,c) => <circle key={`${r}${c}`} cx={c*22+11} cy={r*22+11} r="3" fill={v.color} />))}
        {v.p === 'band' && [10,30,50,70,90,110,130,150].map(y => <rect key={y} x="0" y={y} width="200" height="8" fill={v.color} rx="2" />)}
      </svg>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: v.color, background: 'rgba(255,255,255,0.85)', padding: '4px 12px', borderRadius: 20 }}>{m.material_types?.name || '—'}</div>
        {m.thickness && <div style={{ fontSize: 10, color: v.color, marginTop: 5, fontWeight: 600, background: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>{Number(m.thickness)}мм</div>}
      </div>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [profileDrop, setProfileDrop] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matDropOpen, setMatDropOpen] = useState(false);
  const matTimer = useRef<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) try { setAuthUser(JSON.parse(u)); } catch {}
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/materials').catch(() => ({ data: [] })),
      api.get('/api/materials/categories').catch(() => ({ data: [] })),
    ]).then(([m, c]) => {
      setMaterials(m.data || []);
      setCategories(c.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const openDrop = () => { clearTimeout(matTimer.current); setMatDropOpen(true); };
  const closeDrop = () => { matTimer.current = setTimeout(() => setMatDropOpen(false), 180); };
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuthUser(null);
    setProfileDrop(false);
  };

  const featMat = materials.slice(0, 4);
  const Skel = () => (
    <div style={{ background: 'white', border: '1.5px solid #f3f4f6', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ height: 160, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: 14 }}>{[60,90,50,70].map((w,i) => <div key={i} style={{ height: i===1?14:10, width:`${w}%`, background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:6, marginBottom:8 }} />)}</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Plus Jakarta Sans',sans-serif;color:#1c1917;background:#fff;-webkit-font-smoothing:antialiased}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        .header{background:white;border-bottom:1px solid #f0f0f0;padding:0 32px;position:sticky;top:0;z-index:200;transition:box-shadow .3s}
        .header.up{box-shadow:0 2px 16px rgba(0,0,0,.08)}
        .header-inner{max-width:1400px;margin:0 auto;height:68px;display:flex;align-items:center}
        .h-brand{display:flex;align-items:center;gap:10px;cursor:pointer;flex-shrink:0;margin-right:32px}
        .h-logo{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:20px}
        .h-name{font-size:19px;font-weight:800;color:#1c1917;letter-spacing:-.02em}
        .nav-links{display:flex;align-items:stretch;height:68px}
        .nav-link{display:flex;align-items:center;gap:4px;padding:0 18px;font-size:14px;font-weight:600;color:#4b5563;cursor:pointer;border:none;background:none;font-family:inherit;position:relative;transition:color .15s;white-space:nowrap}
        .nav-link:hover,.nav-link.open{color:#1c1917}
        .nav-link::after{content:'';position:absolute;bottom:0;left:18px;right:18px;height:2px;background:#d97706;transform:scaleX(0);transition:transform .2s;transform-origin:center}
        .nav-link:hover::after,.nav-link.open::after{transform:scaleX(1)}
        .nav-chev{font-size:10px;transition:transform .2s}
        .nav-link.open .nav-chev{transform:rotate(180deg)}
        .mat-wrap{position:relative;display:flex;align-items:stretch}
        .mat-drop{position:absolute;top:68px;left:0;background:white;border:1px solid #f0f0f0;border-top:2px solid #d97706;box-shadow:0 16px 48px rgba(0,0,0,.12);z-index:199;animation:dropIn .18s ease;min-width:560px}
        .md-inner{padding:20px 22px;display:flex;gap:24px;flex-wrap:wrap}
        .md-col{min-width:140px}
        .md-cat{font-size:11px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:7px;border-bottom:1.5px solid #f3f4f6}
        .md-item{display:flex;align-items:center;gap:7px;padding:6px 0;font-size:13px;color:#374151;cursor:pointer;border:none;background:none;font-family:inherit;text-align:left;width:100%;transition:all .15s;font-weight:500}
        .md-item:hover{color:#d97706;padding-left:3px}
        .md-dot{width:5px;height:5px;border-radius:50%;background:#d97706;flex-shrink:0;opacity:.4}
        .md-foot{border-top:1px solid #f3f4f6;padding:11px 22px;display:flex;align-items:center;justify-content:space-between;background:#fafafa}
        .md-all{display:inline-flex;align-items:center;gap:7px;background:#1c1917;color:white;border:none;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
        .h-right{margin-left:auto;display:flex;align-items:center;gap:8px}
        .h-div{width:1px;height:28px;background:#e5e7eb;margin:0 4px}
        .btn-login{background:white;color:#1c1917;border:1.5px solid #e5e7eb;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-reg{background:#d97706;color:white;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
        .prof-chip{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;background:#f5f5f7;border-radius:12px;cursor:pointer;position:relative}
        .pc-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white}
        .pc-name{font-size:12px;font-weight:700;color:#1c1917}
        .pc-sub{font-size:10px;color:#9ca3af}
        .prof-drop{position:absolute;top:calc(100% + 8px);right:0;background:white;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.12);min-width:200px;overflow:hidden;z-index:300;animation:fadeIn .15s ease}
        .pd-head{padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#fafafa}
        .pd-email{font-size:11px;color:#9ca3af;margin-top:2px}
        .pd-item{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;font-size:13px;color:#374151;font-weight:500;transition:background .1s;border:none;background:none;font-family:inherit;width:100%;text-align:left}
        .pd-item:hover{background:#f9fafb}
        .pd-item.danger{color:#ef4444}
        .pd-item.danger:hover{background:#fef2f2}
        .hero{border-radius:28px;overflow:hidden;background:linear-gradient(135deg,#fffbf5,#fef3c7 50%,#fffbf5);padding:60px 64px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;position:relative;min-height:480px;margin:20px 8px 48px}
        .hero::before{content:'';position:absolute;top:-60px;right:-60px;width:400px;height:400px;background:radial-gradient(circle,rgba(217,119,6,.12),transparent 70%);border-radius:50%;pointer-events:none}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:white;border:1.5px solid #fde68a;border-radius:100px;padding:6px 16px 6px 10px;font-size:12px;font-weight:700;color:#92400e;margin-bottom:22px;box-shadow:0 2px 8px rgba(217,119,6,.12)}
        .hero-dot{width:8px;height:8px;border-radius:50%;background:#d97706}
        .hero-h{font-size:clamp(36px,5vw,58px);font-weight:800;color:#1c1917;line-height:1.06;letter-spacing:-.03em;margin-bottom:16px}
        .hero-accent{color:#d97706}
        .hero-p{font-size:16px;color:#78716c;line-height:1.75;margin-bottom:32px;max-width:480px}
        .hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px}
        .hero-btn-p{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:14px 28px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(217,119,6,.4)}
        .hero-btn-s{display:inline-flex;align-items:center;gap:8px;background:white;color:#1c1917;border:2px solid #e7e5e4;border-radius:12px;padding:14px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
        .hero-stats{display:flex;gap:28px}
        .hero-stat-val{font-size:22px;font-weight:800;color:#d97706}
        .hero-stat-lab{font-size:11px;color:#a8a29e;margin-top:2px;font-weight:500}
        .hero-stat-div{width:1px;height:32px;background:#e7e5e4;margin:auto 0}
        .hero-r{display:flex;align-items:center;justify-content:center}
        .furniture-svg{width:100%;max-width:480px;animation:floatY 5s ease-in-out infinite;filter:drop-shadow(0 24px 48px rgba(217,119,6,.2))}
        .sec-wrap{margin:0 40px 48px}
        .sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .sec-title{font-size:22px;font-weight:800;color:#1c1917;letter-spacing:-.01em}
        .sec-more{font-size:13px;font-weight:600;color:#d97706;cursor:pointer;border:none;background:none;font-family:inherit;display:flex;align-items:center;gap:4px;padding:0}
        .prod-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .prod-card{background:white;border:1.5px solid #f3f4f6;border-radius:16px;overflow:hidden;cursor:pointer;transition:all .2s}
        .prod-card:hover{border-color:#e0e0e0;box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-3px)}
        .prod-body{padding:14px}
        .prod-cat{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}
        .prod-name{font-size:13px;font-weight:700;color:#1c1917;margin-bottom:4px;line-height:1.4}
        .prod-code{font-family:monospace;font-size:11px;color:#d97706;font-weight:700;background:#fef3c7;padding:2px 7px;border-radius:5px;display:inline-block;margin-bottom:10px}
        .prod-price{font-size:16px;font-weight:800;color:#1c1917}
        .prod-unit{font-size:11px;color:#9ca3af;margin-left:4px}
        .cta-wrap{margin:0 68px 48px}
        .footer{background:#0f0f1a;color:white}
        .footer-top{max-width:1400px;margin:0 auto;padding:56px 32px 40px;display:grid;grid-template-columns:2.5fr 1fr 1fr 1fr;gap:48px;border-bottom:1px solid rgba(255,255,255,.07)}
        .ft-brand{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .ft-logo{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:20px}
        .ft-name{font-size:18px;font-weight:800;color:white;letter-spacing:-.02em}
        .ft-desc{font-size:13px;color:rgba(255,255,255,.4);line-height:1.72;max-width:280px;margin-bottom:20px}
        .ft-contact{font-size:12px;color:rgba(255,255,255,.35);line-height:2}
        .ft-col-t{font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px}
        .ft-link{display:block;font-size:13px;color:rgba(255,255,255,.45);margin-bottom:10px;cursor:pointer;border:none;background:none;font-family:inherit;text-align:left;padding:0}
        .footer-bot{max-width:1400px;margin:0 auto;padding:18px 32px;display:flex;align-items:center;justify-content:center}
        .fb-copy{font-size:12px;color:rgba(255,255,255,.2)}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal-box{background:white;border-radius:20px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.2)}
        .modal-head{padding:18px 22px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white}
        .modal-t{font-size:15px;font-weight:700;color:#1c1917}
        .modal-x{width:28px;height:28px;border-radius:50%;border:none;background:#f3f4f6;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:#6b7280}
        .modal-b{padding:22px}
        .modal-b h3{font-size:13px;font-weight:700;color:#1c1917;margin:16px 0 7px}
        .modal-b h3:first-child{margin-top:0}
        .modal-b p{font-size:13px;color:#6b7280;line-height:1.7;margin-bottom:4px}
        @media(max-width:1200px){.prod-grid{grid-template-columns:repeat(3,1fr)}.footer-top{grid-template-columns:1fr 1fr}}
        @media(max-width:900px){.prod-grid{grid-template-columns:repeat(2,1fr)}.hero-r{display:none}.hero{grid-template-columns:1fr;padding:40px 32px}.mat-drop{min-width:92vw}}
        @media(max-width:600px){.header{padding:0 16px}.hero{padding:32px 20px;margin:12px 8px 32px}.sec-wrap{margin:0 16px 32px}.cta-wrap{margin:0 16px 32px}.footer-top{grid-template-columns:1fr}}
      `}</style>

      <header className={`header ${scrolled ? 'up' : ''}`} onClick={() => { setProfileDrop(false); setMatDropOpen(false); }}>
        <div className="header-inner">
          <div className="h-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-logo">🪑</div>
            <div className="h-name">FurniCalc</div>
          </div>
          <nav className="nav-links">
            <button className="nav-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Нүүр</button>
            <button className="nav-link" onClick={() => router.push('/calculate')}>Тооцоолол</button>
            <div className="mat-wrap" onMouseEnter={openDrop} onMouseLeave={closeDrop}>
              <button className={`nav-link ${matDropOpen ? 'open' : ''}`} onClick={() => router.push('/materials-page')}>
                Материал <span className="nav-chev">▾</span>
              </button>
              {matDropOpen && (
                <div className="mat-drop" onMouseEnter={openDrop} onMouseLeave={closeDrop}>
                  <div className="md-inner">
                    {categories.length === 0 ? (
                      <div style={{ padding: '8px 0', color: '#9ca3af', fontSize: 13 }}>Ачааллаж байна...</div>
                    ) : categories.map((cat: any) => (
                      <div key={cat.id} className="md-col">
                        <div className="md-cat">📂 {cat.name}</div>
                        {cat.material_types?.map((t: any) => (
                          <button key={t.id} className="md-item" onClick={() => { setMatDropOpen(false); router.push(`/materials-page?type=${t.id}`); }}>
                            <span className="md-dot" />{t.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="md-foot">
                    <button className="md-all" onClick={() => { setMatDropOpen(false); router.push('/materials-page'); }}>Бүх материал харах →</button>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{materials.length > 0 ? `${materials.length} материал` : ''}</span>
                  </div>
                </div>
              )}
            </div>
          </nav>
          <div className="h-right">
            {authUser ? (
              <>
                <button className="nav-link" onClick={() => router.push('/checkout')} style={{ fontSize: 13 }}>🛒 Сагс</button>
                <div className="h-div" />
                <div className="prof-chip" onClick={e => { e.stopPropagation(); setProfileDrop(!profileDrop); }}>
                  <div className="pc-av">{authUser.first_name?.[0]}{authUser.last_name?.[0]}</div>
                  <div><div className="pc-name">{authUser.last_name} {authUser.first_name}</div><div className="pc-sub">Профайл ▾</div></div>
                  {profileDrop && (
                    <div className="prof-drop" onClick={e => e.stopPropagation()}>
                      <div className="pd-head">
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1917' }}>{authUser.last_name} {authUser.first_name}</div>
                        <div className="pd-email">{authUser.email}</div>
                      </div>
                      <button className="pd-item" onClick={() => { router.push('/profile'); setProfileDrop(false); }}>👤 Миний профайл</button>
                      <button className="pd-item" onClick={() => { router.push('/profile'); setProfileDrop(false); }}>📦 Захиалгын түүх</button>
                      <button className="pd-item" onClick={() => { router.push('/calculate'); setProfileDrop(false); }}>📐 Тооцоолол хийх</button>
                      <button className="pd-item danger" onClick={handleLogout}>🚪 Гарах</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="btn-login" onClick={() => router.push('/auth/login')}>Нэвтрэх</button>
                <button className="btn-reg" onClick={() => router.push('/auth/register')}>Бүртгүүлэх</button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="hero">
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeSlide 0.6s ease' }}>
          <div className="hero-badge"><div className="hero-dot" />Тавилгын материалын тооцооны систем</div>
          <h1 className="hero-h">Тавилгын материалын<br /><span className="hero-accent">автомат тооцоо</span></h1>
          <p className="hero-p">Хэмжээ, материал, эд ангийг оруулахад л автоматаар хавтангийн талбай, ирмэг наалт, үнэ зэргийг тооцоолно.</p>
          <div className="hero-btns">
            <button className="hero-btn-p" onClick={() => router.push('/calculate')}>⊞ Тооцоогоо эхлэх</button>
            <button className="hero-btn-s" onClick={() => router.push('/auth/register')}>→ Үнэгүй бүртгүүлэх</button>
          </div>
          <div className="hero-stats">
            {[{val:'100%',lab:'Автомат'},null,{val:'7+',lab:'Тавилгын төрөл'},null,{val:'0₮',lab:'Үнэгүй ашиглах'}].map((s,i) => s===null ? <div key={i} className="hero-stat-div"/> : <div key={i}><div className="hero-stat-val">{s.val}</div><div className="hero-stat-lab">{s.lab}</div></div>)}
          </div>
        </div>
        <div className="hero-r">
          <svg className="furniture-svg" viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="60" y="60" width="360" height="300" rx="8" fill="#fef3c7" stroke="#fde68a" strokeWidth="2"/>
            <rect x="60" y="210" width="360" height="6" fill="#fde68a"/><rect x="237" y="60" width="6" height="300" fill="#fde68a"/>
            <rect x="70" y="70" width="160" height="132" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <rect x="250" y="70" width="160" height="132" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <rect x="70" y="224" width="160" height="126" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <rect x="250" y="224" width="160" height="126" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <rect x="138" y="128" width="24" height="6" rx="3" fill="#d97706"/><rect x="318" y="128" width="24" height="6" rx="3" fill="#d97706"/>
            <rect x="138" y="280" width="24" height="6" rx="3" fill="#d97706"/><rect x="318" y="280" width="24" height="6" rx="3" fill="#d97706"/>
            <rect x="80" y="360" width="24" height="28" rx="4" fill="#d97706"/><rect x="376" y="360" width="24" height="28" rx="4" fill="#d97706"/>
            <g transform="translate(320,40)"><rect width="120" height="36" rx="18" fill="#d97706" opacity="0.95"/><text x="60" y="23" fill="white" fontSize="12" fontWeight="800" textAnchor="middle">⚡ Тооцоолол</text></g>
            <g transform="translate(36,300)"><rect width="100" height="32" rx="16" fill="white" stroke="#fde68a" strokeWidth="1.5"/><text x="50" y="21" fill="#92400e" fontSize="11" fontWeight="700" textAnchor="middle">🪵 ЛДСП 18мм</text></g>
          </svg>
        </div>
      </div>

      <div className="sec-wrap">
        <div className="sec-head">
          <div className="sec-title">⭐ Онцлох материалууд</div>
          <button className="sec-more" onClick={() => router.push('/materials-page')}>Бүгдийг харах →</button>
        </div>
        <div className="prod-grid">
          {loading ? [1,2,3,4].map(i => <Skel key={i} />) :
            featMat.length === 0 ? (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'48px 0', color:'#94a3b8', fontSize:14 }}>Материал олдсонгүй</div>
            ) : featMat.map(m => (
              <div key={m.id} className="prod-card" onClick={() => router.push('/materials-page')}>
                <MatVisual m={m} />
                <div className="prod-body">
                  <div className="prod-cat">{m.material_types?.material_categories?.name} · {m.material_types?.name}</div>
                  <div className="prod-name">{m.name}</div>
                  <div className="prod-code">{m.code}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div><span className="prod-price">₮{Number(m.price).toLocaleString()}</span><span className="prod-unit">/ {m.unit}</span></div>
                    <span style={{ fontSize:10, fontWeight:700, background:Number(m.stock)>10?'#dcfce7':'#fef9c3', color:Number(m.stock)>10?'#166534':'#854d0e', padding:'3px 8px', borderRadius:100 }}>
                      {Number(m.stock)>10?'Байгаа':'Дуусаж'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="cta-wrap">
        <div style={{ background:'linear-gradient(135deg,#d97706,#b45309 60%,#92400e)', borderRadius:24, padding:'56px 48px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'white', marginBottom:14, letterSpacing:'-0.02em', lineHeight:1.15 }}>Тавилгын материалаа онлайнаар тооцоол</div>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.8)', margin:'0 auto 36px', lineHeight:1.7, maxWidth:460 }}>Хэмжээ оруулахад л хавтангийн талбай, ирмэг наалт, тоог автоматаар бодно.</p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={() => router.push('/calculate')} style={{ background:'white', color:'#b45309', border:'none', borderRadius:12, padding:'14px 32px', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Хялбар тооцоо</button>
              <button onClick={() => router.push('/auth/register')} style={{ background:'transparent', color:'white', border:'2px solid rgba(255,255,255,0.7)', borderRadius:12, padding:'14px 32px', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Бүртгүүлэх</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-top">
          <div>
            <div className="ft-brand"><div className="ft-logo">🪑</div><div className="ft-name">FurniCalc</div></div>
            <p className="ft-desc">Монголын тавилгын салбарт зориулсан материалын тооцооны систем.</p>
            <div className="ft-contact"><div>📍 Дархан хот, Монгол</div><div>📧 info@furni.mn</div><div>📞 +976 9900-1122</div></div>
          </div>
          <div><div className="ft-col-t">Систем</div><button className="ft-link" onClick={() => router.push('/auth/login')}>Нэвтрэх</button><button className="ft-link" onClick={() => router.push('/calculate')}>Тооцоолол</button><button className="ft-link" onClick={() => router.push('/materials-page')}>Материал</button></div>
          <div><div className="ft-col-t">Бидний тухай</div><button className="ft-link" onClick={() => setShowAbout(true)}>Бидний тухай</button><button className="ft-link">Холбоо барих</button></div>
          <div><div className="ft-col-t">Хуулийн мэдээлэл</div><button className="ft-link" onClick={() => setShowTerms(true)}>Үйлчилгээний нөхцөл</button><button className="ft-link" onClick={() => setShowTerms(true)}>Нууцлалын бодлого</button></div>
        </div>
        <div className="footer-bot"><div className="fb-copy">© 2026 FurniCalc · Б.Хонгорзул В222270132</div></div>
      </footer>

      {showTerms && (
        <div className="modal-bg" onClick={() => setShowTerms(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><div className="modal-t">Үйлчилгээний нөхцөл</div><button className="modal-x" onClick={() => setShowTerms(false)}>×</button></div>
            <div className="modal-b">
              <h3>1. Ерөнхий нөхцөл</h3><p>FurniCalc систем нь Монголын тавилгын салбарт зориулсан материалын тооцооны платформ юм.</p>
              <h3>2. Хэрэглээ</h3><p>Систем нь зөвхөн тавилгын материалын тооцоолол хийх, захиалга удирдах зориулалттай.</p>
              <h3>3. Нууцлал</h3><p>Таны мэдээлэл гуравдагч этгээдэд дамжуулахгүй.</p>
            </div>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="modal-bg" onClick={() => setShowAbout(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><div className="modal-t">Бидний тухай</div><button className="modal-x" onClick={() => setShowAbout(false)}>×</button></div>
            <div className="modal-b">
              <div style={{ textAlign:'center', padding:'16px 0 24px' }}>
                <div style={{ width:60, height:60, borderRadius:14, background:'linear-gradient(135deg,#d97706,#b45309)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 12px' }}>🪑</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#1c1917', marginBottom:4 }}>FurniCalc</div>
                <div style={{ fontSize:13, color:'#9ca3af' }}>Тавилгын материалын тооцооны систем</div>
              </div>
              <h3>Хөгжүүлэгч</h3><p>Б.Хонгорзул · В222270132 · 2026</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
