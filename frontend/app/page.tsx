'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const MATERIALS = [
  { id:1, code:'LDSP-WH-18', name:'Цагаан ЛДСП 18мм', cat:'Хавтан', type:'ЛДСП', unit:'м²', thick:'18мм', price:28000, oldPrice:32000, stock:50, isNew:false, isFeat:true, img:'🪵' },
  { id:2, code:'LDSP-BR-18', name:'Бор ЛДСП 18мм', cat:'Хавтан', type:'ЛДСП', unit:'м²', thick:'18мм', price:28000, oldPrice:null, stock:30, isNew:false, isFeat:true, img:'🪵' },
  { id:3, code:'MDF-WH-16', name:'Цагаан МДФ 16мм', cat:'Хавтан', type:'МДФ', unit:'м²', thick:'16мм', price:32000, oldPrice:35000, stock:15, isNew:true, isFeat:true, img:'🪵' },
  { id:4, code:'HDF-WH-4', name:'Цагаан HDF 4мм', cat:'Хавтан', type:'HDF', unit:'м²', thick:'4мм', price:8000, oldPrice:null, stock:40, isNew:false, isFeat:false, img:'🪵' },
  { id:5, code:'ABS-WH-04', name:'Цагаан ABS 0.4мм', cat:'Ирмэг наалт', type:'ABS ирмэг', unit:'м', thick:'—', price:800, oldPrice:null, stock:200, isNew:false, isFeat:true, img:'📏' },
  { id:6, code:'HNG-BLU-35', name:'Blum нугас 35мм', cat:'Тавилгын тоноглол', type:'Нугас', unit:'ш', thick:'—', price:4500, oldPrice:5000, stock:500, isNew:true, isFeat:true, img:'🔩' },
  { id:7, code:'HDL-SS-128', name:'Ган бариул 128мм', cat:'Тавилгын тоноглол', type:'Бариул', unit:'ш', thick:'—', price:2800, oldPrice:null, stock:300, isNew:true, isFeat:false, img:'🔧' },
];

const BANNERS = [
  { bg:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', tag:'⚡ АВТОМАТ ТООЦООЛОЛ', title:'Тавилгын материалаа', accent:'онлайнаар тооцоол', sub:'', btn:'Тооцоолол хийх', emoji:'⚡' },
  { bg:'linear-gradient(135deg,#1c1917,#16213e,#0f3460)', tag:'🪵 ӨНДӨР ЧАНАР', title:'ЛДСП & МДФ', accent:'хавтан материал', sub:'Европын стандарттай, 18мм зузаан ЛДСП болон МДФ хавтангуудыг нэг дороос авна', btn:'Бүгдийг харах', emoji:'🪵' },
  { bg:'linear-gradient(135deg,#1b1b2f,#2c2c54,#474787)', tag:'🔩 ТАВИЛГЫН ТОНОГЛОЛ', title:'Нугас, бариул,', accent:'шургуулганы зам', sub:'Blum брэндийн нугас, янз бүрийн загварын бариул болон шургуулгыг нийлүүлнэ', btn:'Каталог харах', emoji:'🔩' },
];

export default function LandingPage() {
  const router = useRouter();

  // ── БҮГД STATE ЭНД ──
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string|null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [activeCat, setActiveCat] = useState('Бүгд');
  const [authUser, setAuthUser] = useState<any>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [profileDrop, setProfileDrop] = useState(false);
  const calcRef = useRef<HTMLDivElement>(null);

  // ── БҮГД USEEFFECT ЭНД ──
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
    const t = setInterval(() => setBannerIdx(p => (p+1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);

  // ── COMPUTED VALUES ──
  const matCats = ['Бүгд', ...Array.from(new Set(MATERIALS.map(m => m.cat)))];
  const filteredMat = activeCat === 'Бүгд' ? MATERIALS : MATERIALS.filter(m => m.cat === activeCat);
  const featMat = MATERIALS.filter(m => m.isFeat).slice(0, 4);
  const newMat = MATERIALS.filter(m => m.isNew).slice(0, 4);
  const banner = BANNERS[bannerIdx];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuthUser(null);
    setProfileDrop(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Plus Jakarta Sans',sans-serif;color:#1c1917;background:#fff;-webkit-font-smoothing:antialiased}

        

        .header{background:white;border-bottom:1px solid #f0f0f0;padding:0 32px;position:sticky;top:0;z-index:200;transition:box-shadow 0.3s}
        .header.up{box-shadow:0 2px 16px rgba(0,0,0,0.08)}
        .header-inner{max-width:1400px;margin:0 auto;height:72px;display:flex;align-items:center;gap:20px}
        .h-brand{display:flex;align-items:center;gap:10px;cursor:pointer;flex-shrink:0}
        .h-logo{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:22px}
        .h-name{font-size:20px;font-weight:800;color:#1c1917;letter-spacing:-0.02em}
        .h-sep{width:1px;height:32px;background:#e5e7eb;margin:0 4px;flex-shrink:0}
        .h-search{flex:1;max-width:480px;display:flex;align-items:center;gap:10px;background:#f5f5f7;border:1.5px solid #f5f5f7;border-radius:12px;padding:10px 16px;transition:all 0.2s;cursor:text}
        .h-search:focus-within{border-color:#d97706;background:white;box-shadow:0 0 0 3px rgba(217,119,6,0.1)}
        .h-search input{background:none;border:none;outline:none;font-size:14px;color:#1c1917;width:100%;font-family:inherit}
        .h-search input::placeholder{color:#9ca3af}
        .h-right{margin-left:auto;display:flex;align-items:center;gap:0}
        .h-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 16px;cursor:pointer;border:none;background:none;font-family:inherit;transition:all 0.15s;border-radius:10px}
        .h-btn:hover{background:#f5f5f7}
        .h-btn-icon{font-size:20px;line-height:1}
        .h-btn-label{font-size:11px;color:#374151;font-weight:500;white-space:nowrap}

        /* PROFILE DROPDOWN */
        .prof-chip{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;background:#f5f5f7;border-radius:12px;cursor:pointer;position:relative;transition:all 0.15s;margin-left:8px}
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

        .catbar{background:white;border-bottom:1.5px solid #f0f0f0;padding:0 32px;position:sticky;top:72px;z-index:190}
        .catbar-inner{max-width:1400px;margin:0 auto;display:flex;align-items:stretch;height:48px}
        .cat-all{display:flex;align-items:center;gap:8px;padding:0 20px;font-size:13px;font-weight:700;color:#1c1917;cursor:pointer;border-right:1.5px solid #f0f0f0;white-space:nowrap;transition:all 0.15s;flex-shrink:0}
        .cat-all:hover{background:#f9fafb;color:#d97706}
        .cat-link{display:flex;align-items:center;padding:0 20px;font-size:13px;font-weight:600;color:#374151;cursor:pointer;white-space:nowrap;position:relative;transition:all 0.15s;border:none;background:none;font-family:inherit;letter-spacing:0.01em}
        .cat-link:hover,.cat-link.open{color:#1c1917}
        .cat-link::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:#1c1917;transform:scaleX(0);transition:transform 0.2s;transform-origin:left}
        .cat-link.open::after,.cat-link:hover::after{transform:scaleX(1)}
        .cat-extra{margin-left:auto;display:flex;align-items:center;gap:4px}
        .cat-extra-link{font-size:12px;font-weight:600;color:#6b7280;padding:0 14px;cursor:pointer;transition:color 0.15s;border:none;background:none;font-family:inherit;height:100%}
        .cat-extra-link:hover{color:#1c1917}

        .mega{position:fixed;top:120px;left:0;right:0;background:white;border-top:1px solid #f0f0f0;box-shadow:0 12px 40px rgba(0,0,0,0.12);z-index:185;animation:mIn 0.2s ease}
        @keyframes mIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .mega-inner{max-width:1400px;margin:0 auto;padding:28px 32px 36px;display:flex;gap:0}
        .mega-col{min-width:200px;padding-right:40px}
        .mega-col-t{font-size:13px;font-weight:700;color:#1c1917;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f3f4f6}
        .mega-item{display:block;font-size:13px;color:#6b7280;padding:7px 0;cursor:pointer;transition:all 0.15s;border:none;background:none;font-family:inherit;text-align:left;width:100%}
        .mega-item:hover{color:#d97706;padding-left:4px}
        .mega-all-btn{display:inline-flex;align-items:center;gap:8px;background:#1c1917;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .mega-all-btn:hover{background:#374151}

        .main{max-width:1400px;margin:0 auto;padding:0 32px}

        /* BANNER */
        .banner-wrap{border-radius:20px;overflow:hidden;margin:24px 0;position:relative;height:400px;display:flex;align-items:center}
        .banner-bg{position:absolute;inset:0}
        .banner-pattern{position:absolute;inset:0;opacity:0.04;background-image:repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%);background-size:20px 20px}
        .banner-glow{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none}
        .banner-content{position:relative;z-index:2;padding:52px 60px;flex:1;max-width:560px}
        .banner-eyebrow{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;padding:5px 14px;border-radius:100px;margin-bottom:18px;letter-spacing:0.08em}
        .banner-h{font-size:clamp(28px,4vw,50px);font-weight:800;color:white;line-height:1.1;margin-bottom:10px;letter-spacing:-0.025em}
        .banner-accent{background:linear-gradient(90deg,white,rgba(255,255,255,0.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .banner-sub{font-size:15px;color:rgba(255,255,255,0.7);margin-bottom:28px;line-height:1.65;max-width:420px}
        .banner-btns{display:flex;gap:10px;flex-wrap:wrap}
        .banner-btn-p{display:inline-flex;align-items:center;gap:8px;background:white;color:#1c1917;border:none;border-radius:11px;padding:12px 24px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 6px 20px rgba(0,0,0,0.2)}
        .banner-btn-p:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,0.3)}
        .banner-btn-s{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.1);color:white;border:1.5px solid rgba(255,255,255,0.25);border-radius:11px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;backdrop-filter:blur(8px)}
        .banner-btn-s:hover{background:rgba(255,255,255,0.18)}
        .banner-visual{position:absolute;right:0;top:0;bottom:0;width:40%;display:flex;align-items:center;justify-content:center;z-index:1;overflow:hidden;pointer-events:none}
        .banner-emoji-big{font-size:clamp(100px,14vw,180px);opacity:0.15;animation:floatUp 4s ease-in-out infinite}
        @keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        .banner-dots{position:absolute;bottom:20px;left:56px;display:flex;gap:6px;z-index:3}
        .b-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.35);cursor:pointer;transition:all 0.25s}
        .b-dot.on{width:22px;border-radius:3px;background:white}
        .banner-arrows{position:absolute;bottom:16px;right:24px;display:flex;gap:8px;z-index:3}
        .b-arr{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.15s;backdrop-filter:blur(8px)}
        .b-arr:hover{background:rgba(255,255,255,0.25)}

        .sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .sec-title{font-size:20px;font-weight:800;color:#1c1917;letter-spacing:-0.01em}
        .sec-more{font-size:13px;font-weight:600;color:#d97706;cursor:pointer;border:none;background:none;font-family:inherit;display:flex;align-items:center;gap:4px;padding:0;transition:gap 0.15s}
        .sec-more:hover{gap:8px}

        .prod-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:40px}
        .prod-card{background:white;border:1.5px solid #f3f4f6;border-radius:16px;overflow:hidden;cursor:pointer;transition:all 0.2s}
        .prod-card:hover{border-color:#e0e0e0;box-shadow:0 8px 28px rgba(0,0,0,0.08);transform:translateY(-3px)}
        .prod-img{height:160px;background:linear-gradient(135deg,#f9fafb,#f3f4f6);display:flex;align-items:center;justify-content:center;font-size:56px;position:relative}
        .prod-badge{position:absolute;top:10px;left:10px;font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px}
        .badge-new{background:#1c1917;color:white}
        .badge-sale{background:#ef4444;color:white}
        .prod-body{padding:14px}
        .prod-cat{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px}
        .prod-name{font-size:13px;font-weight:700;color:#1c1917;margin-bottom:4px;line-height:1.4}
        .prod-code{font-size:11px;color:#9ca3af;font-family:monospace;margin-bottom:10px}
        .prod-price-row{display:flex;align-items:center;justify-content:space-between}
        .prod-price{font-size:16px;font-weight:800;color:#1c1917}
        .prod-old{font-size:11px;color:#9ca3af;text-decoration:line-through;margin-left:6px}
        .prod-unit{font-size:11px;color:#9ca3af;font-weight:500}
        .prod-cart{width:32px;height:32px;border-radius:8px;background:#f3f4f6;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.15s}
        .prod-card:hover .prod-cart{background:#1c1917;color:white}

        /* MATERIALS TABLE */
        .mat-sec{background:#f9fafb;border-radius:20px;padding:28px;margin-bottom:40px}
        .mat-filter{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
        .mf{font-size:12px;font-weight:600;padding:6px 16px;border-radius:100px;border:1.5px solid #e5e7eb;background:white;cursor:pointer;color:#6b7280;font-family:inherit;transition:all 0.15s}
        .mf.on{background:#1c1917;color:white;border-color:#1c1917}
        .mat-table{background:white;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}
        .mat-th{display:grid;grid-template-columns:100px 1fr 120px 60px 90px 90px;padding:10px 16px;background:#f9fafb;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #f3f4f6;gap:10px}
        .mat-tr{display:grid;grid-template-columns:100px 1fr 120px 60px 90px 90px;padding:12px 16px;border-bottom:1px solid #f9fafb;align-items:center;gap:10px;transition:background 0.1s;cursor:pointer}
        .mat-tr:last-child{border-bottom:none}
        .mat-tr:hover{background:#fafafa}
        .mcode{font-family:monospace;font-size:11px;color:#d97706;font-weight:700;background:#fef3c7;padding:3px 8px;border-radius:6px}
        .stock-b{font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px}

        /* CALC CTA */
        .calc-cta{background:linear-gradient(135deg,#1c1917,#292524);border-radius:20px;padding:48px 52px;margin-bottom:40px;display:flex;align-items:center;justify-content:space-between;gap:32px;position:relative;overflow:hidden}
        .calc-cta::before{content:'';position:absolute;top:-60px;right:-60px;width:280px;height:280px;background:radial-gradient(circle,rgba(217,119,6,0.3),transparent 70%);border-radius:50%}
        .calc-cta-l{}
        .calc-eyebrow{font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px}
        .calc-title{font-size:clamp(22px,3vw,34px);font-weight:800;color:white;margin-bottom:10px;letter-spacing:-0.02em;line-height:1.15}
        .calc-desc{font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;max-width:420px}
        .calc-cta-r{display:flex;flex-direction:column;gap:12px;flex-shrink:0}
        .calc-go-btn{background:linear-gradient(135deg,#d97706,#b45309);color:white;border:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 6px 20px rgba(217,119,6,0.4);white-space:nowrap}
        .calc-go-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(217,119,6,0.5)}
        .calc-mat-btn{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.8);border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;text-align:center;white-space:nowrap}
        .calc-mat-btn:hover{background:rgba(255,255,255,0.14)}

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
        .fb-links{display:flex;gap:20px}
        .fb-l{font-size:12px;color:rgba(255,255,255,0.25);cursor:pointer;border:none;background:none;font-family:inherit;transition:color 0.15s}
        .fb-l:hover{color:rgba(255,255,255,0.7)}

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
        @media(max-width:900px){.prod-grid{grid-template-columns:repeat(2,1fr)}.calc-cta{flex-direction:column;padding:32px}.mat-th,.mat-tr{grid-template-columns:80px 1fr 60px 80px}.hide-md{display:none}.topbar{display:none}.footer-top{grid-template-columns:1fr 1fr}}
        @media(max-width:600px){.prod-grid{grid-template-columns:repeat(2,1fr)}.main{padding:0 16px}.header{padding:0 16px}.catbar{padding:0 16px}.mat-th,.mat-tr{grid-template-columns:1fr 70px 80px}.hide-sm{display:none}.footer-top{grid-template-columns:1fr}.footer-bot{flex-direction:column;gap:10px;text-align:center}.banner-content{padding:32px 24px}.banner-visual{display:none}}
      `}</style>

      {/* HEADER */}
      <header
        className={`header ${scrolled ? 'up' : ''}`}
        onClick={() => setProfileDrop(false)}
      >
        <div className="header-inner">
          <div className="h-brand" onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
            <div className="h-logo">🪑</div>
            <div className="h-name">FurniCalc</div>
          </div>
          <div className="h-sep" />
          <div className="h-search">
            <span style={{ fontSize:16, color:'#9ca3af' }}>🔍</span>
            <input placeholder="Бүтээгдэхүүн хайх..." />
          </div>

          <div className="h-right">
            {/* Тооцоолол товч — хоёуланд */}
            <button className="h-btn" onClick={() => router.push('/calculate')}>
              <span className="h-btn-icon">📐</span>
              <span className="h-btn-label">Тооцоолол</span>
            </button>

            {/* Материал товч — хоёуланд */}
            {authUser ? (
              <>
                {/* Сагс */}
                <button className="h-btn" onClick={() => router.push('/profile')}>
                  <span className="h-btn-icon">🛒</span>
                  <span className="h-btn-label">Сагс</span>
                </button>

                {/* Profile chip + dropdown */}
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
                        <div style={{ fontSize:13, fontWeight:700, color:'#1c1917' }}>
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
              <div style={{ display:'flex', gap:8, marginLeft:8 }}>
                <button
                  onClick={() => router.push('/auth/login')}
                  style={{ background:'white', color:'#1c1917', border:'1.5px solid #e5e7eb', borderRadius:11, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#d97706'; (e.currentTarget as HTMLElement).style.color='#d97706'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#e5e7eb'; (e.currentTarget as HTMLElement).style.color='#1c1917'; }}
                >
                  Нэвтрэх
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  style={{ background:'#d97706', color:'#1c1917', border:'none', borderRadius:11, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#b45309'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='#d97706'}
                >
                  Бүртгүүлэх
                </button>
              </div>
            )}
          </div>
        </div>

        </header>

        
        {/* BANNER */}
{/* BANNER */}
<div style={{ margin:'14px 8px 48px 8px' }}>
  <style>{`
    @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes fadeSlide{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
    .hero-wrap{border-radius:28px;overflow:hidden;background:linear-gradient(135deg,#fffbf5 0%,#fef3c7 50%,#fffbf5 100%);padding:60px 64px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;position:relative;min-height:480px}
    .hero-wrap::before{content:'';position:absolute;top:-60px;right:-60px;width:400px;height:400px;background:radial-gradient(circle,rgba(217,119,6,0.12),transparent 70%);border-radius:50%;pointer-events:none}
    .hero-wrap::after{content:'';position:absolute;bottom:-40px;left:40%;width:300px;height:300px;background:radial-gradient(circle,rgba(251,191,36,0.1),transparent 70%);border-radius:50%;pointer-events:none}
    .hero-badge{display:inline-flex;align-items:center;gap:8px;background:white;border:1.5px solid #fde68a;border-radius:100px;padding:6px 16px 6px 10px;font-size:12px;font-weight:700;color:#92400e;margin-bottom:22px;box-shadow:0 2px 8px rgba(217,119,6,0.12)}
    .hero-badge-dot{width:8px;height:8px;border-radius:50%;background:#d97706}
    .hero-h{font-size:clamp(36px,5vw,58px);font-weight:800;color:#1c1917;line-height:1.06;letter-spacing:-0.03em;margin-bottom:16px}
    .hero-h .hero-accent{color:#d97706}
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
    .hero-badge-dots{position:absolute;bottom:24px;left:64px;display:flex;gap:6px}
    .hbd{width:6px;height:6px;border-radius:50%;background:#fde68a;cursor:pointer;transition:all 0.25s}
    .hbd.on{width:22px;border-radius:3px;background:#d97706}
    @media(max-width:900px){.hero-wrap{grid-template-columns:1fr;padding:40px 32px;gap:32px;min-height:auto}.hero-r{display:none}}
    @media(max-width:600px){.hero-wrap{padding:32px 20px}.hero-stats{gap:16px}}
  `}</style>

  <div className="hero-wrap">
    {/* ЗҮҮН */}
    <div style={{ position:'relative', zIndex:1, animation:'fadeSlide 0.6s ease' }}>
      <div className="hero-badge">
        <div className="hero-badge-dot" />
        Тавилгын материалын тооцооны систем
      </div>
      <h1 className="hero-h">
        Тавилгын материалын<br />
        <span className="hero-accent">автомат тооцоо</span>
      </h1>
      <p className="hero-p">
        Хэмжээ, материал, эд ангийг оруулахад л автоматаар хавтангийн хэмжээ, ирмэг наалт, үнэ зэргийг тооцоолно. DIY хэрэглэгч, мужаан, цех бүхний тулд.
      </p>
      <div className="hero-btns">
        <button className="hero-btn-p" onClick={() => router.push('/calculate')}>
          <span>⊞</span> Тооцоогоо эхлэх
        </button>
        <button className="hero-btn-s" onClick={() => router.push('/auth/register')}>
          → Үнэгүй бүртгүүлэх
        </button>
      </div>
      <div className="hero-stats">
        {[
          { val:'100%', lab:'Автомат' },
          null,
          { val:'7+', lab:'Тавилгын төрөл' },
          null,
          { val:'0₮', lab:'Үнэгүй ашиглах' },
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

    {/* БАРУУН — Тавилгын SVG */}
    <div className="hero-r">
      <svg className="furniture-svg" viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Шкафны гадна хайрцаг */}
        <rect x="60" y="60" width="360" height="300" rx="8" fill="#fef3c7" stroke="#fde68a" strokeWidth="2"/>
        {/* Хуваагч хэвтээ шугам */}
        <rect x="60" y="210" width="360" height="6" fill="#fde68a"/>
        {/* Хуваагч босоо шугам */}
        <rect x="237" y="60" width="6" height="300" fill="#fde68a"/>

        {/* Дээд зүүн хаалга */}
        <rect x="70" y="70" width="160" height="132" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
        {/* Дээд баруун хаалга */}
        <rect x="250" y="70" width="160" height="132" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
        {/* Доод зүүн хаалга */}
        <rect x="70" y="224" width="160" height="126" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
        {/* Доод баруун хаалга */}
        <rect x="250" y="224" width="160" height="126" rx="4" fill="white" stroke="#fde68a" strokeWidth="1.5"/>

        {/* Бариулууд */}
        <rect x="138" y="128" width="24" height="6" rx="3" fill="#d97706"/>
        <rect x="318" y="128" width="24" height="6" rx="3" fill="#d97706"/>
        <rect x="138" y="280" width="24" height="6" rx="3" fill="#d97706"/>
        <rect x="318" y="280" width="24" height="6" rx="3" fill="#d97706"/>

        {/* Хөл */}
        <rect x="80" y="360" width="24" height="28" rx="4" fill="#d97706"/>
        <rect x="376" y="360" width="24" height="28" rx="4" fill="#d97706"/>

        {/* Чимэглэл — тавилгын дотор тавиур */}
        <rect x="75" y="160" width="150" height="3" rx="1.5" fill="#fde68a"/>
        <rect x="255" y="160" width="150" height="3" rx="1.5" fill="#fde68a"/>

        {/* Гялбаа эффект */}
        <rect x="72" y="72" width="40" height="128" rx="3" fill="white" opacity="0.4"/>
        <rect x="252" y="72" width="40" height="128" rx="3" fill="white" opacity="0.4"/>

        {/* Хэмжээний шугамууд */}
        <line x1="30" y1="60" x2="30" y2="360" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
        <line x1="24" y1="60" x2="36" y2="60" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
        <line x1="24" y1="360" x2="36" y2="360" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
        <text x="18" y="215" fill="#d97706" fontSize="11" fontWeight="700" textAnchor="middle" transform="rotate(-90,18,215)" opacity="0.7">2100мм</text>

        <line x1="60" y1="400" x2="420" y2="400" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
        <line x1="60" y1="394" x2="60" y2="406" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
        <line x1="420" y1="394" x2="420" y2="406" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
        <text x="240" y="416" fill="#d97706" fontSize="11" fontWeight="700" textAnchor="middle" opacity="0.7">1200мм</text>

        {/* Тооцооллын badge */}
        <g transform="translate(320, 40)">
          <rect width="120" height="36" rx="18" fill="#d97706" opacity="0.95"/>
          <text x="60" y="23" fill="white" fontSize="12" fontWeight="800" textAnchor="middle">⚡ Тооцоолол</text>
        </g>

        {/* Материал badge */}
        <g transform="translate(36, 300)">
          <rect width="100" height="32" rx="16" fill="white" stroke="#fde68a" strokeWidth="1.5"/>
          <text x="50" y="21" fill="#92400e" fontSize="11" fontWeight="700" textAnchor="middle">🪵 ЛДСП 18мм</text>
        </g>
      </svg>
    </div>

    {/* Slider dots */}
   
  </div>
</div>
        {/* ОНЦЛОХ БҮТЭЭГДЭХҮҮН */}
        <div style={{ marginBottom:40,  marginRight: 40, marginLeft: 40 }}>
          <div className="sec-head">
            <div className="sec-title">⭐ Онцлох бүтээгдэхүүн</div>
            <button className="sec-more" onClick={() => router.push('/materials-page')}>Бүгдийг харах →</button>
          </div>
          <div className="prod-grid">
            {featMat.map(m => (
              <div key={m.id} className="prod-card" onClick={() => router.push('/materials-page/${material.id')}>
                <div className="prod-img">
                  <span>{m.img}</span>
                  {m.isNew && <span className="prod-badge badge-new">ШИНЭ</span>}
                  {m.oldPrice && <span className="prod-badge badge-sale" style={{ left:'auto', right:10 }}>ХЯМДРАЛ</span>}
                </div>
                <div className="prod-body">
                  <div className="prod-cat">{m.cat} · {m.type}</div>
                  <div className="prod-name">{m.name}</div>
                  <div className="prod-code">{m.code}</div>
                  <div className="prod-price-row">
                    <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                      <span className="prod-price">₮{m.price.toLocaleString()}</span>
                      {m.oldPrice && <span className="prod-old">₮{(m.oldPrice as number).toLocaleString()}</span>}
                      <span className="prod-unit">/ {m.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ШИНЭ БҮТЭЭГДЭХҮҮН */}
        <div style={{ marginBottom:40, marginRight: 40, marginLeft: 40 }}>
          <div className="sec-head">
            <div className="sec-title">🆕 Шинэ бүтээгдэхүүн</div>
            <button className="sec-more" onClick={() => router.push('/materials-page')}>Бүгдийг харах →</button>
          </div>
          <div className="prod-grid">
            {newMat.map(m => (
              <div key={m.id} className="prod-card" onClick={() => router.push('/materials-page/${material.id}')}>
                {/* Материал товч */}

                <div className="prod-img">
                  <span>{m.img}</span>
                  <span className="prod-badge badge-new">ШИНЭ</span>
                </div>
                <div className="prod-body">
                  <div className="prod-cat">{m.cat} · {m.type}</div>
                  <div className="prod-name">{m.name}</div>
                  <div className="prod-code">{m.code}</div>
                  <div className="prod-price-row">
                    <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                      <span className="prod-price">₮{m.price.toLocaleString()}</span>
                      <span className="prod-unit">/ {m.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        
    {/* ТООЦООЛОЛ CTA */}
<div ref={calcRef} style={{ marginBottom:48, marginRight: 68, marginLeft: 68}}>
  <div style={{
    background:'linear-gradient(135deg,#d97706 0%,#b45309 60%,#92400e 100%)',
    borderRadius:24,
    padding:'56px 48px',
    textAlign:'center',
    position:'relative',
    overflow:'hidden',
  }}>
    {/* Орон зайн чимэглэл */}
    <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:-80, right:-40, width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', top:'20%', right:'8%', width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

    {/* Агуулга */}
    <div style={{ position:'relative', zIndex:1 }}>
      <div style={{ fontSize:'clamp(24px, 4vw, 36px)', fontWeight:800, color:'white', marginBottom:14, letterSpacing:'-0.02em', lineHeight:1.15 }}>
       Тавилгын материалаа онлайнаар тооцоол
      </div>
      <p style={{ fontSize:15, color:'rgba(255,255,255,0.8)', marginBottom:36, lineHeight:1.7, maxWidth:460, margin:'0 auto 36px' }}>
        Хэмжээ оруулахад л хавтангийн талбай, ирмэг наалт, тоог автоматаар бодно.
      </p>
      <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
        <button
          onClick={() => router.push('/calculate')}
          style={{ background:'white', color:'#b45309', border:'none', borderRadius:12, padding:'14px 32px', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'; }}
        >
          Хялбар тооцоо
        </button>
        <button
          onClick={() => router.push('/auth/register')}
          style={{ background:'transparent', color:'white', border:'2px solid rgba(255,255,255,0.7)', borderRadius:12, padding:'14px 32px', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.borderColor='white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.7)'; }}
        >
          Бүртгүүлэх
        </button>
      </div>
    </div>
  </div>
</div>

      {/* FOOTER */}
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
          <div className="fb-copy">© 2026 FurniCalc</div>
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
              <p>Таны мэдээлэл гуравдагч этгээдэд дамжуулахгүй. Нууц үг bcrypt-ээр хадгалагдана.</p>
              <h3>4. Хариуцлага</h3>
              <p>Тооцооллын нарийвчлал оруулсан хэмжээнээс хамаарна. Хэрэглэгч өөрийн мэдээллийн үнэн зөвийг хариуцна.</p>
              <div style={{ marginTop:16, padding:'12px 14px', background:'#f9fafb', borderRadius:10, fontSize:12, color:'#9ca3af' }}>
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
              <div style={{ textAlign:'center', padding:'16px 0 24px' }}>
                <div style={{ width:60, height:60, borderRadius:14, background:'linear-gradient(135deg,#d97706,#b45309)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 12px' }}>🪑</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#1c1917', marginBottom:4 }}>FurniCalc</div>
                <div style={{ fontSize:13, color:'#9ca3af' }}>Тавилгын материалын тооцооны систем</div>
              </div>
              <h3>Системийн тухай</h3>
              <p>FurniCalc нь Монголын тавилгын салбарт зориулсан дипломын ажил. MySQL, Node.js, Next.js ашиглан хийгдсэн.</p>
              <h3>Хөгжүүлэгч</h3>
              <p>Б.Хонгорзул · В222270132 · 2026</p>
              <div style={{ marginTop:16, display:'flex', flexWrap:'wrap', gap:6 }}>
                {['Next.js 14','Node.js','MySQL','Prisma','TypeScript','JWT','mathjs'].map(t => (
                  <span key={t} style={{ fontSize:11, fontWeight:600, padding:'4px 10px', background:'#f3f4f6', borderRadius:100, color:'#374151' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}