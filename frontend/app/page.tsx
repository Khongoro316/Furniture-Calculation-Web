'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/axios';

// Категори болон төрлөөс хамааран визуал тодорхойлох
const getMaterialVisual = (catName: string, typeName: string) => {
  const cat = (catName || '').toLowerCase();
  const type = (typeName || '').toLowerCase();

  if (type.includes('лдсп') || type.includes('ldsp')) {
    return { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', pattern: 'ldsp', color: '#92400e' };
  }
  if (type.includes('мдф') || type.includes('mdf')) {
    return { bg: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)', pattern: 'mdf', color: '#14532d' };
  }
  if (type.includes('hdf') || type.includes('хдф')) {
    return { bg: 'linear-gradient(135deg,#eff6ff,#bfdbfe)', pattern: 'hdf', color: '#1e3a8a' };
  }
  if (type.includes('abs') || cat.includes('ирмэг')) {
    return { bg: 'linear-gradient(135deg,#fdf2f8,#f5d0fe)', pattern: 'edge', color: '#701a75' };
  }
  if (cat.includes('тоноглол') || type.includes('нугас') || type.includes('бариул')) {
    return { bg: 'linear-gradient(135deg,#f8fafc,#e2e8f0)', pattern: 'hardware', color: '#1e293b' };
  }
  return { bg: 'linear-gradient(135deg,#fafafa,#f3f4f6)', pattern: 'default', color: '#374151' };
};

const MaterialCardVisual = ({ material }: { material: any }) => {
  const catName = material.material_types?.material_categories?.name || '';
  const typeName = material.material_types?.name || '';
  const visual = getMaterialVisual(catName, typeName);

  return (
    <div style={{
      height: 160,
      background: visual.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Арын загвар */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 200 160">
        {visual.pattern === 'ldsp' && (
          <>
            <rect x="0" y="0" width="200" height="160" fill="none" stroke={visual.color} strokeWidth="0.5"
              strokeDasharray="4 4" />
            {[20,40,60,80,100,120,140,160,180].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="160" stroke={visual.color} strokeWidth="0.5" />
            ))}
            {[20,40,60,80,100,120,140].map(y => (
              <line key={y} x1="0" y1={y} x2="200" y2={y} stroke={visual.color} strokeWidth="0.5" />
            ))}
          </>
        )}
        {visual.pattern === 'mdf' && (
          <>
            {[0,20,40,60,80,100,120,140,160,180,200].map((x, i) => (
              <line key={i} x1={x} y1="0" x2={x-30} y2="160" stroke={visual.color} strokeWidth="0.8" />
            ))}
          </>
        )}
        {visual.pattern === 'hdf' && (
          <>
            {Array.from({length: 8}).map((_, row) =>
              Array.from({length: 10}).map((_, col) => (
                <circle key={`${row}-${col}`} cx={col*22+11} cy={row*22+11} r="3" fill={visual.color} />
              ))
            )}
          </>
        )}
        {visual.pattern === 'edge' && (
          <>
            {[10,30,50,70,90,110,130,150].map(y => (
              <rect key={y} x="0" y={y} width="200" height="8" fill={visual.color} rx="2" />
            ))}
          </>
        )}
        {(visual.pattern === 'hardware' || visual.pattern === 'default') && (
          <>
            {[40,80,120,160].map(cx =>
              [40,80,120].map(cy => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="10" fill="none" stroke={visual.color} strokeWidth="1" />
              ))
            )}
          </>
        )}
      </svg>

      {/* Голын текст */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 800,
          color: visual.color,
          background: 'rgba(255,255,255,0.85)',
          padding: '4px 12px',
          borderRadius: 20,
          backdropFilter: 'blur(4px)',
          letterSpacing: '0.04em',
        }}>
          {typeName || catName}
        </div>
        {material.thickness && (
          <div style={{
            fontSize: 10,
            color: visual.color,
            marginTop: 6,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.7)',
            padding: '2px 8px',
            borderRadius: 10,
            display: 'inline-block',
          }}>
            {Number(material.thickness)}мм
          </div>
        )}
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
  const [materialsLoading, setMaterialsLoading] = useState(true);

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
    // Материалуудыг API-аас татах
    setMaterialsLoading(true);
    api.get('/api/materials')
      .then(res => setMaterials(res.data || []))
      .catch(() => setMaterials([]))
      .finally(() => setMaterialsLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuthUser(null);
    setProfileDrop(false);
  };

  // Онцлох болон шинэ материалуудыг API-аас авах
  const featMat = materials.slice(0, 4);
  const newMat = materials.slice(0, 4);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Plus Jakarta Sans',sans-serif;color:#1c1917;background:#fff;-webkit-font-smoothing:antialiased}

        /* ═══ NAVIGATION ═══ */
        .header{background:white;border-bottom:1px solid #f0f0f0;padding:0 32px;position:sticky;top:0;z-index:200;transition:box-shadow 0.3s}
        .header.up{box-shadow:0 2px 16px rgba(0,0,0,0.08)}
        .header-inner{max-width:1400px;margin:0 auto;height:68px;display:flex;align-items:center;gap:0}

        /* Brand */
        .h-brand{display:flex;align-items:center;gap:10px;cursor:pointer;flex-shrink:0;margin-right:32px}
        .h-logo{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:20px}
        .h-name{font-size:19px;font-weight:800;color:#1c1917;letter-spacing:-0.02em}

        /* Nav links */
        .nav-links{display:flex;align-items:stretch;gap:0;height:68px}
        .nav-link{display:flex;align-items:center;padding:0 18px;font-size:14px;font-weight:600;color:#4b5563;cursor:pointer;border:none;background:none;font-family:inherit;position:relative;transition:color 0.15s;white-space:nowrap}
        .nav-link:hover{color:#1c1917}
        .nav-link::after{content:'';position:absolute;bottom:0;left:18px;right:18px;height:2px;background:#d97706;transform:scaleX(0);transition:transform 0.2s;transform-origin:center}
        .nav-link:hover::after{transform:scaleX(1)}
        .nav-link.active{color:#d97706}
        .nav-link.active::after{transform:scaleX(1)}

        /* Right side */
        .h-right{margin-left:auto;display:flex;align-items:center;gap:8px}
        .h-divider{width:1px;height:28px;background:#e5e7eb;margin:0 4px}

        /* Auth buttons */
        .btn-login{background:white;color:#1c1917;border:1.5px solid #e5e7eb;border-radius:10px;padding:'9px 18px';font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;padding:9px 18px}
        .btn-login:hover{border-color:#d97706;color:#d97706}
        .btn-register{background:#d97706;color:white;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .btn-register:hover{background:#b45309}

        /* Profile */
        .prof-chip{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;background:#f5f5f7;border-radius:12px;cursor:pointer;position:relative;transition:all 0.15s}
        .prof-chip:hover{background:#fef3c7}
        .pc-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0}
        .pc-name{font-size:12px;font-weight:700;color:#1c1917;white-space:nowrap}
        .pc-sub{font-size:10px;color:#9ca3af}
        .prof-drop{position:absolute;top:calc(100% + 8px);right:0;background:white;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.12);min-width:200px;overflow:hidden;z-index:300;animation:fadeIn 0.15s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .pd-head{padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#fafafa}
        .pd-email{font-size:11px;color:#9ca3af;margin-top:2px}
        .pd-item{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;font-size:13px;color:#374151;font-weight:500;transition:background 0.1s;border:none;background:none;font-family:inherit;width:100%;text-align:left}
        .pd-item:hover{background:#f9fafb}
        .pd-item.danger{color:#ef4444}
        .pd-item.danger:hover{background:#fef2f2}

        /* ═══ HERO ═══ */
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
        .hero-wrap{border-radius:28px;overflow:hidden;background:linear-gradient(135deg,#fffbf5 0%,#fef3c7 50%,#fffbf5 100%);padding:60px 64px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;position:relative;min-height:480px;margin:20px 8px 48px}
        .hero-wrap::before{content:'';position:absolute;top:-60px;right:-60px;width:400px;height:400px;background:radial-gradient(circle,rgba(217,119,6,0.12),transparent 70%);border-radius:50%;pointer-events:none}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:white;border:1.5px solid #fde68a;border-radius:100px;padding:6px 16px 6px 10px;font-size:12px;font-weight:700;color:#92400e;margin-bottom:22px;box-shadow:0 2px 8px rgba(217,119,6,0.12)}
        .hero-badge-dot{width:8px;height:8px;border-radius:50%;background:#d97706}
        .hero-h{font-size:clamp(36px,5vw,58px);font-weight:800;color:#1c1917;line-height:1.06;letter-spacing:-0.03em;margin-bottom:16px}
        .hero-accent{color:#d97706}
        .hero-p{font-size:16px;color:#78716c;line-height:1.75;margin-bottom:32px;max-width:480px}
        .hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px}
        .hero-btn-p{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:14px 28px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 6px 20px rgba(217,119,6,0.4)}
        .hero-btn-p:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(217,119,6,0.5)}
        .hero-btn-s{display:inline-flex;align-items:center;gap:8px;background:white;color:#1c1917;border:2px solid #e7e5e4;border-radius:12px;padding:14px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .hero-btn-s:hover{border-color:#d97706;color:#d97706}
        .hero-stats{display:flex;gap:28px}
        .hero-stat-val{font-size:22px;font-weight:800;color:#d97706}
        .hero-stat-lab{font-size:11px;color:#a8a29e;margin-top:2px;font-weight:500}
        .hero-stat-div{width:1px;height:32px;background:#e7e5e4;margin:auto 0}
        .hero-r{position:relative;display:flex;align-items:center;justify-content:center}
        .furniture-svg{width:100%;max-width:480px;animation:floatY 5s ease-in-out infinite;filter:drop-shadow(0 24px 48px rgba(217,119,6,0.2))}

        /* ═══ PRODUCT GRID ═══ */
        .sec-wrap{margin:0 40px 40px}
        .sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .sec-title{font-size:20px;font-weight:800;color:#1c1917;letter-spacing:-0.01em}
        .sec-more{font-size:13px;font-weight:600;color:#d97706;cursor:pointer;border:none;background:none;font-family:inherit;display:flex;align-items:center;gap:4px;padding:0;transition:gap 0.15s}
        .sec-more:hover{gap:8px}

        .prod-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .prod-card{background:white;border:1.5px solid #f3f4f6;border-radius:16px;overflow:hidden;cursor:pointer;transition:all 0.2s}
        .prod-card:hover{border-color:#e0e0e0;box-shadow:0 8px 28px rgba(0,0,0,0.08);transform:translateY(-3px)}
        .prod-badge{position:absolute;top:10px;left:10px;font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px}
        .badge-new{background:#1c1917;color:white}
        .badge-sale{background:#ef4444;color:white}
        .prod-body{padding:14px}
        .prod-cat{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px}
        .prod-name{font-size:13px;font-weight:700;color:#1c1917;margin-bottom:4px;line-height:1.4}
        .prod-code{font-family:monospace;font-size:11px;color:#d97706;font-weight:700;background:#fef3c7;padding:2px 7px;border-radius:5px;display:inline-block;margin-bottom:10px}
        .prod-price-row{display:flex;align-items:center;justify-content:space-between}
        .prod-price{font-size:16px;font-weight:800;color:#1c1917}
        .prod-unit{font-size:11px;color:#9ca3af;font-weight:500;margin-left:4px}

        /* Skeleton */
        .skel{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* CTA */
        .cta-wrap{margin:0 68px 48px}

        /* FOOTER */
        .footer{background:#0f0f1a;color:white;margin-top:0}
        .footer-top{max-width:1400px;margin:0 auto;padding:56px 32px 40px;display:grid;grid-template-columns:2.5fr 1fr 1fr 1fr;gap:48px;border-bottom:1px solid rgba(255,255,255,0.07)}
        .ft-brand{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .ft-logo{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:20px}
        .ft-name{font-size:18px;font-weight:800;color:white;letter-spacing:-0.02em}
        .ft-desc{font-size:13px;color:rgba(255,255,255,0.4);line-height:1.72;max-width:280px;margin-bottom:20px}
        .ft-contact{font-size:12px;color:rgba(255,255,255,0.35);line-height:2}
        .ft-col-t{font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px}
        .ft-link{display:block;font-size:13px;color:rgba(255,255,255,0.45);margin-bottom:10px;cursor:pointer;transition:color 0.15s;border:none;background:none;font-family:inherit;text-align:left;padding:0}
        .ft-link:hover{color:white}
        .footer-bot{max-width:1400px;margin:0 auto;padding:18px 32px;display:flex;align-items:center;justify-content:center}
        .fb-copy{font-size:12px;color:rgba(255,255,255,0.2)}

        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
        .modal-box{background:white;border-radius:20px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.2)}
        .modal-head{padding:18px 22px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white}
        .modal-t{font-size:15px;font-weight:700;color:#1c1917}
        .modal-x{width:28px;height:28px;border-radius:50%;border:none;background:#f3f4f6;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:#6b7280}
        .modal-b{padding:22px}
        .modal-b h3{font-size:13px;font-weight:700;color:#1c1917;margin:16px 0 7px}
        .modal-b h3:first-child{margin-top:0}
        .modal-b p{font-size:13px;color:#6b7280;line-height:1.7;margin-bottom:4px}

        @media(max-width:1200px){.prod-grid{grid-template-columns:repeat(3,1fr)}.footer-top{grid-template-columns:1fr 1fr;gap:32px}}
        @media(max-width:900px){.prod-grid{grid-template-columns:repeat(2,1fr)}.hero-r{display:none}.hero-wrap{grid-template-columns:1fr;padding:40px 32px}.nav-links .nav-link{padding:0 12px;font-size:13px}}
        @media(max-width:600px){.prod-grid{grid-template-columns:repeat(2,1fr)}.header{padding:0 16px}.hero-wrap{padding:32px 20px;margin:12px 8px 32px}.sec-wrap{margin:0 16px 32px}.cta-wrap{margin:0 16px 32px}.footer-top{grid-template-columns:1fr}.nav-links .nav-link span.nav-text{display:none}}
      `}</style>

      {/* ═══ HEADER / NAVIGATION ═══ */}
      <header
        className={`header ${scrolled ? 'up' : ''}`}
        onClick={() => setProfileDrop(false)}
      >
        <div className="header-inner">
          {/* Brand */}
          <div className="h-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-logo">🪑</div>
            <div className="h-name">FurniCalc</div>
          </div>

          {/* Nav links */}
          <nav className="nav-links">
            <button className="nav-link active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Нүүр
            </button>
            <button className="nav-link" onClick={() => router.push('/calculate')}>
              Тооцоолол
            </button>
            <button className="nav-link" onClick={() => router.push('/materials-page')}>
              Материал
            </button>
          </nav>

          {/* Right */}
          <div className="h-right">
            {authUser ? (
              <>
                <button
                  className="nav-link"
                  onClick={() => router.push('/profile')}
                  style={{ fontSize: 13 }}
                >
                  🛒 Сагс
                </button>
                <div className="h-divider" />
                <div
                  className="prof-chip"
                  onClick={e => { e.stopPropagation(); setProfileDrop(!profileDrop); }}
                >
                  <div className="pc-av">
                    {authUser.first_name?.[0]}{authUser.last_name?.[0]}
                  </div>
                  <div>
                    <div className="pc-name">{authUser.last_name} {authUser.first_name}</div>
                    <div className="pc-sub">Профайл ▾</div>
                  </div>
                  {profileDrop && (
                    <div className="prof-drop" onClick={e => e.stopPropagation()}>
                      <div className="pd-head">
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1917' }}>
                          {authUser.last_name} {authUser.first_name}
                        </div>
                        <div className="pd-email">{authUser.email}</div>
                      </div>
                      <button className="pd-item" onClick={() => { router.push('/profile'); setProfileDrop(false); }}>
                        👤 Миний профайл
                      </button>
                      <button className="pd-item" onClick={() => { router.push('/profile'); setProfileDrop(false); }}>
                        📦 Захиалгын түүх
                      </button>
                      <button className="pd-item" onClick={() => { router.push('/calculate'); setProfileDrop(false); }}>
                        📐 Тооцоолол хийх
                      </button>
                      <button className="pd-item danger" onClick={handleLogout}>
                        🚪 Гарах
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  className="btn-login"
                  onClick={() => router.push('/auth/login')}
                >
                  Нэвтрэх
                </button>
                <button
                  className="btn-register"
                  onClick={() => router.push('/auth/register')}
                >
                  Бүртгүүлэх
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <div className="hero-wrap">
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeSlide 0.6s ease' }}>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Тавилгын материалын тооцооны систем
          </div>
          <h1 className="hero-h">
            Тавилгын материалын<br />
            <span className="hero-accent">автомат тооцоо</span>
          </h1>
          <p className="hero-p">
            Хэмжээ, материал, эд ангийг оруулахад л автоматаар хавтангийн талбай, ирмэг наалт, үнэ зэргийг тооцоолно.
          </p>
          <div className="hero-btns">
            <button className="hero-btn-p" onClick={() => router.push('/calculate')}>
              ⊞ Тооцоогоо эхлэх
            </button>
            <button className="hero-btn-s" onClick={() => router.push('/auth/register')}>
              → Үнэгүй бүртгүүлэх
            </button>
          </div>
          <div className="hero-stats">
            {[
              { val: '100%', lab: 'Автомат' },
              null,
              { val: '7+', lab: 'Тавилгын төрөл' },
              null,
              { val: '0₮', lab: 'Үнэгүй ашиглах' },
            ].map((s, i) =>
              s === null
                ? <div key={i} className="hero-stat-div" />
                : (
                  <div key={i}>
                    <div className="hero-stat-val">{s.val}</div>
                    <div className="hero-stat-lab">{s.lab}</div>
                  </div>
                )
            )}
          </div>
        </div>

        <div className="hero-r">
          <svg className="furniture-svg" viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="60" y="60" width="360" height="300" rx="8" fill="#fef3c7" stroke="#fde68a" strokeWidth="2"/>
            <rect x="60" y="210" width="360" height="6" fill="#fde68a"/>
            <rect x="237" y="60" width="6" height="300" fill="#fde68a"/>
            <rect x="70" y="70" width="160" height="132" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <rect x="250" y="70" width="160" height="132" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <rect x="70" y="224" width="160" height="126" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <rect x="250" y="224" width="160" height="126" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
            <rect x="138" y="128" width="24" height="6" rx="3" fill="#d97706"/>
            <rect x="318" y="128" width="24" height="6" rx="3" fill="#d97706"/>
            <rect x="138" y="280" width="24" height="6" rx="3" fill="#d97706"/>
            <rect x="318" y="280" width="24" height="6" rx="3" fill="#d97706"/>
            <rect x="80" y="360" width="24" height="28" rx="4" fill="#d97706"/>
            <rect x="376" y="360" width="24" height="28" rx="4" fill="#d97706"/>
            <rect x="75" y="160" width="150" height="3" rx="1.5" fill="#fde68a"/>
            <rect x="255" y="160" width="150" height="3" rx="1.5" fill="#fde68a"/>
            <rect x="72" y="72" width="40" height="128" rx="3" fill="white" opacity="0.4"/>
            <rect x="252" y="72" width="40" height="128" rx="3" fill="white" opacity="0.4"/>
            <line x1="30" y1="60" x2="30" y2="360" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
            <line x1="24" y1="60" x2="36" y2="60" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
            <line x1="24" y1="360" x2="36" y2="360" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
            <text x="18" y="215" fill="#d97706" fontSize="11" fontWeight="700" textAnchor="middle" transform="rotate(-90,18,215)" opacity="0.7">2100мм</text>
            <line x1="60" y1="400" x2="420" y2="400" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
            <line x1="60" y1="394" x2="60" y2="406" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
            <line x1="420" y1="394" x2="420" y2="406" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
            <text x="240" y="416" fill="#d97706" fontSize="11" fontWeight="700" textAnchor="middle" opacity="0.7">1200мм</text>
            <g transform="translate(320, 40)">
              <rect width="120" height="36" rx="18" fill="#d97706" opacity="0.95"/>
              <text x="60" y="23" fill="white" fontSize="12" fontWeight="800" textAnchor="middle">⚡ Тооцоолол</text>
            </g>
            <g transform="translate(36, 300)">
              <rect width="100" height="32" rx="16" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
              <text x="50" y="21" fill="#92400e" fontSize="11" fontWeight="700" textAnchor="middle">🪵 ЛДСП 18мм</text>
            </g>
          </svg>
        </div>
      </div>

      {/* ═══ ОНЦЛОХ МАТЕРИАЛУУД ═══ */}
      <div className="sec-wrap">
        <div className="sec-head">
          <div className="sec-title">⭐ Онцлох материалууд</div>
          <button className="sec-more" onClick={() => router.push('/materials-page')}>Бүгдийг харах →</button>
        </div>

        {materialsLoading ? (
          <div className="prod-grid">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: 'white', border: '1.5px solid #f3f4f6', borderRadius: 16, overflow: 'hidden' }}>
                <div className="skel" style={{ height: 160 }} />
                <div style={{ padding: 14 }}>
                  <div className="skel" style={{ height: 10, width: '60%', marginBottom: 8 }} />
                  <div className="skel" style={{ height: 14, width: '90%', marginBottom: 8 }} />
                  <div className="skel" style={{ height: 10, width: '40%', marginBottom: 12 }} />
                  <div className="skel" style={{ height: 16, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featMat.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
            Материал олдсонгүй
          </div>
        ) : (
          <div className="prod-grid">
            {featMat.map((m: any) => (
              <div key={m.id} className="prod-card" onClick={() => router.push('/materials-page')}>
                <div style={{ position: 'relative' }}>
                  <MaterialCardVisual material={m} />
                </div>
                <div className="prod-body">
                  <div className="prod-cat">
                    {m.material_types?.material_categories?.name || '—'} · {m.material_types?.name || '—'}
                  </div>
                  <div className="prod-name">{m.name}</div>
                  <div className="prod-code">{m.code}</div>
                  <div className="prod-price-row">
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span className="prod-price">₮{Number(m.price).toLocaleString()}</span>
                      <span className="prod-unit">/ {m.unit}</span>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      background: m.stock > 10 ? '#dcfce7' : '#fef9c3',
                      color: m.stock > 10 ? '#166534' : '#854d0e',
                      padding: '3px 8px', borderRadius: 100
                    }}>
                      {m.stock > 10 ? 'Байгаа' : 'Дуусаж байна'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ ШИНЭ МАТЕРИАЛУУД ═══ */}
      <div className="sec-wrap">
        <div className="sec-head">
          <div className="sec-title">🆕 Шинэ материалууд</div>
          <button className="sec-more" onClick={() => router.push('/materials-page')}>Бүгдийг харах →</button>
        </div>

        {materialsLoading ? (
          <div className="prod-grid">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: 'white', border: '1.5px solid #f3f4f6', borderRadius: 16, overflow: 'hidden' }}>
                <div className="skel" style={{ height: 160 }} />
                <div style={{ padding: 14 }}>
                  <div className="skel" style={{ height: 10, width: '60%', marginBottom: 8 }} />
                  <div className="skel" style={{ height: 14, width: '90%', marginBottom: 8 }} />
                  <div className="skel" style={{ height: 10, width: '40%', marginBottom: 12 }} />
                  <div className="skel" style={{ height: 16, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : newMat.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
            Материал олдсонгүй
          </div>
        ) : (
          <div className="prod-grid">
            {newMat.map((m: any) => (
              <div key={`new-${m.id}`} className="prod-card" onClick={() => router.push('/materials-page')}>
                <div style={{ position: 'relative' }}>
                  <MaterialCardVisual material={m} />
                  <span className="prod-badge badge-new" style={{ position: 'absolute', top: 10, left: 10 }}>ШИНЭ</span>
                </div>
                <div className="prod-body">
                  <div className="prod-cat">
                    {m.material_types?.material_categories?.name || '—'} · {m.material_types?.name || '—'}
                  </div>
                  <div className="prod-name">{m.name}</div>
                  <div className="prod-code">{m.code}</div>
                  <div className="prod-price-row">
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span className="prod-price">₮{Number(m.price).toLocaleString()}</span>
                      <span className="prod-unit">/ {m.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ CTA ═══ */}
      <div className="cta-wrap">
        <div style={{
          background: 'linear-gradient(135deg,#d97706 0%,#b45309 60%,#92400e 100%)',
          borderRadius: 24, padding: '56px 48px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, right: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Тавилгын материалаа онлайнаар тооцоол
            </div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 36, lineHeight: 1.7, maxWidth: 460, margin: '0 auto 36px' }}>
              Хэмжээ оруулахад л хавтангийн талбай, ирмэг наалт, тоог автоматаар бодно.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/calculate')}
                style={{ background: 'white', color: '#b45309', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                Хялбар тооцоо
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                style={{ background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.7)', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                Бүртгүүлэх
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="footer-top">
          <div>
            <div className="ft-brand">
              <div className="ft-logo">🪑</div>
              <div className="ft-name">FurniCalc</div>
            </div>
            <p className="ft-desc">Монголын тавилгын салбарт зориулсан материалын тооцооны систем.</p>
            <div className="ft-contact">
              <div>📍 Дархан хот, Монгол</div>
              <div>📧 info@furni.mn</div>
              <div>📞 +976 9900-1122</div>
            </div>
          </div>
          <div>
            <div className="ft-col-t">Систем</div>
            <button className="ft-link" onClick={() => router.push('/auth/login')}>Нэвтрэх</button>
            <button className="ft-link" onClick={() => router.push('/calculate')}>Тооцоолол</button>
            <button className="ft-link" onClick={() => router.push('/materials-page')}>Материал</button>
          </div>
          <div>
            <div className="ft-col-t">Бидний тухай</div>
            <button className="ft-link" onClick={() => setShowAbout(true)}>Бидний тухай</button>
            <button className="ft-link">Холбоо барих</button>
            <button className="ft-link">Хамтран ажиллах</button>
          </div>
          <div>
            <div className="ft-col-t">Хуулийн мэдээлэл</div>
            <button className="ft-link" onClick={() => setShowTerms(true)}>Үйлчилгээний нөхцөл</button>
            <button className="ft-link" onClick={() => setShowTerms(true)}>Нууцлалын бодлого</button>
          </div>
        </div>
        <div className="footer-bot">
          <div className="fb-copy">© 2026 FurniCalc · Б.Хонгорзул В222270132</div>
        </div>
      </footer>

      {/* TERMS MODAL */}
      {showTerms && (
        <div className="modal-bg" onClick={() => setShowTerms(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-t">Үйлчилгээний нөхцөл</div>
              <button className="modal-x" onClick={() => setShowTerms(false)}>×</button>
            </div>
            <div className="modal-b">
              <h3>1. Ерөнхий нөхцөл</h3>
              <p>FurniCalc систем нь Монголын тавилгын салбарт зориулсан материалын тооцооны платформ юм.</p>
              <h3>2. Хэрэглээ</h3>
              <p>Систем нь зөвхөн тавилгын материалын тооцоолол хийх, захиалга удирдах зориулалттай.</p>
              <h3>3. Нууцлал</h3>
              <p>Таны мэдээлэл гуравдагч этгээдэд дамжуулахгүй.</p>
              <h3>4. Хариуцлага</h3>
              <p>Тооцооллын нарийвчлал оруулсан хэмжээнээс хамаарна.</p>
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#f9fafb', borderRadius: 10, fontSize: 12, color: '#9ca3af' }}>
                Сүүлчийн шинэчлэл: 2026 оны 4-р сар · Б.Хонгорзул В222270132
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAbout && (
        <div className="modal-bg" onClick={() => setShowAbout(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-t">Бидний тухай</div>
              <button className="modal-x" onClick={() => setShowAbout(false)}>×</button>
            </div>
            <div className="modal-b">
              <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
                <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 12px' }}>🪑</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1c1917', marginBottom: 4 }}>FurniCalc</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>Тавилгын материалын тооцооны систем</div>
              </div>
              <h3>Системийн тухай</h3>
              <p>FurniCalc нь Монголын тавилгын салбарт зориулсан дипломын ажил. MySQL, Node.js, Next.js ашиглан хийгдсэн.</p>
              <h3>Хөгжүүлэгч</h3>
              <p>Б.Хонгорзул · В222270132 · 2026</p>
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Next.js 14', 'Node.js', 'MySQL', 'Prisma', 'TypeScript', 'JWT'].map(t => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: '#f3f4f6', borderRadius: 100, color: '#374151' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
