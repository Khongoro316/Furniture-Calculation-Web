import { create } from 'zustand';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  org_id?: number;    // ← ЭНЭ МӨРИЙГ НЭМ
  phone?: string;
  is_active?: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>(set => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));