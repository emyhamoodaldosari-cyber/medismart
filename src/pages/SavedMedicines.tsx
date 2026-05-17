import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, ShoppingCart, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { InventoryItem, Medicine } from '../types';
import { addToCart, getOrCreateCart } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { getMedicineImageSrc } from '../utils/medicineImage';
import { formatCurrency } from '../utils/localization';
import ConfirmDialog from '../components/ConfirmDialog';

const SavedMedicines = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, direction, t } = useLanguage();
  const ts = (key: string) => t(`customer.saved.${key}`);
  const tc = (key: string) => t(`customer.common.${key}`);

  const [medicines, setMedicines] = useState<(Medicine & { inventory: InventoryItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSavedMedicines();
    }
  }, [user]);

  const subtitle = useMemo(() => {
    const count = medicines.length;
    return `${count} ${count === 1 ? ts('subtitleOne') : ts('subtitleMany')}`;
  }, [medicines.length, ts]);

  const fetchSavedMedicines = async () => {
    try {
      setLoading(true);
      const { data: saved, error: savedError } = await supabase
        .from('saved_medicines')
        .select(`medicine:medicines(*)`)
        .eq('user_id', user?.id)
        .order('saved_at', { ascending: false });

      if (savedError) throw savedError;

      const medicinesWithInventory = await Promise.all(
        (saved || []).map(async (item: any) => {
          const { data: inv } = await supabase
            .from('pharmacy_inventory')
            .select(`*, pharmacy:pharmacies(*)`)
            .eq('medicine_id', item.medicine.id)
            .eq('in_stock', true)
            .gt('quantity', 0)
            .order('price', { ascending: true });

          return {
            ...item.medicine,
            inventory: inv || [],
          };
        }),
      );

      setMedicines(medicinesWithInventory);
    } catch (error: any) {
      showToast(error.message || ts('loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeSaved = async () => {
    if (!selectedMedicine) return;
    try {
      await supabase.from('saved_medicines').delete().eq('user_id', user?.id).eq('medicine_id', selectedMedicine);
      setMedicines((prev) => prev.filter((item) => item.id !== selectedMedicine));
      showToast(ts('removed'), 'success');
      setShowRemoveDialog(false);
      setSelectedMedicine(null);
    } catch (error: any) {
      showToast(error.message || ts('removeError'), 'error');
    }
  };

  const handleAddToCart = async (medicine: Medicine & { inventory: InventoryItem[] }) => {
    if (!user) {
      showToast(tc('pleaseSignIn'), 'warning');
      navigate('/login');
      return;
    }

    const bestInventory = medicine.inventory[0];
    if (!bestInventory) {
      showToast(ts('pharmacyUnavailable'), 'warning');
      return;
    }

    try {
      setBusyId(medicine.id);
      const cart = await getOrCreateCart(user.id, bestInventory.pharmacy_id);
      await addToCart(cart.id, medicine.id, 1, bestInventory.price);
      showToast(ts('addedToCart'), 'success');
      navigate('/cart');
    } catch (error: any) {
      showToast(error.message || ts('addToCartError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="animate-spin text-[#099aa7]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20" dir={direction}>
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-4 block">{ts('eyebrow')}</span>
          <h1 className="text-5xl font-heading font-bold text-[#1f2f31] mb-4">{ts('title')}</h1>
          <p className="text-slate-600 font-medium">{subtitle}</p>
        </div>

        {medicines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-16 border border-dashed border-slate-200 text-center"
          >
            <Heart className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-2xl font-bold text-[#1f2f31] mb-2">{ts('emptyTitle')}</h3>
            <p className="text-slate-600 mb-8">{ts('emptyMessage')}</p>
            <button
              onClick={() => navigate('/medicines')}
              className="px-8 py-4 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] transition-all"
            >
              {tc('browseMedicines')}
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {medicines.map((medicine, idx) => {
              const bestInventory = medicine.inventory[0];
              return (
                <motion.div
                  key={medicine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="p-8">
                    <div className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
                      <div className="aspect-[4/3] w-full overflow-hidden">
                        <img 
                          src={getMedicineImageSrc(medicine)} 
                          alt={language === 'ar' && medicine.brand_name_ar ? medicine.brand_name_ar : medicine.brand_name} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getMedicineImageSrc(null, language === 'ar' && medicine.brand_name_ar ? medicine.brand_name_ar : medicine.brand_name);
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-start justify-between mb-6 gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-2 block">
                          {medicine.dosage_form || ts('dosageFallback')}
                        </span>
                        <h3 className="text-2xl font-heading font-bold text-[#1f2f31] mb-1">{language === 'ar' && medicine.brand_name_ar ? medicine.brand_name_ar : medicine.brand_name}</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">{language === 'ar' && medicine.generic_name_ar ? medicine.generic_name_ar : medicine.generic_name}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMedicine(medicine.id);
                          setShowRemoveDialog(true);
                        }}
                        className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                      >
                        <Heart size={20} fill="currentColor" />
                      </button>
                    </div>

                    {medicine.strength && (
                      <p className="text-sm text-slate-600 mb-6">
                        <span className="font-bold text-[#1f2f31]">{ts('strength')}:</span> {medicine.strength}
                      </p>
                    )}

                    {bestInventory ? (
                      <div className="mb-6 pb-6 border-b border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{ts('bestAvailablePrice')}</p>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-[#1f2f31]">{bestInventory.pharmacy?.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{bestInventory.pharmacy?.district}</p>
                          </div>
                          <p className="text-lg font-bold text-[#099aa7]">{formatCurrency(bestInventory.price, language)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 pb-6 border-b border-slate-100 text-center">
                        <p className="text-sm text-orange-600 font-medium">{ts('currentlyUnavailable')}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => navigate(`/medicines/${medicine.id}`)}
                        className="py-3 px-4 bg-slate-50 text-[#1f2f31] font-bold rounded-xl hover:bg-slate-100 transition-all text-sm"
                      >
                        {ts('viewDetails')}
                      </button>
                      <button
                        disabled={!bestInventory || busyId === medicine.id}
                        onClick={() => handleAddToCart(medicine)}
                        className="py-3 px-4 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={16} />
                        {busyId === medicine.id ? tc('loading') : ts('addToCart')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showRemoveDialog}
        onClose={() => {
          setShowRemoveDialog(false);
          setSelectedMedicine(null);
        }}
        onConfirm={removeSaved}
        title={ts('confirmRemove')}
        message={ts('confirmRemoveMessage')}
        confirmText={tc('remove')}
        type="danger"
      />
    </div>
  );
};

export default SavedMedicines;
