'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../components/ui/ToastProvider';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

type Metric = {
  label: string;
  value: string | number;
  helper?: string;
  icon: string;
  tone: 'amber' | 'blue' | 'green' | 'rose' | 'slate';
};

type ActionItem = {
  label: string;
  path: string;
  icon: string;
};

type DashboardOrder = {
  id?: number;
  order_no: string;
  customer?: string;
  furniture?: string;
  total_amount?: number;
  created_at?: string;
  status: string;
};

type WorkerSummary = {
  id?: number;
  name: string;
  email?: string;
  total: number;
  done: number;
  in_progress: number;
};

type PaymentSummary = {
  order_no: string;
  customer: string;
  amount: number;
  method: string;
  paid_at?: string;
};

type MaterialSummary = {
  code: string;
  name: string;
  category: string;
  type: string;
  stock: number;
  unit: string;
};

type CalculationSummary = {
  id?: number;
  furniture?: string;
  created_at?: string;
  total_area?: number;
  total_cost?: number;
};

type AuditSummary = {
  id?: number;
  action?: string;
  table_name?: string;
  created_at?: string;
  users?: {
    first_name?: string;
    last_name?: string;
  };
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Хүлээгдэж байна', bg: '#fef3c7', color: '#92400e' },
  confirmed: { label: 'Баталгаажсан', bg: '#dbeafe', color: '#1d4ed8' },
  assigned: { label: 'Хуваарилагдсан', bg: '#f5f3ff', color: '#7c3aed' },
  in_progress: { label: 'Гүйцэтгэж байна', bg: '#e0f2fe', color: '#075985' },
  done: { label: 'Дууссан', bg: '#dcfce7', color: '#166534' },
  cancelled: { label: 'Цуцлагдсан', bg: '#fee2e2', color: '#991b1b' },
};

const TONE_STYLES: Record<Metric['tone'], { bg: string; color: string }> = {
  amber: { bg: '#fef3c7', color: '#b45309' },
  blue: { bg: '#dbeafe', color: '#1d4ed8' },
  green: { bg: '#dcfce7', color: '#166534' },
  rose: { bg: '#ffe4e6', color: '#be123c' },
  slate: { bg: '#e2e8f0', color: '#334155' },
};

const formatMoney = (value: number) => `₮${Number(value || 0).toLocaleString()}`;

export default function DashboardPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { notify } = useToast();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [quickActions, setQuickActions] = useState<ActionItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentSummary[]>([]);
  const [recentCalculations, setRecentCalculations] = useState<CalculationSummary[]>([]);
  const [lowStockMaterials, setLowStockMaterials] = useState<MaterialSummary[]>([]);
  const [workerSummary, setWorkerSummary] = useState<WorkerSummary[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditSummary[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (!savedUser || !savedToken) {
      router.push('/auth/login');
      return;
    }

    try {
      setAuth(JSON.parse(savedUser), savedToken);
      setMounted(true);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  }, [router, setAuth]);

  useEffect(() => {
    if (!mounted || !user) {
      return;
    }

    void loadDashboard();
  }, [mounted, user?.id, user?.role]);

  const loadDashboard = async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    try {
      if (user.role === 'super_admin') {
        const [ordersRes, calculationsRes, workersRes, logsRes] = await Promise.all([
          api.get('/api/reports/orders'),
          api.get('/api/reports/calculations'),
          api.get('/api/reports/workers'),
          api.get('/api/reports/audit-logs?limit=6'),
        ]);

        const orders = ordersRes.data?.data || [];
        const calculations = calculationsRes.data?.data || [];
        const workers = workersRes.data?.data || [];
        const logs = logsRes.data || [];

        setMetrics([
          { label: 'Нийт захиалга', value: orders.length, helper: 'Системийн бүх захиалга', icon: '📦', tone: 'amber' },
          { label: 'Нийт орлого', value: formatMoney(orders.reduce((sum: number, item: any) => sum + Number(item.total_amount || 0), 0)), helper: 'Захиалгын нийт дүн', icon: '💰', tone: 'green' },
          { label: 'Тооцоолол', value: calculations.length, helper: 'Хадгалсан тооцооллууд', icon: '📐', tone: 'blue' },
          { label: 'Ажилтны тайлан', value: workers.length, helper: 'Идэвхтэй ажилчдын тайлан', icon: '👥', tone: 'rose' },
        ]);
        setQuickActions([
          { label: 'Тавилгын төрөл', path: '/furniture-types', icon: '🪑' },
          { label: 'Материал ангилал', path: '/material-categories', icon: '🗂️' },
          { label: 'Үйлчилгээний төрөл', path: '/service-types', icon: '⚙️' },
          { label: 'Хэрэглэгчид', path: '/users', icon: '👤' },
          { label: 'Тайлан', path: '/reports', icon: '📊' },
          { label: 'Лог', path: '/audit-logs', icon: '📋' },
        ]);
        setRecentOrders([]);
        setRecentCalculations([]);
        setWorkerSummary([]);
        setRecentLogs(logs.slice(0, 6));
        setRecentPayments([]);
        setLowStockMaterials([]);
        return;
      }

      if (user.role === 'admin') {
        const [ordersRes, usersRes] = await Promise.all([
          api.get('/api/reports/orders'),
          api.get('/api/auth/users'),
        ]);

        const orders = ordersRes.data?.data || [];
        const users = usersRes.data || [];
        const workers = users
          .filter((item: any) => ['worker', 'order_processor', 'accountant', 'admin'].includes(item.role))
          .map((item: any) => ({
            id: item.id,
            name: `${item.last_name || ''} ${item.first_name || ''}`.trim(),
            email: item.email,
            total: 0,
            done: 0,
            in_progress: 0,
          }));

        setMetrics([
          { label: 'Нийт захиалга', value: orders.length, helper: 'Бүх захиалгын тоо', icon: '📦', tone: 'amber' },
          { label: 'Хүлээгдэж буй', value: orders.filter((item: any) => item.status === 'pending').length, helper: 'Баталгаажуулах захиалга', icon: '⏳', tone: 'blue' },
          { label: 'Биелсэн', value: orders.filter((item: any) => item.status === 'done').length, helper: 'Дууссан захиалгууд', icon: '✅', tone: 'green' },
          { label: 'Ажилтан', value: workers.length, helper: 'Удирдах боломжтой хэрэглэгчид', icon: '👥', tone: 'rose' },
        ]);
        setQuickActions([
          { label: 'Захиалга', path: '/orders', icon: '📦' },
          { label: 'Ажилтан удирдах', path: '/users', icon: '👥' },
          { label: 'Тайлан', path: '/reports', icon: '📊' },
          { label: 'Материал', path: '/materials', icon: '🪵' },
        ]);
        setRecentOrders(orders.slice(0, 6));
        setWorkerSummary(workers.slice(0, 5));
        setRecentPayments([]);
        setRecentCalculations([]);
        setRecentLogs([]);
        setLowStockMaterials([]);
        return;
      }

      if (user.role === 'accountant') {
        const [financeRes, materialsRes, ordersRes] = await Promise.all([
          api.get('/api/reports/finance'),
          api.get('/api/reports/materials'),
          api.get('/api/reports/orders'),
        ]);

        const payments = financeRes.data?.data || [];
        const materials = materialsRes.data?.data || [];
        const orders = ordersRes.data?.data || [];
        const lowStock = materials.filter((item: any) => Number(item.stock) < 10);

        setMetrics([
          { label: 'Төлөгдсөн орлого', value: formatMoney(payments.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)), helper: 'Санхүүгийн тайлан', icon: '💰', tone: 'green' },
          { label: 'Төлбөрийн мөр', value: payments.length, helper: 'Бүртгэгдсэн төлбөрүүд', icon: '🧾', tone: 'blue' },
          { label: 'Материал', value: materials.length, helper: 'Идэвхтэй материал', icon: '🪵', tone: 'amber' },
          { label: 'Бага үлдэгдэл', value: lowStock.length, helper: 'Анхаарах материал', icon: '⚠️', tone: 'rose' },
        ]);
        setQuickActions([
          { label: 'Материал', path: '/materials', icon: '🪵' },
          { label: 'Үйлчилгээ', path: '/services', icon: '🔧' },
          { label: 'Тайлан', path: '/reports', icon: '📊' },
        ]);
        setRecentPayments(payments.slice(0, 6));
        setLowStockMaterials(lowStock.slice(0, 6));
        setRecentOrders([]);
        setRecentCalculations([]);
        setWorkerSummary([]);
        setRecentLogs([]);
        return;
      }

      if (user.role === 'order_processor') {
        const [ordersRes, workersRes] = await Promise.all([
          api.get('/api/reports/orders'),
          api.get('/api/reports/workers'),
        ]);

        const orders = ordersRes.data?.data || [];
        const workers = workersRes.data?.data || [];

        setMetrics([
          { label: 'Шинэ захиалга', value: orders.filter((item: any) => item.status === 'pending').length, helper: 'Баталгаажуулах захиалга', icon: '📥', tone: 'amber' },
          { label: 'Баталгаажсан', value: orders.filter((item: any) => item.status === 'confirmed').length, helper: 'Хуваарилах дараалал', icon: '✅', tone: 'blue' },
          { label: 'Хуваарилагдсан', value: orders.filter((item: any) => item.status === 'assigned').length, helper: 'Ажил эхлэхийг хүлээж буй', icon: '👷', tone: 'rose' },
          { label: 'Явж буй ажил', value: orders.filter((item: any) => item.status === 'in_progress').length, helper: 'Одоогийн гүйцэтгэл', icon: '🔄', tone: 'green' },
        ]);
        setQuickActions([
          { label: 'Захиалгууд', path: '/orders', icon: '📦' },
          { label: 'Тайлан', path: '/reports', icon: '📊' },
          { label: 'Ажилтны тайлан', path: '/reports', icon: '👥' },
        ]);
        setRecentOrders(orders.slice(0, 6));
        setWorkerSummary(workers.slice(0, 5));
        setRecentPayments([]);
        setRecentCalculations([]);
        setRecentLogs([]);
        setLowStockMaterials([]);
        return;
      }

      if (user.role === 'worker') {
        const ordersRes = await api.get('/api/orders');
        const orders = ordersRes.data || [];

        setMetrics([
          { label: 'Надад оноосон', value: orders.length, helper: 'Нийт ажил', icon: '📦', tone: 'amber' },
          { label: 'Хуваарилагдсан', value: orders.filter((item: any) => item.status === 'assigned').length, helper: 'Эхлүүлэх ажил', icon: '👷', tone: 'blue' },
          { label: 'Гүйцэтгэж буй', value: orders.filter((item: any) => item.status === 'in_progress').length, helper: 'Одоогийн явц', icon: '🔄', tone: 'rose' },
          { label: 'Дууссан', value: orders.filter((item: any) => item.status === 'done').length, helper: 'Амжилттай хаасан', icon: '🎉', tone: 'green' },
        ]);
        setQuickActions([
          { label: 'Миний ажил', path: '/orders', icon: '📦' },
        ]);
        setRecentOrders(orders.slice(0, 6));
        setRecentPayments([]);
        setRecentCalculations([]);
        setLowStockMaterials([]);
        setWorkerSummary([]);
        setRecentLogs([]);
        return;
      }

      const [ordersRes, calculationsRes] = await Promise.all([
        api.get('/api/orders/my'),
        api.get('/api/calculations'),
      ]);

      const orders = ordersRes.data || [];
      const calculations = calculationsRes.data || [];

      setMetrics([
        { label: 'Миний захиалга', value: orders.length, helper: 'Бүх захиалгын тоо', icon: '📦', tone: 'amber' },
        { label: 'Хүлээгдэж буй', value: orders.filter((item: any) => item.status === 'pending').length, helper: 'Боловсруулагдаж буй', icon: '⏳', tone: 'blue' },
        { label: 'Дууссан', value: orders.filter((item: any) => item.status === 'done').length, helper: 'Хүлээн авсан ажил', icon: '✅', tone: 'green' },
        { label: 'Тооцоолол', value: calculations.length, helper: 'Хадгалсан тооцоолол', icon: '📐', tone: 'rose' },
      ]);
      setQuickActions([
        { label: 'Тооцоолол хийх', path: '/calculate', icon: '📐' },
        { label: 'Миний захиалга', path: '/my-orders', icon: '📦' },
        { label: 'Сагс', path: '/cart', icon: '🛒' },
      ]);
      setRecentOrders(orders.slice(0, 5));
      setRecentCalculations(calculations.slice(0, 5));
      setRecentPayments([]);
      setLowStockMaterials([]);
      setWorkerSummary([]);
      setRecentLogs([]);
    } catch (error: any) {
      notify(error?.response?.data?.message || 'Хяналтын самбарын мэдээлэл ачаалахад алдаа гарлаа', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !user) {
    return null;
  }

  return (
    <AppLayout
      title="Хяналтын самбар"
      action={
        <button
          onClick={() => void loadDashboard()}
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            color: '#475569',
          }}
        >
          ↻ Шинэчлэх
        </button>
      }
    >
      <style>{`
        .dash-shell{display:grid;gap:16px}
        .metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .metric-card{background:white;border:1px solid #e2e8f0;border-radius:16px;padding:18px 18px 16px;min-height:132px}
        .metric-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
        .metric-label{font-size:12px;font-weight:700;color:#64748b}
        .metric-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px}
        .metric-value{font-size:28px;font-weight:800;color:#0f172a;line-height:1.05;word-break:break-word}
        .metric-helper{margin-top:8px;font-size:11px;color:#94a3b8}
        .content-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}
        .section-card{background:white;border:1px solid #e2e8f0;border-radius:18px;padding:18px}
        .section-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
        .section-title{font-size:15px;font-weight:800;color:#0f172a}
        .section-sub{font-size:11px;color:#94a3b8;margin-top:3px}
        .action-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
        .action-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s}
        .action-card:hover{background:#fffaf0;border-color:#f5d7a1;transform:translateY(-1px)}
        .action-icon{width:34px;height:34px;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 1px 3px rgba(15,23,42,.06)}
        .action-label{font-size:12px;font-weight:700;color:#0f172a}
        .list{display:flex;flex-direction:column;gap:10px}
        .list-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:14px;background:#f8fafc;border:1px solid #eef2f7}
        .list-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#d97706,#b45309);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
        .list-main{flex:1;min-width:0}
        .list-title{font-size:13px;font-weight:700;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .list-sub{font-size:11px;color:#94a3b8;margin-top:3px}
        .list-meta{flex-shrink:0;text-align:right}
        .list-value{font-size:12px;font-weight:800;color:#0f172a}
        .badge{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:3px 9px;font-size:10px;font-weight:700}
        .empty{padding:30px 16px;text-align:center;color:#94a3b8;font-size:13px}
        .skel-card{height:132px;border-radius:16px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
        .skel-panel{height:260px;border-radius:18px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
        .worker-row{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:#f8fafc;border:1px solid #eef2f7}
        .worker-bar{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-top:8px}
        .worker-fill{height:100%;background:linear-gradient(90deg,#d97706,#f59e0b)}
        .log-note{font-size:11px;color:#64748b;background:#fff7ed;border:1px solid #fed7aa;padding:2px 8px;border-radius:999px}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:1100px){
          .metric-grid{grid-template-columns:repeat(2,1fr)}
          .content-grid{grid-template-columns:1fr}
        }
        @media(max-width:640px){
          .metric-grid{grid-template-columns:1fr}
          .action-grid{grid-template-columns:1fr}
        }
      `}</style>

      <div className="dash-shell">
        {loading ? (
          <>
            <div className="metric-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skel-card" />
              ))}
            </div>
            <div className="content-grid">
              <div className="skel-panel" />
              <div className="skel-panel" />
            </div>
          </>
        ) : (
          <>
            <div className="metric-grid">
              {metrics.map((metric) => {
                const tone = TONE_STYLES[metric.tone];
                return (
                  <div key={metric.label} className="metric-card">
                    <div className="metric-top">
                      <div className="metric-label">{metric.label}</div>
                      <div className="metric-icon" style={{ background: tone.bg, color: tone.color }}>
                        {metric.icon}
                      </div>
                    </div>
                    <div className="metric-value">{metric.value}</div>
                    {metric.helper && <div className="metric-helper">{metric.helper}</div>}
                  </div>
                );
              })}
            </div>

            <div className="content-grid">
              <div style={{ display: 'grid', gap: 16 }}>
                <div className="section-card">
                  <div className="section-head">
                    <div>
                      <div className="section-title">Түргэн үйлдлүүд</div>
                      <div className="section-sub">Өдөр тутам их ашиглагддаг хэсгүүд</div>
                    </div>
                  </div>
                  <div className="action-grid">
                    {quickActions.map((action) => (
                      <div key={action.label} className="action-card" onClick={() => router.push(action.path)}>
                        <div className="action-icon">{action.icon}</div>
                        <div className="action-label">{action.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {recentOrders.length > 0 && (
                  <div className="section-card">
                    <div className="section-head">
                      <div>
                        <div className="section-title">Сүүлийн захиалгууд</div>
                        <div className="section-sub">Хамгийн сүүлд шинэчлэгдсэн захиалгууд</div>
                      </div>
                    </div>
                    <div className="list">
                      {recentOrders.map((order, index) => {
                        const status = STATUS_META[order.status] || STATUS_META.pending;
                        return (
                          <div
                            key={`${order.order_no}-${index}`}
                            className="list-item"
                            style={{ cursor: 'pointer' }}
                            onClick={() => router.push(user.role === 'customer' ? '/my-orders' : '/orders')}
                          >
                            <div className="list-avatar">{order.customer?.slice(0, 1) || order.order_no.slice(-2)}</div>
                            <div className="list-main">
                              <div className="list-title">{order.order_no}</div>
                              <div className="list-sub">
                                {order.customer ? `${order.customer} · ` : ''}
                                {order.furniture || 'Материалын захиалга'}
                              </div>
                            </div>
                            <div className="list-meta">
                              <div className="list-value">{formatMoney(Number(order.total_amount || 0))}</div>
                              <div className="badge" style={{ background: status.bg, color: status.color, marginTop: 6 }}>
                                {status.label}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {recentPayments.length > 0 && (
                  <div className="section-card">
                    <div className="section-head">
                      <div>
                        <div className="section-title">Сүүлийн төлбөрүүд</div>
                        <div className="section-sub">Орлого болон төлбөрийн урсгал</div>
                      </div>
                    </div>
                    <div className="list">
                      {recentPayments.map((payment, index) => (
                        <div key={`${payment.order_no}-${index}`} className="list-item">
                          <div className="list-avatar">₮</div>
                          <div className="list-main">
                            <div className="list-title">{payment.order_no}</div>
                            <div className="list-sub">{payment.customer} · {payment.method}</div>
                          </div>
                          <div className="list-meta">
                            <div className="list-value" style={{ color: '#166534' }}>{formatMoney(payment.amount)}</div>
                            <div className="list-sub">
                              {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('mn-MN') : '—'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                {workerSummary.length > 0 && (
                  <div className="section-card">
                    <div className="section-head">
                      <div>
                        <div className="section-title">{user.role === 'admin' ? 'Ажилтан удирдах' : 'Ажилтны гүйцэтгэл'}</div>
                        <div className="section-sub">{user.role === 'admin' ? 'Системд бүртгэлтэй ажилтнууд' : 'Одоогийн ачаалал ба биелэлт'}</div>
                      </div>
                    </div>
                    <div className="list" style={{ gap: 12 }}>
                      {workerSummary.map((worker, index) => {
                        const progress = worker.total > 0 ? Math.round((worker.done / worker.total) * 100) : 0;
                        return (
                          <div key={`${worker.name}-${index}`} className="worker-row">
                            <div className="list-avatar">{worker.name.slice(0, 1)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="list-title">{worker.name}</div>
                              <div className="list-sub">
                                {worker.email || 'Имэйл байхгүй'}
                              </div>
                              {user.role !== 'admin' && (
                                <>
                                  <div className="list-sub">
                                    Нийт {worker.total} · Дууссан {worker.done} · Явж буй {worker.in_progress}
                                  </div>
                                  <div className="worker-bar">
                                    <div className="worker-fill" style={{ width: `${progress}%` }} />
                                  </div>
                                </>
                              )}
                            </div>
                            {user.role === 'admin' ? (
                              <button
                                onClick={() => router.push('/users')}
                                style={{
                                  background: 'white',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 10,
                                  padding: '8px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  color: '#475569',
                                }}
                              >
                                Харах
                              </button>
                            ) : (
                              <div className="list-value">{progress}%</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {recentCalculations.length > 0 && (
                  <div className="section-card">
                    <div className="section-head">
                      <div>
                        <div className="section-title">Сүүлийн тооцооллууд</div>
                        <div className="section-sub">Хадгалсан тооцооллын түүх</div>
                      </div>
                    </div>
                    <div className="list">
                      {recentCalculations.map((calc, index) => (
                        <div key={`${calc.id || index}`} className="list-item">
                          <div className="list-avatar">📐</div>
                          <div className="list-main">
                            <div className="list-title">{calc.furniture || 'Тооцоолол'}</div>
                            <div className="list-sub">
                              {calc.created_at ? new Date(calc.created_at).toLocaleDateString('mn-MN') : '—'}
                            </div>
                          </div>
                          <div className="list-meta">
                            <div className="list-value">{Number(calc.total_area || 0).toFixed(2)} м²</div>
                            {typeof calc.total_cost === 'number' && (
                              <div className="list-sub">{formatMoney(calc.total_cost)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lowStockMaterials.length > 0 && (
                  <div className="section-card">
                    <div className="section-head">
                      <div>
                        <div className="section-title">Бага үлдэгдэлтэй материал</div>
                        <div className="section-sub">Дахин нөөцлөх шаардлагатай жагсаалт</div>
                      </div>
                    </div>
                    <div className="list">
                      {lowStockMaterials.map((material, index) => (
                        <div key={`${material.code}-${index}`} className="list-item">
                          <div className="list-avatar">🪵</div>
                          <div className="list-main">
                            <div className="list-title">{material.name}</div>
                            <div className="list-sub">{material.category} · {material.type}</div>
                          </div>
                          <div className="list-meta">
                            <div className="list-value" style={{ color: '#be123c' }}>
                              {Number(material.stock).toFixed(2)} {material.unit}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recentLogs.length > 0 && (
                  <div className="section-card">
                    <div className="section-head">
                      <div>
                        <div className="section-title">Сүүлийн системийн лог</div>
                        <div className="section-sub">Шинэчлэгдсэн чухал үйлдлүүд</div>
                      </div>
                    </div>
                    <div className="list">
                      {recentLogs.map((log, index) => (
                        <div key={`${log.id || index}`} className="list-item">
                          <div className="list-avatar">📝</div>
                          <div className="list-main">
                            <div className="list-title">{log.action || 'Үйлдэл'}</div>
                            <div className="list-sub">
                              {log.users?.last_name || ''} {log.users?.first_name || ''} · {log.table_name || 'table'}
                            </div>
                          </div>
                          <div className="list-meta">
                            <div className="log-note">
                              {log.created_at ? new Date(log.created_at).toLocaleString('mn-MN') : '—'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!workerSummary.length && !recentCalculations.length && !lowStockMaterials.length && !recentLogs.length && !recentPayments.length && (
                  <div className="section-card">
                    <div className="section-head">
                      <div>
                        <div className="section-title">Нэмэлт мэдээлэл</div>
                        <div className="section-sub">Таны role-д хамаарах сүүлийн үйл ажиллагаа энд гарна</div>
                      </div>
                    </div>
                    <div className="empty">Одоогоор харуулах нэмэлт мэдээлэл алга.</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
