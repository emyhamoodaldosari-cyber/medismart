import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock3, Loader, Package, Pill, RefreshCw, ShoppingCart, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { dashboardService, PharmacistDashboardStats, PendingOrder, LowStockItem } from '../../services/dashboardService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const PharmacistDashboard = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PharmacistDashboardStats | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = {
    title: t('screens.pharmacistDashboard.title'),
    subtitle: t('screens.pharmacistDashboard.subtitle'),
    noPharmacy: t('screens.pharmacistDashboard.noPharmacy'),
    loadError: t('screens.pharmacistDashboard.loadError'),
    inventory: t('screens.pharmacistDashboard.inventory'),
    pendingOrders: t('screens.pharmacistDashboard.pendingOrders'),
    todayOrders: t('screens.pharmacistDashboard.todayOrders'),
    revenue: t('screens.pharmacistDashboard.revenue'),
    completedToday: t('screens.pharmacistDashboard.completedToday'),
    currency: t('screens.pharmacistDashboard.currency'),
    pendingOrdersSection: t('screens.pharmacistDashboard.pendingOrdersSection'),
    viewAll: t('screens.pharmacistDashboard.viewAll'),
    noPending: t('screens.pharmacistDashboard.noPending'),
    noPendingHint: t('screens.pharmacistDashboard.noPendingHint'),
    lowStockSection: t('screens.pharmacistDashboard.lowStockSection'),
    noLowStock: t('screens.pharmacistDashboard.noLowStock'),
    noLowStockHint: t('screens.pharmacistDashboard.noLowStockHint'),
    refresh: t('screens.pharmacistDashboard.refresh'),
    orderItems: t('screens.pharmacistDashboard.orderItems'),
    threshold: t('screens.pharmacistDashboard.threshold'),
    justNow: t('screens.pharmacistDashboard.justNow'),
    minutesAgo: t('screens.pharmacistDashboard.minutesAgo'),
    hoursAgo: t('screens.pharmacistDashboard.hoursAgo'),
  };

  useEffect(() => {
    if (profile?.pharmacy_id) {
      void loadDashboardData();
    } else {
      setLoading(false);
      setError(copy.noPharmacy);
    }
  }, [profile?.pharmacy_id, copy.noPharmacy]);

  useRealtimeSubscription(
    `pharmacist-dashboard-${profile?.pharmacy_id}`,
    [
      {
        table: 'orders',
        event: '*',
        filter: profile?.pharmacy_id ? `pharmacy_id=eq.${profile.pharmacy_id}` : undefined,
        callback: () => {
          void loadDashboardData();
        },
      },
      {
        table: 'pharmacy_inventory',
        event: '*',
        filter: profile?.pharmacy_id ? `pharmacy_id=eq.${profile.pharmacy_id}` : undefined,
        callback: () => {
          void loadDashboardData();
        },
      },
    ],
    Boolean(profile?.pharmacy_id),
  );

  const loadDashboardData = async () => {
    if (!profile?.pharmacy_id) return;
    try {
      setError(null);
      const [statsData, ordersData, lowStockData] = await Promise.all([
        dashboardService.getPharmacistStats(profile.pharmacy_id),
        dashboardService.getPendingOrders(profile.pharmacy_id, 5),
        dashboardService.getLowStockItems(profile.pharmacy_id, 5),
      ]);
      setStats(statsData);
      setPendingOrders(ordersData);
      setLowStockItems(lowStockData);
    } catch (err: any) {
      setError(err.message || copy.loadError);
      showToast(copy.loadError, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return copy.justNow;
    if (diffMins < 60) return copy.minutesAgo.replace('{{count}}', String(diffMins));
    if (diffHours < 24) return copy.hoursAgo.replace('{{count}}', String(diffHours));
    return new Date(timestamp).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4 animate-spin text-[#099aa7]" size={46} />
          <p className="text-sm font-medium text-slate-600">{copy.loadError}</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pt-24">
        <div className="container mx-auto max-w-4xl rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
          <EmptyState icon={AlertTriangle} title={copy.title} message={error} action={profile?.pharmacy_id ? { label: copy.refresh, onClick: () => void loadDashboardData() } : undefined} />
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: <Package size={22} />, label: copy.inventory, value: stats?.inventoryCount || 0 },
    { icon: <ShoppingCart size={22} />, label: copy.pendingOrders, value: stats?.pendingOrders || 0 },
    { icon: <Clock3 size={22} />, label: copy.todayOrders, value: stats?.todayOrders || 0, meta: `${stats?.completedToday || 0} ${copy.completedToday}` },
    { icon: <TrendingUp size={22} />, label: copy.revenue, value: `${(stats?.totalRevenue || 0).toFixed(0)} ${copy.currency}` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-24">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-heading font-bold tracking-tight text-[#1f2f31]">{copy.title}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">{copy.subtitle}</p>
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              void loadDashboardData();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#099aa7]/30 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            {copy.refresh}
          </button>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#099aa7]/10 text-[#099aa7]">{card.icon}</div>
              <div className="text-sm font-medium text-slate-500">{card.label}</div>
              <div className="mt-2 text-3xl font-bold text-[#1f2f31]">{card.value}</div>
              {card.meta && <div className="mt-2 text-xs font-semibold text-[#099aa7]">{card.meta}</div>}
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
          <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-[#1f2f31]">{copy.pendingOrdersSection}</h2>
              <button onClick={() => navigate('/pharmacist/orders')} className="text-sm font-semibold text-[#099aa7] hover:underline">{copy.viewAll}</button>
            </div>
            {pendingOrders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title={copy.noPending} message={copy.noPendingHint} />
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => navigate('/pharmacist/orders')}
                    className="flex w-full flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-start transition hover:border-[#099aa7]/20 hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#1f2f31]">{order.order_number}</p>
                        <p className="text-sm text-slate-500">{order.customer_name}</p>
                      </div>
                      <StatusBadge type="order" status={order.status} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                      <span>{order.items_count} {copy.orderItems}</span>
                      <span>{order.total_amount.toFixed(2)} {copy.currency}</span>
                      <span>{formatRelativeTime(order.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-[#1f2f31]">{copy.lowStockSection}</h2>
            {lowStockItems.length === 0 ? (
              <EmptyState icon={Pill} title={copy.noLowStock} message={copy.noLowStockHint} />
            ) : (
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#1f2f31]">{item.medicine_name}</p>
                        <p className="mt-1 text-sm text-slate-600">{copy.threshold}: {item.threshold}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-orange-600 shadow-sm">{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-[#1f2f31]">{copy.quickActions}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: copy.manageInventory, onClick: () => navigate('/pharmacist/inventory'), icon: <Package size={18} /> },
              { label: copy.reviewOrders, onClick: () => navigate('/pharmacist/orders'), icon: <ShoppingCart size={18} /> },
              { label: copy.createMedicine, onClick: () => navigate('/pharmacist/medicine/new'), icon: <Pill size={18} /> },
            ].map((action) => (
              <button key={action.label} onClick={action.onClick} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-start font-semibold text-[#1f2f31] transition hover:border-[#099aa7]/30 hover:bg-white">
                <span>{action.label}</span>
                <span className="text-[#099aa7]">{action.icon}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
