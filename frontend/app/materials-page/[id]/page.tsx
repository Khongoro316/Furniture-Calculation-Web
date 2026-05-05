'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const MATERIALS = [
  { id:1, code:'LDSP-WH-18', name:'Цагаан ЛДСП 18мм', cat:'Хавтан', type:'ЛДСП', unit:'м²', thick:'18мм', price:28000, oldPrice:32000, stock:50, isNew:false, img:'🪵', desc:'Цагаан өнгийн ЛДСП хавтан нь шкаф, гал тогооны тавилга, ширээ, тавиур зэрэг тавилгын үндсэн хийцэд тохиромжтой.' },
  { id:2, code:'LDSP-BR-18', name:'Бор ЛДСП 18мм', cat:'Хавтан', type:'ЛДСП', unit:'м²', thick:'18мм', price:28000, oldPrice:null, stock:30, isNew:false, img:'🪵', desc:'Бор өнгийн ЛДСП хавтан нь модон өнгө төрхтэй тавилгын хийцэд ашиглахад тохиромжтой.' },
  { id:3, code:'MDF-WH-16', name:'Цагаан МДФ 16мм', cat:'Хавтан', type:'МДФ', unit:'м²', thick:'16мм', price:32000, oldPrice:35000, stock:15, isNew:true, img:'🪵', desc:'Цагаан МДФ хавтан нь гадаргуу сайтай, өнгөлгөө болон тавилгын нүүр хэсэгт ашиглахад тохиромжтой.' },
  { id:4, code:'HDF-WH-4', name:'Цагаан HDF 4мм', cat:'Хавтан', type:'HDF', unit:'м²', thick:'4мм', price:8000, oldPrice:null, stock:40, isNew:false, img:'🪵', desc:'HDF хавтан нь тавилгын ар тал, шүүгээний ёроол болон нимгэн хийцэд ашиглагдана.' },
  { id:5, code:'ABS-WH-04', name:'Цагаан ABS 0.4мм', cat:'Ирмэг наалт', type:'ABS ирмэг', unit:'м', thick:'—', price:800, oldPrice:null, stock:200, isNew:false, img:'📏', desc:'ABS ирмэг наалт нь хавтангийн ирмэгийг хамгаалж, өнгө үзэмжийг сайжруулна.' },
  { id:6, code:'HNG-BLU-35', name:'Blum нугас 35мм', cat:'Тавилгын тоноглол', type:'Нугас', unit:'ш', thick:'—', price:4500, oldPrice:5000, stock:500, isNew:true, img:'🔩', desc:'Blum 35мм нугас нь хаалгатай тавилгад ашиглагдах чанартай тоноглол юм.' },
  { id:7, code:'HDL-SS-128', name:'Ган бариул 128мм', cat:'Тавилгын тоноглол', type:'Бариул', unit:'ш', thick:'—', price:2800, oldPrice:null, stock:300, isNew:true, img:'🔧', desc:'Ган бариул нь шкаф, шүүгээ, гал тогооны тавилгын хаалганд тохиромжтой.' },
];

export default function MaterialDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [qty, setQty] = useState(1);

  const id = Number(params.id);
  const material = MATERIALS.find(m => m.id === id);

  if (!material) {
    return (
      <main style={{ padding:40 }}>
        <h1>Материал олдсонгүй</h1>
        <button onClick={() => router.push('/materials-page')}>Буцах</button>
      </main>
    );
  }

  const recommended = MATERIALS
    .filter(m => m.id !== material.id)
    .filter(m => m.cat === material.cat || m.oldPrice || m.isNew)
    .slice(0, 3);

  const addToCart = () => {
    const oldCart = JSON.parse(localStorage.getItem('cart') || '[]');

    const existing = oldCart.find((item: any) => item.id === material.id);

    const updatedCart = existing
      ? oldCart.map((item: any) =>
          item.id === material.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      : [
          ...oldCart,
          {
            id: material.id,
            code: material.code,
            name: material.name,
            price: material.price,
            unit: material.unit,
            img: material.img,
            quantity: qty,
          },
        ];

    localStorage.setItem('cart', JSON.stringify(updatedCart));
    alert('Сагсанд нэмэгдлээ');
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#f8f9fb;color:#1c1917;font-family:Arial,sans-serif}
        .page{min-height:100vh}
        .topnav{height:60px;background:white;border-bottom:1px solid #f0f0f0;padding:0 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
        .nav-btn{border:none;background:#f5f5f7;color:#374151;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer}
        .main{max-width:1180px;margin:0 auto;padding:30px 24px}
        .detail{display:grid;grid-template-columns:1fr 1fr;gap:26px;background:white;border-radius:22px;padding:26px;border:1px solid #f0f0f0;box-shadow:0 8px 30px rgba(0,0,0,.05)}
        .imageBox{position:relative;height:430px;border-radius:20px;background:linear-gradient(135deg,#f9fafb,#f3f4f6);display:flex;align-items:center;justify-content:center;font-size:130px}
        .badge{position:absolute;top:18px;left:18px;border-radius:999px;padding:7px 14px;font-size:12px;font-weight:800;color:white}
        .sale{background:#ef4444}
        .new{background:#1c1917;left:auto;right:18px}
        .code{display:inline-block;background:#fef3c7;color:#d97706;font-size:12px;font-weight:800;border-radius:8px;padding:6px 10px;margin-bottom:12px}
        .title{font-size:32px;font-weight:900;letter-spacing:-.03em;margin-bottom:12px}
        .desc{font-size:15px;line-height:1.8;color:#6b7280;margin:18px 0}
        .priceRow{display:flex;align-items:baseline;gap:10px;margin:18px 0}
        .price{font-size:32px;font-weight:900}
        .old{text-decoration:line-through;color:#9ca3af;font-size:18px}
        .infoGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:22px 0}
        .info{background:#f9fafb;border-radius:14px;padding:14px}
        .info span{display:block;font-size:12px;color:#9ca3af;margin-bottom:4px}
        .info b{font-size:14px}
        .qtyBox{display:flex;align-items:center;gap:12px;margin-top:22px}
        .qtyBtn{width:42px;height:42px;border:1px solid #e5e7eb;background:white;border-radius:12px;font-size:20px;font-weight:800;cursor:pointer}
        .qtyNum{min-width:36px;text-align:center;font-size:18px;font-weight:800}
        .cartBtn{margin-top:22px;width:100%;border:none;background:linear-gradient(135deg,#d97706,#b45309);color:white;border-radius:14px;padding:16px;font-size:15px;font-weight:900;cursor:pointer}
        .note{margin-top:10px;font-size:13px;color:#9ca3af}
        .recTitle{font-size:24px;font-weight:900;margin:36px 0 16px}
        .recGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .recCard{background:white;border:1px solid #f0f0f0;border-radius:18px;padding:16px;cursor:pointer;transition:.2s}
        .recCard:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
        .recImg{height:130px;border-radius:14px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:54px;margin-bottom:12px}
        .recName{font-size:14px;font-weight:800;margin-bottom:6px}
        .recPrice{font-size:16px;font-weight:900}
        @media(max-width:800px){.detail{grid-template-columns:1fr}.imageBox{height:300px}.recGrid{grid-template-columns:1fr}.title{font-size:26px}}
      `}</style>

      <div className="page">
        <nav className="topnav">
          <button className="nav-btn" onClick={() => router.push('/materials-page')}>
            ← Материалууд
          </button>
          <button className="nav-btn" onClick={() => router.push('/cart')}>
            🛒 Сагс
          </button>
        </nav>

        <main className="main">
          <section className="detail">
            <div className="imageBox">
              {material.oldPrice && <span className="badge sale">ХЯМДРАЛТАЙ</span>}
              {material.isNew && <span className="badge new">ШИНЭ</span>}
              <span>{material.img}</span>
            </div>

            <div>
              <span className="code">{material.code}</span>
              <h1 className="title">{material.name}</h1>

              <div className="priceRow">
                <span className="price">₮{material.price.toLocaleString()}</span>
                {material.oldPrice && (
                  <span className="old">₮{material.oldPrice.toLocaleString()}</span>
                )}
                <span style={{ color:'#9ca3af' }}>/ {material.unit}</span>
              </div>

              <p className="desc">{material.desc}</p>

              <div className="infoGrid">
                <div className="info">
                  <span>Ангилал</span>
                  <b>{material.cat}</b>
                </div>
                <div className="info">
                  <span>Төрөл</span>
                  <b>{material.type}</b>
                </div>
                <div className="info">
                  <span>Зузаан</span>
                  <b>{material.thick}</b>
                </div>
                <div className="info">
                  <span>Үлдэгдэл</span>
                  <b>{material.stock} {material.unit}</b>
                </div>
              </div>

              <div className="qtyBox">
                <button className="qtyBtn" onClick={() => setQty(prev => Math.max(1, prev - 1))}>−</button>
                <span className="qtyNum">{qty}</span>
                <button className="qtyBtn" onClick={() => setQty(prev => prev + 1)}>+</button>
              </div>

              <button className="cartBtn" onClick={addToCart}>
                🛒 Сагсанд нэмэх
              </button>

              <p className="note">
                Захиалга зөвхөн сагснаас үүснэ. Энэ хуудас дээр шууд захиалах товч байхгүй.
              </p>
            </div>
          </section>

          <h2 className="recTitle">Хамт авбал зохимжтой материал</h2>

          <div className="recGrid">
            {recommended.map(item => (
              <div
                key={item.id}
                className="recCard"
                onClick={() => router.push(`/materials-page/${item.id}`)}
              >
                <div className="recImg">{item.img}</div>
                <div className="recName">{item.name}</div>
                <div style={{ color:'#9ca3af', fontSize:12, marginBottom:6 }}>
                  {item.cat} · {item.type}
                </div>
                <div className="recPrice">₮{item.price.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}