import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Package, ChevronRight, Repeat, Loader, MapPin, Home, Store, FileText, Download, CheckCircle, XCircle, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Order, OrderStatus, UserAddress, Prescription } from '../types';
import { addToCart, getOrCreateCart } from '../services/api';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, formatDate } from '../utils/localization';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-orange-50 text-orange-600',
  confirmed: 'bg-blue-50 text-blue-600',
  preparing: 'bg-purple-50 text-purple-600',
  ready: 'bg-cyan-50 text-cyan-600',
  out_for_delivery: 'bg-indigo-50 text-indigo-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
  rejected: 'bg-red-50 text-red-700',
};

const getProgress = (status: OrderStatus) => {
  switch (status) {
    case 'completed':
      return '100%';
    case 'out_for_delivery':
      return '80%';
    case 'ready':
      return '65%';
    case 'preparing':
      return '45%';
    case 'confirmed':
      return '25%';
    case 'cancelled':
    case 'rejected':
      return '100%';
    default:
      return '10%';
  }
};

const Orders = () => {
  const { user, profile, isPharmacist } = useAuth();
  const { showToast } = useToast();
  const { language, direction, t } = useLanguage();
  const to = (key: string, params?: Record<string, string | number>) => t(`customer.orders.${key}`, params);

  const [orders, setOrders] = useState<(Order & { address?: UserAddress; prescription?: Prescription })[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          address:user_addresses!orders_address_id_fkey(*),
          prescription:prescriptions!prescriptions_order_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (isPharmacist && profile?.pharmacy_id) {
        query = query.eq('pharmacy_id', profile.pharmacy_id);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data as (Order & { address?: UserAddress; prescription?: Prescription })[]) || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      showToast(err.message || to('loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, isPharmacist, profile?.pharmacy_id]);

  useRealtimeSubscription(
    `orders-${isPharmacist ? `pharmacy-${profile?.pharmacy_id}` : `user-${user?.id}`}`,
    [
      {
        table: 'orders',
        event: '*',
        filter: isPharmacist && profile?.pharmacy_id
          ? `pharmacy_id=eq.${profile.pharmacy_id}`
          : user?.id ? `user_id=eq.${user.id}` : undefined,
        callback: (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order & { address?: UserAddress; prescription?: Prescription }, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) => prev.map((item) => item.id === payload.new.id ? { ...item, ...payload.new } : item));
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        },
      },
    ],
    !!user,
  );

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!user) return;

    setUpdatingOrderId(orderId);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (updateError) throw updateError;

      const order = orders.find((item) => item.id === orderId);
      if (!order) throw new Error(to('notFound'));

      await supabase.from('notifications').insert([
        {
          user_id: order.user_id,
          title: t(`customer.orders.statusLabels.${newStatus}`),
          body: t(`customer.orders.notificationMessages.${newStatus}`),
          type: 'order',
          related_entity_id: orderId,
        },
      ]);

      setOrders((prev) => prev.map((item) => item.id === orderId ? { ...item, status: newStatus } : item));
      showToast(to('statusChanged', { status: t(`customer.orders.statusLabels.${newStatus}`) }), 'success');
    } catch (err: any) {
      console.error('Error updating order:', err);
      showToast(err.message || to('updateError'), 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleRefillOrder = async (order: Order) => {
    if (!user) return;

    try {
      setUpdatingOrderId(order.id);
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      if (itemsError) throw itemsError;

      const cart = await getOrCreateCart(user.id, order.pharmacy_id);
      for (const item of orderItems || []) {
        if (!item.medicine_id) continue;
        await addToCart(cart.id, item.medicine_id, item.quantity, item.unit_price);
      }

      showToast(to('refillSuccess'), 'success');
      window.location.href = '/cart';
    } catch (err: any) {
      showToast(err.message || to('refillError'), 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePrescriptionAction = async (prescriptionId: string, action: 'approved' | 'rejected') => {
    if (!user || !isPharmacist) return;

    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', prescriptionId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.prescription?.id === prescriptionId
            ? { ...order, prescription: { ...order.prescription, status: action } }
            : order
        )
      );

      showToast(
        action === 'approved'
          ? language === 'ar'
            ? 'تم الموافقة على الوصفة بنجاح'
            : 'Prescription approved successfully'
          : language === 'ar'
          ? 'تم رفض الوصفة'
          : 'Prescription rejected',
        action === 'approved' ? 'success' : 'info'
      );
      setViewingPrescription(null);
    } catch (err: any) {
      showToast(err.message || to('updateError'), 'error');
    }
  };

  const viewPrescription = async (prescription: Prescription) => {
    try {
      const { data } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(prescription.storage_path);

      setViewingPrescription({ ...prescription, publicUrl: data.publicUrl } as any);
    } catch (err: any) {
      showToast(err.message || 'Failed to load prescription', 'error');
    }
  };

  const actionCopy = useMemo(() => ({
    pendingPrimary: to('confirm'),
    pendingSecondary: to('reject'),
    confirmed: to('startPreparing'),
    preparing: to('markReady'),
    ready: to('complete'),
  }), [to]);

  if (!user) {
    return (
      <div className="p-20 text-center" dir={direction}>
        <p className="text-gray-500">{to('loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-12 lg:py-24" dir={direction}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-4 block">
              {isPharmacist ? to('eyebrowPharmacist') : to('eyebrowCustomer')}
            </span>
            <h1 className="text-5xl font-heading font-bold tracking-tight text-[#1f2f31]">
              {to('title')}<span className="text-[#099aa7]">.</span>
            </h1>
          </div>
          {!isPharmacist && (
            <div className="flex items-center gap-3 text-[11px] font-bold text-[#099aa7] bg-[#099aa7]/5 px-5 py-3 rounded-2xl uppercase tracking-widest border border-[#099aa7]/10">
              <Repeat size={16} aria-hidden="true" />
              <span>{to('autoRefill')}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-[32px] animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-8">
            {orders.map((order) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={order.id}
                className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8">
                  <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-[#099aa7] flex-shrink-0 group-hover:bg-[#099aa7] group-hover:text-white transition-colors duration-500">
                    <Package size={32} />
                  </div>

                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h3 className="font-bold text-2xl text-[#1f2f31]">
                        {to('title')} #{order.order_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[order.status]}`}>
                        {t(`customer.orders.statusLabels.${order.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                      {isPharmacist
                        ? to('customerId', { id: order.user_id.substring(0, 15) })
                        : to('placedOn', { date: formatDate(order.created_at, language) })}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-6 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{to('totalAmount')}</div>
                      <div className="text-3xl font-heading font-bold text-[#1f2f31] tracking-tighter">
                        {formatCurrency(order.total_amount, language)}
                      </div>
                    </div>

                    {!isPharmacist ? (
                      <div className="flex gap-3">
                        <button
                          className="w-12 h-12 flex items-center justify-center bg-[#099aa7] text-white rounded-full hover:bg-[#088a96] transition-all shadow-lg shadow-[#099aa7]/10 focus:outline-none focus:ring-2 focus:ring-[#099aa7] focus:ring-offset-2"
                          aria-label={to('title')}
                        >
                          <ChevronRight size={20} />
                        </button>
                        {(order.status === 'completed' || order.status === 'ready') && (
                          <button
                            onClick={() => handleRefillOrder(order)}
                            disabled={updatingOrderId === order.id}
                            className="px-5 py-2 bg-[#099aa7]/10 text-[#099aa7] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#099aa7]/20 disabled:opacity-50 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#099aa7]"
                          >
                            {updatingOrderId === order.id ? <Loader size={14} className="animate-spin" /> : <Repeat size={14} />}
                            {to('refill')}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap justify-end">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              disabled={updatingOrderId === order.id}
                              className="px-5 py-2 bg-green-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-green-600 disabled:opacity-50 transition-all"
                            >
                              {updatingOrderId === order.id ? to('updateLoading') : actionCopy.pendingPrimary}
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'rejected')}
                              disabled={updatingOrderId === order.id}
                              className="px-5 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 disabled:opacity-50 transition-all"
                            >
                              {actionCopy.pendingSecondary}
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            disabled={updatingOrderId === order.id}
                            className="px-5 py-2 bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:bg-purple-600 disabled:opacity-50 transition-all"
                          >
                            {updatingOrderId === order.id ? to('updateLoading') : actionCopy.confirmed}
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            disabled={updatingOrderId === order.id}
                            className="px-5 py-2 bg-cyan-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 disabled:opacity-50 transition-all"
                          >
                            {updatingOrderId === order.id ? to('updateLoading') : actionCopy.preparing}
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, order.order_type === 'delivery' ? 'out_for_delivery' : 'completed')}
                            disabled={updatingOrderId === order.id}
                            className="px-5 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 disabled:opacity-50 transition-all"
                          >
                            {updatingOrderId === order.id ? to('updateLoading') : actionCopy.ready}
                          </button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            disabled={updatingOrderId === order.id}
                            className="px-5 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 disabled:opacity-50 transition-all"
                          >
                            {updatingOrderId === order.id ? to('updateLoading') : actionCopy.ready}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-1.5 w-full bg-gray-50 relative overflow-hidden">
                  <div className="h-full bg-[#099aa7] transition-all duration-1000" style={{ width: getProgress(order.status) }} />
                </div>

                <div className="px-10 py-5 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-gray-50">
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                      {order.order_type === 'delivery' ? (
                        <Home size={14} className="text-[#099aa7]" />
                      ) : (
                        <Store size={14} className="text-[#099aa7]" />
                      )}
                      <span className="text-gray-600">
                        {order.order_type === 'delivery' ? to('delivery') : to('pickup')}
                      </span>
                    </div>
                    {order.prescription && (
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-orange-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                          {language === 'ar' ? 'وصفة طبية' : 'Prescription'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          order.prescription.status === 'approved'
                            ? 'bg-green-50 text-green-600'
                            : order.prescription.status === 'rejected'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-orange-50 text-orange-600'
                        }`}>
                          {order.prescription.status === 'approved'
                            ? (language === 'ar' ? 'موافق' : 'Approved')
                            : order.prescription.status === 'rejected'
                            ? (language === 'ar' ? 'مرفوض' : 'Rejected')
                            : (language === 'ar' ? 'قيد المراجعة' : 'Pending')}
                        </span>
                        {isPharmacist && (
                          <button
                            onClick={() => viewPrescription(order.prescription!)}
                            className="ml-2 p-1.5 bg-[#099aa7]/10 text-[#099aa7] rounded-lg hover:bg-[#099aa7]/20 transition-all"
                            title={language === 'ar' ? 'عرض الوصفة' : 'View Prescription'}
                          >
                            <Eye size={14} />
                          </button>
                        )}
                      </div>
                    )}
                    {order.notes && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        <span>{to('notes')}:</span>
                        <span>{order.notes}</span>
                      </div>
                    )}
                  </div>
                  {order.order_type === 'delivery' && order.address && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                      <MapPin size={14} className="text-[#099aa7]" />
                      <span>{order.address.title} - {order.address.district}, {order.address.city}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Package size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#1f2f31] mb-2">{to('emptyTitle')}</h3>
            <p className="text-[#363f40] font-medium max-w-sm mx-auto">
              {isPharmacist ? to('emptyPharmacist') : to('emptyCustomer')}
            </p>
          </div>
        )}
      </div>

      {/* Prescription Viewer Modal */}
      {viewingPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingPrescription(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-[#1f2f31] mb-1">
                  {language === 'ar' ? 'عرض الوصفة الطبية' : 'Prescription Review'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'ar' ? 'اسم الملف' : 'File'}: {viewingPrescription.file_name}
                </p>
              </div>
              <button
                onClick={() => setViewingPrescription(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[60vh]">
              {(viewingPrescription as any).publicUrl && (
                <div className="mb-6">
                  {viewingPrescription.mime_type?.startsWith('image/') ? (
                    <img
                      src={(viewingPrescription as any).publicUrl}
                      alt="Prescription"
                      className="w-full rounded-2xl border border-gray-200"
                    />
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 mb-4">
                        {language === 'ar' ? 'ملف PDF' : 'PDF Document'}
                      </p>
                      <a
                        href={(viewingPrescription as any).publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#099aa7] text-white rounded-xl hover:bg-[#088a96] transition-all"
                      >
                        <Download size={18} />
                        {language === 'ar' ? 'تحميل الملف' : 'Download File'}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {viewingPrescription.notes && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {language === 'ar' ? 'ملاحظات' : 'Notes'}
                  </p>
                  <p className="text-sm text-gray-700">{viewingPrescription.notes}</p>
                </div>
              )}
            </div>

            {isPharmacist && viewingPrescription.status === 'pending' && (
              <div className="p-8 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => handlePrescriptionAction(viewingPrescription.id, 'approved')}
                  className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  {language === 'ar' ? 'الموافقة' : 'Approve'}
                </button>
                <button
                  onClick={() => handlePrescriptionAction(viewingPrescription.id, 'rejected')}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  {language === 'ar' ? 'رفض' : 'Reject'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Orders;
