// frontend/hooks/useCart.ts
// Сагсны global state + toast notification

import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  price: number;
  image_url?: string;
  type_name?: string;
  quantity: number;
}

export interface ToastMsg {
  id: number;
  name: string;
  img?: string;
}

const CART_KEY = 'furni_cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const addToCart = useCallback((mat: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === mat.id);
      let next: CartItem[];
      if (idx >= 0) {
        next = prev.map((i, j) => j === idx ? { ...i, quantity: i.quantity + qty } : i);
      } else {
        next = [...prev, { ...mat, quantity: qty }];
      }
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });

    // Toast
    const toastId = Date.now();
    setToasts(p => [...p, { id: toastId, name: mat.name, img: mat.image_url }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== toastId)), 3000);
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, quantity: qty } : i);
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, toasts, addToCart, removeFromCart, updateQty, clearCart, total, count };
}