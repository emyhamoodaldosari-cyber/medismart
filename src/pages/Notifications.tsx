import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, Trash2, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Notification } from '../types';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateTime } from '../utils/localization';

const Notifications = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, direction, t } = useLanguage();
  const tn = (key: string) => t(`customer.notifications.${key}`);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (error: any) {
      showToast(error.message || tn('loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useRealtimeSubscription(
    `notifications-${user?.id}`,
    [
      {
        table: 'notifications',
        event: 'INSERT',
        filter: user?.id ? `user_id=eq.${user.id}` : undefined,
        callback: (payload) => setNotifications((prev) => [payload.new as Notification, ...prev]),
      },
      {
        table: 'notifications',
        event: 'UPDATE',
        filter: user?.id ? `user_id=eq.${user.id}` : undefined,
        callback: (payload) => setNotifications((prev) => prev.map((item) => item.id === payload.new.id ? payload.new as Notification : item)),
      },
      {
        table: 'notifications',
        event: 'DELETE',
        filter: user?.id ? `user_id=eq.${user.id}` : undefined,
        callback: (payload) => setNotifications((prev) => prev.filter((item) => item.id !== payload.old.id)),
      },
    ],
    !!user,
  );

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      setNotifications((prev) => prev.map((item) => item.id === notificationId ? { ...item, is_read: true } : item));
    } catch (error: any) {
      showToast(error.message || tn('markReadError'), 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false);
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      showToast(tn('markedAllRead'), 'success');
    } catch (error: any) {
      showToast(error.message || tn('markAllReadError'), 'error');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      showToast(tn('deleted'), 'success');
    } catch (error: any) {
      showToast(error.message || tn('deleteError'), 'error');
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm(`${copy.confirmDeleteAll}\n${copy.confirmDeleteAllMessage}`)) return;
    try {
      await supabase.from('notifications').delete().eq('user_id', user?.id);
      setNotifications([]);
      showToast(tn('deletedAll'), 'success');
    } catch (error: any) {
      showToast(error.message || tn('deleteError'), 'error');
    }
  };

  const filteredNotifications = filter === 'unread' ? notifications.filter((item) => !item.is_read) : notifications;
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const unreadLabel = `${unreadCount} ${unreadCount === 1 ? tn('unreadCountOne') : tn('unreadCountMany')}`;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return '📦';
      case 'message': return '💬';
      case 'prescription': return '📋';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-50 border-blue-200';
      case 'message': return 'bg-green-50 border-green-200';
      case 'prescription': return 'bg-purple-50 border-purple-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const typeLabel = (type: Notification['type']) => t(`customer.notifications.types.${type}`) || t('customer.notifications.types.system');

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader className="animate-spin text-[#099aa7]" size={40} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20" dir={direction}>
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-12 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-4 block">{tn('eyebrow')}</span>
            <h1 className="text-5xl font-heading font-bold text-[#1f2f31] mb-2">{tn('title')}</h1>
            <p className="text-slate-600 font-medium">{unreadCount > 0 ? unreadLabel : tn('emptyUnreadMessage')}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="px-6 py-3 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all text-sm">{tn('markAllRead')}</button>
            )}
            {notifications.length > 0 && (
              <button onClick={deleteAllNotifications} className="px-6 py-3 bg-white border border-slate-200 text-[#1f2f31] font-bold rounded-xl hover:border-red-200 hover:text-red-500 transition-all text-sm">{tn('deleteAll')}</button>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          {(['all', 'unread'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-6 py-3 font-bold rounded-xl transition-all text-sm ${filter === value ? 'bg-[#099aa7] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
            >
              {value === 'all' ? `${tn('all')} (${notifications.length})` : `${tn('unread')} (${unreadCount})`}
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-16 border border-dashed border-slate-200 text-center">
            <Bell className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-2xl font-bold text-[#1f2f31] mb-2">{filter === 'unread' ? tn('emptyUnreadTitle') : tn('emptyTitle')}</h3>
            <p className="text-slate-600">{filter === 'unread' ? tn('emptyUnreadMessage') : tn('emptyMessage')}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification, idx) => (
              <motion.div key={notification.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className={`bg-white rounded-2xl border-2 p-6 transition-all ${notification.is_read ? 'border-slate-100 opacity-75' : `border-[#099aa7] ${getNotificationColor(notification.type)}`}`}>
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                      <div>
                        <p className="font-bold text-[#1f2f31]">{notification.title}</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{typeLabel(notification.type)}</p>
                      </div>
                      <div className="text-xs text-slate-400">{formatDateTime(notification.created_at, language)}</div>
                    </div>
                    <p className="text-slate-600 text-sm leading-6">{notification.body}</p>
                    <div className="mt-5 flex items-center gap-3 flex-wrap">
                      {!notification.is_read && (
                        <button onClick={() => markAsRead(notification.id)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#099aa7]/10 text-[#099aa7] font-bold text-xs hover:bg-[#099aa7]/20 transition-all">
                          <Check size={14} /> {tn('markRead')}
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notification.id)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-red-50 hover:text-red-500 transition-all">
                        <Trash2 size={14} /> {tn('deleteLabel')}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
