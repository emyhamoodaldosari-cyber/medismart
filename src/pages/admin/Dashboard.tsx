import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Building2, TrendingUp, AlertCircle, CheckCircle, Package, Loader, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { dashboardService, AdminDashboardStats, RecentActivity } from '../../services/dashboardService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Realtime subscriptions for admin dashboard
  useRealtimeSubscription(
    'admin-dashboard-updates',
    [
      {
        table: 'profiles',
        event: '*',
        callback: (payload) => {
          console.log('User profile change:', payload);
          loadDashboardData(); // Refresh stats
        }
      },
      {
        table: 'pharmacies',
        event: '*',
        callback: (payload) => {
          console.log('Pharmacy change:', payload);
          loadDashboardData(); // Refresh stats
        }
      },
      {
        table: 'orders',
        event: '*',
        callback: (payload) => {
          console.log('Order change:', payload);
          loadDashboardData(); // Refresh stats
        }
      },
      {
        table: 'medicines',
        event: '*',
        callback: (payload) => {
          console.log('Medicine change:', payload);
          loadDashboardData(); // Refresh stats
        }
      },
      {
        table: 'prescriptions',
        event: '*',
        callback: (payload) => {
          console.log('Prescription change:', payload);
          loadDashboardData(); // Refresh stats
        }
      }
    ],
    true
  );

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [statsData, activitiesData] = await Promise.all([
        dashboardService.getAdminStats(),
        dashboardService.getRecentActivity(8)
      ]);
      setStats(statsData);
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || t('admin.dashboard.loadFailed'));
      showToast(t('admin.dashboard.loadFailed'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const getActivityIcon = (type: string, status: string) => {
    if (type === 'order') {
      return status === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />;
    }
    if (type === 'user') return <Users size={20} />;
    if (type === 'pharmacy') return <Building2 size={20} />;
    return <Package size={20} />;
  };

  const getActivityColor = (status: string) => {
    if (status === 'success') return 'bg-green-100 text-green-600';
    if (status === 'error') return 'bg-red-100 text-red-600';
    return 'bg-orange-100 text-orange-600';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.now');
    if (diffMins < 60) return `${diffMins} ${t('common.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('common.hoursAgo')}`;
    return `${diffDays} ${t('common.daysAgo')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-[#099aa7] mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-medium">{t('admin.dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-[#1f2f31] mb-2">{t('admin.dashboard.loadFailed')}</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all"
          >
            {t('actions.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-heading font-bold text-[#1f2f31] mb-2">{t('admin.dashboard.title')}</h1>
            <p className="text-[#363f40] opacity-70">{t('admin.dashboard.welcome', { name: profile?.full_name })}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
            title={t('actions.refresh')}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span className="font-medium text-sm">{t('actions.refresh')}</span>
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <p className="text-sm text-[#363f40] opacity-70 mb-1">{t('admin.totalUsers')}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#1f2f31]">{stats?.totalUsers.toLocaleString()}</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
              <Building2 size={24} />
            </div>
            <p className="text-sm text-[#363f40] opacity-70 mb-1">{t('admin.activePharmacies')}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#1f2f31]">{stats?.activePharmacies}</h3>
              <span className="text-xs font-bold text-slate-400">{t('common.of')} {stats?.totalPharmacies}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Package size={24} />
            </div>
            <p className="text-sm text-[#363f40] opacity-70 mb-1">{t('admin.totalMedicines')}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#1f2f31]">{stats?.totalMedicines.toLocaleString()}</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <TrendingUp size={24} />
            </div>
            <p className="text-sm text-[#363f40] opacity-70 mb-1">{t('admin.totalOrders')}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#1f2f31]">{stats?.totalOrders.toLocaleString()}</h3>
            </div>
          </motion.div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">{t('admin.pendingOrders')}</p>
              <AlertCircle size={20} />
            </div>
            <h3 className="text-4xl font-bold">{stats?.pendingOrders}</h3>
            <p className="text-xs opacity-75 mt-2">{t('admin.dashboard.needsAttention')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">{t('admin.completedOrders')}</p>
              <CheckCircle size={20} />
            </div>
            <h3 className="text-4xl font-bold">{stats?.completedOrders}</h3>
            <p className="text-xs opacity-75 mt-2">{t('admin.dashboard.successfullyCompleted')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">{t('admin.pendingPrescriptions')}</p>
              <BarChart3 size={20} />
            </div>
            <h3 className="text-4xl font-bold">{stats?.pendingPrescriptions}</h3>
            <p className="text-xs opacity-75 mt-2">{t('admin.dashboard.awaitingReview')}</p>
          </motion.div>
        </div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-[#1f2f31] mb-6">{t('admin.dashboard.recentActivity')}</h2>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity, idx) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.status)}`}>
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1f2f31]">{activity.message}</p>
                    <p className="text-xs text-[#363f40] opacity-60">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-500 font-medium">{t('admin.dashboard.noRecentActivity')}</p>
              <p className="text-sm text-slate-400 mt-1">{t('admin.dashboard.activityWillAppear')}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
