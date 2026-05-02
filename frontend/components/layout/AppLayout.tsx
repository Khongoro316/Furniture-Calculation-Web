'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Супер Админ', admin: 'Админ', accountant: 'Нягтлан',
  order_processor: 'Захиалга боловсруулагч', worker: 'Ажилтан',
  customer: 'Хэрэглэгч', guest: 'Зочин',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#d97706', admin: '#2563eb', accountant: '#0891b2',
  order_processor: '#d97706', worker: '#059669', customer: '#db2777', guest: '#6b7280',
};

const ALL_MENUS = [
  { icon: '⊞', label: 'Хяналтын самбар', path: '/dashboard', roles: ['super_admin','admin','accountant','order_processor','worker','customer'], section: 'Цэс' },
  { icon: '📐', label: 'Тооцоолол', path: '/calculate', roles: ['customer','admin','accountant','order_processor','worker'], section: 'Цэс' },
  { icon: '📦', label: 'Захиалга', path: '/orders', roles: ['order_processor','admin','worker'], section: 'Цэс', badge: true },
  { icon: '🪵', label: 'Материал', path: '/materials', roles: ['accountant','admin'], section: 'Цэс' },
  { icon: '🔧', label: 'Үйлчилгээ', path: '/services', roles: ['accountant','admin'], section: 'Цэс' },
  { icon: '🛒', label: 'Миний захиалга', path: '/my-orders', roles: ['customer'], section: 'Цэс' },
  { icon: '🪑', label: 'Тавилгын төрөл', path: '/furniture-types', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '🗂️', label: 'Материал ангилал', path: '/material-categories', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '⚙️', label: 'Үйлчилгээний төрөл', path: '/service-types', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '👥', label: 'Хэрэглэгч', path: '/users', roles: ['admin'], section: 'Тохиргоо' },
  { icon: '🏢', label: 'Байгууллага', path: '/organizations', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '📊', label: 'Тайлан', path: '/reports', roles: ['admin','super_admin','accountant','order_processor'], section: 'Тайлан' },
  { icon: '📋', label: 'Лог', path: '/audit-logs', roles: ['super_admin'], section: 'Тайлан' },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export default function AppLayout({ children, title, action }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const roleColor = ROLE_COLORS[user?.role || ''] || '#d97706';
  const visibleMenus = ALL_MENUS.filter(m => m.roles.includes(user?.role || ''));
  const sections = [...new Set(visibleMenus.map(m => m.section))];

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif!important;background:#f1f5f9}
        .app-root{display:flex;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}

        /* SIDEBAR */
        .sidebar{width:220px;min-width:220px;background:white;border-right:0.5px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:60;overflow-y:auto;transition:transform 0.25s ease}
        .sb-brand{padding:18px 16px;display:flex;align-items:center;gap:10px;border-bottom:0.5px solid #f1f5f9;flex-shrink:0}
        .sb-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#d97706,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .sb-name{font-size:14px;font-weight:700;color:#0f172a;line-height:1.2}
        .sb-sub{font-size:10px;color:#94a3b8}
        .sb-sec{padding:14px 16px 4px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em}
        .sb-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;color:#64748b;font-size:12px;font-weight:500;transition:all 0.15s;user-select:none}
        .sb-item:hover{background:#f8fafc;color:#0f172a}
        .sb-item.active{background:#fef3c7;color:#d97706;font-weight:600}
        .sb-badge{margin-left:auto;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;background:#fee2e2;color:#ef4444}

        /* OVERLAY */
        .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:55}

        /* MAIN */
        .main-wrap{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh;transition:margin 0.25s ease}

        /* TOPNAV */
        .topnav{height:60px;background:white;border-bottom:0.5px solid #e2e8f0;display:flex;align-items:center;padding:0 20px;gap:10px;position:sticky;top:0;z-index:40;box-shadow:0 1px 3px rgba(0,0,0,0.04);flex-shrink:0}
        .burger{display:none;flex-direction:column;gap:4px;cursor:pointer;padding:6px;border-radius:8px;border:none;background:none}
        .burger span{display:block;width:18px;height:2px;background:#64748b;border-radius:2px;transition:all 0.2s}
        .nav-title{font-size:15px;font-weight:700;color:#0f172a}
        .nav-action{margin-left:auto;display:flex;align-items:center;gap:8px}
        .nav-btn{width:34px;height:34px;border-radius:9px;border:0.5px solid #e2e8f0;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;color:#64748b;transition:all 0.15s;flex-shrink:0}
        .nav-btn:hover{background:#f8fafc}
        .user-pill{display:flex;align-items:center;gap:8px;background:#f8fafc;border:0.5px solid #e2e8f0;border-radius:12px;padding:4px 10px 4px 5px;cursor:pointer;position:relative;transition:all 0.15s;flex-shrink:0}
        .user-pill:hover{border-color:#cbd5e1}
        .u-av{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;flex-shrink:0}
        .u-name{font-size:12px;font-weight:600;color:#0f172a;white-space:nowrap}
        .u-role{font-size:10px;font-weight:600;white-space:nowrap}
        .dropdown{position:absolute;top:calc(100% + 8px);right:0;background:white;border:0.5px solid #e2e8f0;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.1);min-width:200px;overflow:hidden;z-index:200;animation:fadeIn 0.15s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .dd-head{padding:12px 16px;border-bottom:0.5px solid #f1f5f9;background:#fafafa}
        .dd-email{font-size:11px;color:#94a3b8;margin-top:2px}
        .dd-item{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;font-size:13px;color:#374151;font-weight:500;transition:background 0.1s}
        .dd-item:hover{background:#f8fafc}
        .dd-item.danger{color:#ef4444}
        .dd-item.danger:hover{background:#fef2f2}

        /* PAGE */
        .page-body{padding:24px;flex:1}

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .sidebar{transform:translateX(-100%)}
          .sidebar.open{transform:translateX(0)}
          .overlay.open{display:block}
          .main-wrap{margin-left:0}
          .burger{display:flex}
          .u-name,.u-role{display:none}
          .page-body{padding:16px}
        }
        @media (max-width: 480px) {
          .page-body{padding:12px}
          .topnav{padding:0 12px}
        }
      `}</style>

      <div className="app-root" onClick={() => { setDropOpen(false); }}>

        {/* OVERLAY */}
        <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sb-brand">
            <div className="sb-logo">🪑</div>
            <div>
              <div className="sb-name">FurniCalc</div>
              <div className="sb-sub">Тооцооны систем</div>
            </div>
          </div>
          {sections.map(section => (
            <div key={section}>
              <div className="sb-sec">{section}</div>
              {visibleMenus.filter(m => m.section === section).map(menu => (
                <div
                  key={menu.path}
                  className={`sb-item ${pathname === menu.path ? 'active' : ''}`}
                  onClick={() => router.push(menu.path)}
                >
                  <span style={{ fontSize: 15 }}>{menu.icon}</span>
                  {menu.label}
                  {menu.badge && <span className="sb-badge">•</span>}
                </div>
              ))}
            </div>
          ))}
          <div style={{ height: 24 }} />
        </aside>

        {/* MAIN */}
        <div className="main-wrap">

          {/* TOP NAV */}
          <nav className="topnav">
            <button className="burger" onClick={e => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}>
              <span /><span /><span />
            </button>

            {title && <span className="nav-title">{title}</span>}

            <div className="nav-action">
              {action}
              <div className="nav-btn">🔔</div>
              <div
                className="user-pill"
                onClick={e => { e.stopPropagation(); setDropOpen(!dropOpen); }}
              >
                <div className="u-av" style={{ background: roleColor }}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div>
                  <div className="u-name">{user?.last_name} {user?.first_name}</div>
                  <div className="u-role" style={{ color: roleColor }}>{ROLE_LABELS[user?.role || '']}</div>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>▾</span>

                {dropOpen && (
                  <div className="dropdown" onClick={e => e.stopPropagation()}>
                    <div className="dd-head">
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {user?.last_name} {user?.first_name}
                      </div>
                      <div className="dd-email">{user?.email}</div>
                      <div style={{ marginTop: 8, display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: 'white', background: roleColor }}>
                        {ROLE_LABELS[user?.role || '']}
                      </div>
                    </div>
                    <div className="dd-item danger" onClick={() => { logout(); router.push('/auth/login'); }}>
                      🚪 Системээс гарах
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* PAGE BODY */}
          <div className="page-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
