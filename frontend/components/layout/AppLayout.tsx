'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Супер админ',
  admin: 'Админ',
  accountant: 'Нягтлан',
  order_processor: 'Захиалга боловсруулагч',
  worker: 'Ажилтан',
  customer: 'Хэрэглэгч',
  guest: 'Зочин',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#d97706',
  admin: '#2563eb',
  accountant: '#0891b2',
  order_processor: '#d97706',
  worker: '#059669',
  customer: '#db2777',
  guest: '#6b7280',
};

const ALL_MENUS = [
  { icon: '⊞', label: 'Хяналтын самбар', path: '/dashboard', roles: ['super_admin', 'admin', 'accountant', 'order_processor', 'worker', 'customer'], section: 'Үндсэн' },
  { icon: '📐', label: 'Тооцоолол', path: '/calculate', roles: ['customer'], section: 'Үндсэн' },
  { icon: '🛒', label: 'Миний захиалга', path: '/my-orders', roles: ['customer'], section: 'Үндсэн' },
  { icon: '📦', label: 'Захиалга', path: '/orders', roles: ['admin', 'order_processor', 'worker'], section: 'Захиалга', badge: true },
  { icon: '🪵', label: 'Материал', path: '/materials', roles: ['accountant'], section: 'Бараа' },
  { icon: '🔧', label: 'Үйлчилгээ', path: '/services', roles: ['accountant'], section: 'Бараа' },
  { icon: '🪑', label: 'Тавилгын төрөл', path: '/furniture-types', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '🗂️', label: 'Материал ангилал', path: '/material-categories', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '⚙️', label: 'Үйлчилгээний төрөл', path: '/service-types', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '👤', label: 'Админ бүртгэх', path: '/users', roles: ['super_admin'], section: 'Тохиргоо' },
  { icon: '👥', label: 'Ажилтан удирдах', path: '/users', roles: ['admin'], section: 'Тохиргоо' },
  { icon: '📊', label: 'Тайлан', path: '/reports', roles: ['admin', 'super_admin', 'accountant', 'order_processor'], section: 'Тайлан' },
  { icon: '📋', label: 'Лог', path: '/audit-logs', roles: ['super_admin'], section: 'Тайлан' },
];

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  related_type: string | null;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
};

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const roleColor = ROLE_COLORS[user?.role || ''] || '#d97706';
  const visibleMenus = ALL_MENUS.filter((menu) => menu.roles.includes(user?.role || ''));
  const sections = [...new Set(visibleMenus.map((menu) => menu.section))];

  useEffect(() => {
    setSidebarOpen(false);
    setDropOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const loadNotifications = async (showLoader = false) => {
      try {
        if (showLoader) {
          setLoadingNotifications(true);
        }

        const res = await api.get('/api/notifications?limit=12');
        if (cancelled) {
          return;
        }

        setNotifications(Array.isArray(res.data?.items) ? res.data.items : []);
        setUnreadCount(Number(res.data?.unreadCount || 0));
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load notifications:', error);
        }
      } finally {
        if (!cancelled && showLoader) {
          setLoadingNotifications(false);
        }
      }
    };

    loadNotifications(true);
    const intervalId = window.setInterval(() => {
      loadNotifications(false);
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  const isActive = (menuPath: string) => {
    if (menuPath === '/dashboard') {
      return pathname === menuPath;
    }

    return pathname.startsWith(menuPath);
  };

  const refreshNotifications = async (showLoader = false) => {
    if (!user?.id) {
      return;
    }

    try {
      if (showLoader) {
        setLoadingNotifications(true);
      }

      const res = await api.get('/api/notifications?limit=12');
      setNotifications(Array.isArray(res.data?.items) ? res.data.items : []);
      setUnreadCount(Number(res.data?.unreadCount || 0));
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      if (showLoader) {
        setLoadingNotifications(false);
      }
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.is_read) {
        await api.put(`/api/notifications/${notification.id}/read`);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      await refreshNotifications(false);
      setNotificationsOpen(false);
    }

    if (notification.related_type === 'order') {
      router.push(user?.role === 'customer' ? '/my-orders' : '/orders');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      await refreshNotifications(false);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif!important;background:#f1f5f9}
        .app-root{display:flex;min-height:100vh}
        .sidebar{width:220px;min-width:220px;background:white;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:60;overflow-y:auto;transition:transform .25s ease}
        .sb-brand{padding:18px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #f1f5f9;flex-shrink:0}
        .sb-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .sb-name{font-size:14px;font-weight:800;color:#0f172a;line-height:1.2}
        .sb-sub{font-size:10px;color:#94a3b8}
        .sb-sec{padding:14px 16px 4px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em}
        .sb-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;color:#64748b;font-size:12px;font-weight:500;transition:all .15s;user-select:none}
        .sb-item:hover{background:#f8fafc;color:#0f172a}
        .sb-item.active{background:#fef3c7;color:#d97706;font-weight:700}
        .sb-badge{margin-left:auto;font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;background:#fee2e2;color:#ef4444}
        .sb-footer{margin-top:auto;padding:12px 10px;border-top:1px solid #f1f5f9}
        .sb-user{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:#f8fafc}
        .sb-user-av{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0}
        .sb-user-name{font-size:11px;font-weight:700;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sb-user-role{font-size:10px;font-weight:600}
        .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:55}
        .overlay.open{display:block}
        .main-wrap{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .topnav{height:60px;background:white;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 24px;gap:12px;position:sticky;top:0;z-index:40;box-shadow:0 1px 3px rgba(0,0,0,.04);flex-shrink:0}
        .burger{display:none;flex-direction:column;gap:4px;cursor:pointer;padding:6px;border-radius:8px;border:none;background:none}
        .burger span{display:block;width:18px;height:2px;background:#64748b;border-radius:2px}
        .nav-title{font-size:15px;font-weight:700;color:#0f172a}
        .nav-action{margin-left:auto;display:flex;align-items:center;gap:8px}
        .notif-wrap{position:relative}
        .nav-btn{width:34px;height:34px;border-radius:9px;border:1px solid #e2e8f0;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;color:#64748b;position:relative}
        .notif-count{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ef4444;color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .notif-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:360px;background:white;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 12px 32px rgba(15,23,42,.12);overflow:hidden;z-index:220}
        .notif-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f1f5f9}
        .notif-head-title{font-size:13px;font-weight:800;color:#0f172a}
        .notif-head-btn{border:none;background:none;color:#d97706;font-size:11px;font-weight:700;cursor:pointer}
        .notif-list{max-height:420px;overflow:auto}
        .notif-item{padding:14px 16px;border-bottom:1px solid #f8fafc;cursor:pointer;transition:background .15s}
        .notif-item:hover{background:#fffaf0}
        .notif-item.unread{background:#fffbeb}
        .notif-title{font-size:12px;font-weight:800;color:#0f172a}
        .notif-message{margin-top:4px;font-size:12px;line-height:1.45;color:#475569}
        .notif-time{margin-top:6px;font-size:10px;color:#94a3b8}
        .notif-empty,.notif-loading{padding:20px 16px;text-align:center;font-size:12px;color:#64748b}
        .user-pill{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:5px 12px 5px 6px;cursor:pointer;position:relative;transition:all .15s;flex-shrink:0}
        .u-av{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;flex-shrink:0}
        .u-name{font-size:12px;font-weight:600;color:#0f172a;white-space:nowrap}
        .u-role{font-size:10px;font-weight:600;white-space:nowrap}
        .dropdown{position:absolute;top:calc(100% + 8px);right:0;background:white;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.1);min-width:200px;overflow:hidden;z-index:200}
        .dd-head{padding:12px 16px;border-bottom:1px solid #f1f5f9;background:#fafafa}
        .dd-email{font-size:11px;color:#94a3b8;margin-top:2px}
        .dd-item{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;font-size:13px;color:#374151;font-weight:500}
        .dd-item:hover{background:#f8fafc}
        .dd-item.danger{color:#ef4444}
        .dd-item.danger:hover{background:#fef2f2}
        .page-body{padding:24px;flex:1}
        @media(max-width:768px){
          .sidebar{transform:translateX(-100%)}
          .sidebar.open{transform:translateX(0)}
          .overlay.open{display:block}
          .main-wrap{margin-left:0}
          .burger{display:flex}
          .notif-dropdown{width:min(92vw,360px);right:-40px}
          .u-name,.u-role{display:none}
          .page-body{padding:16px}
        }
      `}</style>

      <div
        className="app-root"
        onClick={() => {
          setDropOpen(false);
          setNotificationsOpen(false);
        }}
      >
        <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sb-brand">
            <div className="sb-logo">🪑</div>
            <div>
              <div className="sb-name">FurniCalc</div>
              <div className="sb-sub">Тооцооны систем</div>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section}>
              <div className="sb-sec">{section}</div>
              {visibleMenus
                .filter((menu) => menu.section === section)
                .map((menu) => (
                  <div
                    key={`${menu.path}-${menu.section}`}
                    className={`sb-item ${isActive(menu.path) ? 'active' : ''}`}
                    onClick={() => router.push(menu.path)}
                  >
                    <span style={{ fontSize: 15 }}>{menu.icon}</span>
                    {menu.label}
                    {menu.badge && <span className="sb-badge">•</span>}
                  </div>
                ))}
            </div>
          ))}

          <div className="sb-footer">
            <div className="sb-user">
              <div className="sb-user-av" style={{ background: roleColor }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="sb-user-name">{user?.last_name} {user?.first_name}</div>
                <div className="sb-user-role" style={{ color: roleColor }}>{ROLE_LABELS[user?.role || '']}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-wrap">
          <nav className="topnav">
            <button
              className="burger"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
            >
              <span />
              <span />
              <span />
            </button>

            {title && <span className="nav-title">{title}</span>}

            <div className="nav-action">
              {action}

              <div className="notif-wrap" onClick={(e) => e.stopPropagation()}>
                <button
                  className="nav-btn"
                  onClick={async () => {
                    const nextOpen = !notificationsOpen;
                    setNotificationsOpen(nextOpen);
                    setDropOpen(false);

                    if (nextOpen) {
                      await refreshNotifications(true);
                    }
                  }}
                >
                  🔔
                  {unreadCount > 0 && <span className="notif-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>

                {notificationsOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-head">
                      <div className="notif-head-title">Мэдэгдэл</div>
                      {unreadCount > 0 && (
                        <button className="notif-head-btn" onClick={handleMarkAllAsRead}>
                          Бүгдийг уншсан болгох
                        </button>
                      )}
                    </div>

                    <div className="notif-list">
                      {loadingNotifications ? (
                        <div className="notif-loading">Ачаалж байна...</div>
                      ) : notifications.length === 0 ? (
                        <div className="notif-empty">Одоогоор мэдэгдэл алга.</div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`notif-item ${notification.is_read ? '' : 'unread'}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notif-title">{notification.title}</div>
                            <div className="notif-message">{notification.message}</div>
                            <div className="notif-time">
                              {new Date(notification.created_at).toLocaleString('mn-MN')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="user-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropOpen(!dropOpen);
                  setNotificationsOpen(false);
                }}
              >
                <div className="u-av" style={{ background: roleColor }}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div>
                  <div className="u-name">{user?.last_name} {user?.first_name}</div>
                  <div className="u-role" style={{ color: roleColor }}>{ROLE_LABELS[user?.role || '']}</div>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>▾</span>

                {dropOpen && (
                  <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="dd-head">
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {user?.last_name} {user?.first_name}
                      </div>
                      <div className="dd-email">{user?.email}</div>
                      <div
                        style={{
                          marginTop: 8,
                          display: 'inline-block',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 100,
                          color: 'white',
                          background: roleColor,
                        }}
                      >
                        {ROLE_LABELS[user?.role || '']}
                      </div>
                    </div>
                    <div className="dd-item" onClick={() => router.push('/dashboard')}>⊞ Хяналтын самбар</div>
                    <div className="dd-item danger" onClick={() => { logout(); router.push('/auth/login'); }}>🚪 Системээс гарах</div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          <div className="page-body">{children}</div>
        </div>
      </div>
    </>
  );
}
