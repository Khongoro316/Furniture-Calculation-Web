// frontend/components/CartToast.tsx
// Сагсанд нэмэгдэх үед гарах toast notification

'use client';

import { useEffect, useState } from 'react';

interface Toast {
  id: number;
  name: string;
  img?: string;
}

interface Props {
  toasts: Toast[];
  onNavigateCart: () => void;
}

export default function CartToast({ toasts, onNavigateCart }: Props) {
  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(100%) scale(0.9); }
        }
        @keyframes progBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .toast-wrap {
          position: fixed;
          bottom: 28px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .toast-card {
          pointer-events: all;
          width: 320px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06);
          overflow: hidden;
          animation: toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
          position: relative;
        }
        .toast-card.out {
          animation: toastOut 0.25s ease forwards;
        }
        .toast-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px 16px;
        }
        .toast-check {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 18px;
        }
        .toast-img {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid #f0f0f0;
        }
        .toast-label {
          font-size: 10px;
          font-weight: 700;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .toast-name {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 180px;
        }
        .toast-cart-btn {
          margin-left: auto;
          background: linear-gradient(135deg,#d97706,#b45309);
          color: white;
          border: none;
          border-radius: 9px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .toast-cart-btn:hover { opacity: 0.88; }
        .toast-prog {
          height: 3px;
          background: #d97706;
          animation: progBar 3s linear forwards;
          transform-origin: left;
        }
      `}</style>

      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast-card">
            <div className="toast-inner">
              {t.img ? (
                <img src={t.img} className="toast-img" alt="" />
              ) : (
                <div className="toast-check">✅</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="toast-label">Сагсанд нэмэгдлээ</div>
                <div className="toast-name">{t.name}</div>
              </div>
              <button className="toast-cart-btn" onClick={onNavigateCart}>
                🛒 Сагс
              </button>
            </div>
            <div className="toast-prog" />
          </div>
        ))}
      </div>
    </>
  );
}