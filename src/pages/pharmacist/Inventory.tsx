import React, { useEffect, useState } from 'react';
import { AlertCircle, Edit, Package, Pill, Plus, RefreshCw, Search, Trash2, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getMedicineImageSrc } from '../../utils/medicineImage';
import { InventoryItem } from '../../types';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import AdminPageHeader from '../../components/AdminPageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';

const PharmacistInventory = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  const copy = {
    title: t('screens.pharmacistInventory.title'),
    subtitle: t('screens.pharmacistInventory.subtitle'),
    addAction: t('screens.pharmacistInventory.addAction'),
    searchPlaceholder: t('screens.pharmacistInventory.searchPlaceholder'),
    loadError: t('screens.pharmacistInventory.loadError'),
    deleteError: t('screens.pharmacistInventory.deleteError'),
    deleteSuccess: t('screens.pharmacistInventory.deleteSuccess'),
    quantitySuccess: t('screens.pharmacistInventory.quantitySuccess'),
    quantityError: t('screens.pharmacistInventory.quantityError'),
    noInventory: t('screens.pharmacistInventory.noInventory'),
    noInventoryMessage: t('screens.pharmacistInventory.noInventoryMessage'),
    medicine: t('screens.pharmacistInventory.medicine'),
    price: t('screens.pharmacistInventory.price'),
    quantity: t('screens.pharmacistInventory.quantity'),
    expiry: t('screens.pharmacistInventory.expiry'),
    status: t('screens.pharmacistInventory.status'),
    updated: t('screens.pharmacistInventory.updated'),
    actions: t('screens.pharmacistInventory.actions'),
    deleteTitle: t('screens.pharmacistInventory.deleteTitle'),
    deleteMessage: t('screens.pharmacistInventory.deleteMessage'),
    emptyAction: t('screens.pharmacistInventory.emptyAction'),
    currency: t('screens.pharmacistInventory.currency'),
    stock: t('screens.pharmacistInventory.stock'),
    healthyStock: t('screens.pharmacistInventory.healthyStock'),
    lowStock: t('screens.pharmacistInventory.lowStock'),
    units: t('screens.pharmacistInventory.units'),
    threshold: t('screens.pharmacistInventory.threshold'),
    unavailable: t('screens.pharmacistInventory.unavailable'),
    edit: t('screens.pharmacistInventory.edit'),
    delete: t('screens.pharmacistInventory.delete'),
    stockStatus: {
      inStock: t('screens.pharmacistInventory.stockStatus.inStock'),
      lowStock: t('screens.pharmacistInventory.stockStatus.lowStock'),
      outOfStock: t('screens.pharmacistInventory.stockStatus.outOfStock'),
    },
  };

  useEffect(() => {
    void fetchInventory();
  }, [profile?.pharmacy_id]);

  useRealtimeSubscription(
    `pharmacist-inventory-${profile?.pharmacy_id}`,
    [
      {
        table: 'pharmacy_inventory',
        event: '*',
        filter: profile?.pharmacy_id ? `pharmacy_id=eq.${profile.pharmacy_id}` : undefined,
        callback: () => {
          void fetchInventory();
        },
      },
    ],
    Boolean(profile?.pharmacy_id),
  );

  const fetchInventory = async () => {
    if (!profile?.pharmacy_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pharmacy_inventory')
        .select('*, medicine:medicines(*)')
        .eq('pharmacy_id', profile.pharmacy_id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setItems((data as InventoryItem[]) || []);
    } catch (err: any) {
      showToast(err.message || copy.loadError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (item: InventoryItem, newQty: number) => {
    try {
      const { error } = await supabase
        .from('pharmacy_inventory')
        .update({ quantity: newQty, in_stock: newQty > 0 })
        .eq('id', item.id);
      if (error) throw error;
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, quantity: newQty, in_stock: newQty > 0 } : entry)));
      showToast(copy.quantitySuccess, 'success');
    } catch (err: any) {
      showToast(err.message || copy.quantityError, 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      setDialogLoading(true);
      const { error } = await supabase.from('pharmacy_inventory').delete().eq('id', selectedItem.id);
      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      showToast(copy.deleteSuccess, 'success');
      setSelectedItem(null);
    } catch (err: any) {
      showToast(err.message || copy.deleteError, 'error');
    } finally {
      setDialogLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    `${item.medicine?.brand_name || ''} ${item.medicine?.brand_name_ar || ''} ${item.medicine?.generic_name || ''} ${item.medicine?.generic_name_ar || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const summary = {
    total: items.length,
    inStock: items.filter((item) => item.in_stock).length,
    lowStock: items.filter((item) => item.quantity <= item.low_stock_threshold).length,
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-24">
      <div className="container mx-auto max-w-7xl">
        <AdminPageHeader
          title={copy.title}
          subtitle={copy.subtitle}
          action={{ label: copy.addAction, onClick: () => navigate('/pharmacist/medicine/new'), icon: <Plus size={18} /> }}
          onRefresh={fetchInventory}
          refreshing={loading}
        />

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          {[
            { icon: <Package size={22} />, label: copy.medicine, value: summary.total },
            { icon: <Pill size={22} />, label: copy.healthyStock, value: summary.inStock },
            { icon: <TriangleAlert size={22} />, label: copy.lowStock, value: summary.lowStock },
          ].map((card) => (
            <div key={card.label} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#099aa7]/10 text-[#099aa7]">{card.icon}</div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <h2 className="mt-2 text-3xl font-bold text-[#1f2f31]">{card.value}</h2>
            </div>
          ))}
        </div>

        <div className="mb-6 flex rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="relative w-full max-w-md">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-4 rtl:right-4" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm outline-none transition focus:border-[#099aa7] focus:bg-white ltr:pl-11 ltr:pr-4 rtl:pr-11 rtl:pl-4"
            />
          </div>
        </div>

        {filteredItems.length === 0 && !loading ? (
          <div className="rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <EmptyState icon={Package} title={copy.noInventory} message={copy.noInventoryMessage} action={{ label: copy.addAction, onClick: () => navigate('/pharmacist/medicine/new') }} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80 text-start text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{copy.medicine}</th>
                    <th className="px-6 py-4 font-semibold">{copy.price}</th>
                    <th className="px-6 py-4 font-semibold">{copy.stock}</th>
                    <th className="px-6 py-4 font-semibold">{copy.expiry}</th>
                    <th className="px-6 py-4 font-semibold">{copy.updated}</th>
                    <th className="px-6 py-4 font-semibold">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const brandName = language === 'ar' ? item.medicine?.brand_name_ar || item.medicine?.brand_name : item.medicine?.brand_name || item.medicine?.brand_name_ar;
                    const genericName = language === 'ar' ? item.medicine?.generic_name_ar || item.medicine?.generic_name : item.medicine?.generic_name || item.medicine?.generic_name_ar;
                    const lowStock = item.quantity <= item.low_stock_threshold;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                              <img 
                                src={getMedicineImageSrc(item.medicine, brandName)} 
                                alt={brandName} 
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const fallback = getMedicineImageSrc(null, brandName);
                                  if (target.src !== fallback) {
                                    console.warn('Failed to load inventory image, using placeholder:', target.src);
                                    target.src = fallback;
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-[#1f2f31]">{brandName}</p>
                              <p className="text-sm text-slate-500">{genericName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-[#1f2f31]">{item.price.toFixed(2)} {copy.currency}</td>
                        <td className="px-6 py-5">
                          <div className="space-y-3">
                            <StatusBadge status={lowStock ? 'cancelled' : 'completed'} type="order" label={lowStock ? copy.lowStock : copy.healthyStock} />
                            <div className="flex items-center gap-3">
                              <button onClick={() => updateStock(item, Math.max(0, item.quantity - 1))} className="h-8 w-8 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 transition hover:border-[#099aa7]/30">-</button>
                              <span className="min-w-[72px] text-center text-sm font-semibold text-[#1f2f31]">{item.quantity} {copy.units}</span>
                              <button onClick={() => updateStock(item, item.quantity + 1)} className="h-8 w-8 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 transition hover:border-[#099aa7]/30">+</button>
                            </div>
                            <p className="text-xs text-slate-500">{copy.threshold}: {item.low_stock_threshold}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : copy.unavailable}</td>
                        <td className="px-6 py-5 text-sm text-slate-600">{new Date(item.updated_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => navigate(`/pharmacist/medicine/${item.medicine_id}`)} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#099aa7]/30 hover:bg-[#099aa7]/5 hover:text-[#099aa7]" title={copy.edit}><Edit size={18} /></button>
                            <button onClick={() => setSelectedItem(item)} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600" title={copy.delete}><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleDelete}
          title={copy.deleteTitle}
          message={copy.deleteMessage}
          confirmText={copy.delete}
          type="danger"
          loading={dialogLoading}
        />
      </div>
    </div>
  );
};

export default PharmacistInventory;
