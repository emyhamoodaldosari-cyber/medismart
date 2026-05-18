import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Heart, MessageSquare, ShoppingCart, MapPin, AlertCircle, Loader, TrendingDown, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Medicine, InventoryItem, UserAddress } from '../types';
import { addToCart, getOrCreateCart, getUserAddresses } from '../services/api';
import { TERMINOLOGY } from '../constants/terminology';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useLanguage } from '../contexts/LanguageContext';
import { getMedicineImageSrc } from '../utils/medicineImage';
import { formatCurrency } from '../utils/localization';

const MedicineDetails = () => {
  const { medicineId } = useParams<{ medicineId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, direction, t } = useLanguage();
  const td = (key: string) => t(`customer.medicineDetails.${key}`);
  const tm = (key: string) => t(`customer.medicines.${key}`);

  const labels = {
    pleaseLogin: td('pleaseLogin'),
    saved: td('saved'),
    unsaved: td('unsaved'),
    operationFailed: td('operationFailed'),
    loading: td('loading'),
    notFound: td('notFound'),
    strength: td('strength'),
    manufacturer: td('manufacturer'),
    requiresPrescription: td('requiresPrescription'),
    yes: td('yes'),
    no: td('no'),
    availableAt: td('availableAt'),
    pharmacies: td('pharmacies'),
    aboutMedicine: td('aboutMedicine'),
    usageInstructions: td('usageInstructions'),
    warnings: td('warnings'),
    priceComparison: td('priceComparison'),
    bestPrice: td('bestPrice'),
    cheapest: td('cheapest'),
    inStock: td('inStock'),
    limitedStock: td('limitedStock'),
    deliveryAvailable: td('deliveryAvailable'),
    selectedPharmacy: td('selectedPharmacy'),
    quantity: td('quantity'),
    unitPrice: td('unitPrice'),
    totalPrice: td('totalPrice'),
    addToCart: td('addToCart'),
    askPharmacist: td('askPharmacist'),
    unavailable: td('unavailable'),
    dosageFallback: tm('dosageFallback'),
    back: td('back'),
    choosePharmacy: td('choosePharmacy'),
    decrease: td('decrease'),
    increase: td('increase'),
    addToCartSuccess: td('addToCartSuccess'),
    loadError: td('loadError'),
  };

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [availability, setAvailability] = useState<InventoryItem[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    fetchMedicineDetails();
  }, [medicineId]);

  // Realtime subscription for inventory availability updates
  useRealtimeSubscription(
    `medicine-inventory-${medicineId}`,
    [
      {
        table: 'pharmacy_inventory',
        event: 'UPDATE',
        filter: medicineId ? `medicine_id=eq.${medicineId}` : undefined,
        callback: (payload) => {
          console.log('Medicine inventory updated:', payload);
          // Update availability list
          setAvailability(prev => prev.map(item => 
            item.id === payload.new.id 
              ? { ...item, ...payload.new }
              : item
          ));
          // Update selected pharmacy if it's the one that changed
          if (selectedPharmacy?.id === payload.new.id) {
            setSelectedPharmacy(prev => prev ? { ...prev, ...payload.new } : null);
          }
        }
      },
      {
        table: 'pharmacy_inventory',
        event: 'INSERT',
        filter: medicineId ? `medicine_id=eq.${medicineId}` : undefined,
        callback: (payload) => {
          console.log('New pharmacy has this medicine:', payload);
          // Refetch to get complete data with pharmacy info
          fetchMedicineDetails();
        }
      },
      {
        table: 'pharmacy_inventory',
        event: 'DELETE',
        filter: medicineId ? `medicine_id=eq.${medicineId}` : undefined,
        callback: (payload) => {
          console.log('Medicine removed from pharmacy:', payload);
          setAvailability(prev => prev.filter(item => item.id !== payload.old.id));
          if (selectedPharmacy?.id === payload.old.id) {
            setSelectedPharmacy(availability[0] || null);
          }
        }
      }
    ],
    !!medicineId
  );

  useEffect(() => {
    if (user && medicine) {
      checkIfSaved();
      loadUserAddresses();
    }
  }, [user, medicine]);

  const loadUserAddresses = async () => {
    if (!user) return;
    try {
      const addresses = await getUserAddresses(user.id);
      setUserAddresses(addresses);
      const defaultAddr = addresses.find(a => a.is_default);
      setSelectedAddress(defaultAddr || addresses[0] || null);
    } catch (error: any) {
      console.error('Error loading addresses:', error);
    }
  };

  const fetchMedicineDetails = async () => {
    try {
      setLoading(true);
      const { data: med, error: medError } = await supabase
        .from('medicines')
        .select('*')
        .eq('id', medicineId)
        .single();

      if (medError) throw medError;
      setMedicine(med as Medicine);

      const { data: inv, error: invError } = await supabase
        .from('pharmacy_inventory')
        .select(`
          *,
          pharmacy:pharmacies(*)
        `)
        .eq('medicine_id', medicineId)
        .eq('in_stock', true)
        .gt('quantity', 0)
        .order('price', { ascending: true });

      if (invError) throw invError;
      setAvailability(inv as InventoryItem[]);
      if (inv && inv.length > 0) {
        setSelectedPharmacy(inv[0] as InventoryItem);
      }
    } catch (error: any) {
      showToast(error.message || td('loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data } = await supabase
        .from('saved_medicines')
        .select('id')
        .eq('user_id', user?.id)
        .eq('medicine_id', medicineId)
        .single();

      setIsSaved(!!data);
    } catch {
      setIsSaved(false);
    }
  };

  const toggleSave = async () => {
    if (!user) {
      showToast(labels.pleaseLogin, 'error');
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from('saved_medicines')
          .delete()
          .eq('user_id', user.id)
          .eq('medicine_id', medicineId);
        setIsSaved(false);
        showToast(labels.unsaved, 'success');
      } else {
        await supabase
          .from('saved_medicines')
          .insert([{ user_id: user.id, medicine_id: medicineId }]);
        setIsSaved(true);
        showToast(labels.saved, 'success');
      }
    } catch (error: any) {
      showToast(error.message || labels.operationFailed, 'error');
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      setShowLoginAlert(true);
      return;
    }

    if (medicine?.requires_prescription && !prescriptionFile) {
      setShowPrescriptionModal(true);
      return;
    }

    if (!selectedAddress) {
      setShowAddressModal(true);
      showToast('Please select a delivery address', 'error');
      return;
    }

    try {
      setAddingToCart(true);
      const cart = await getOrCreateCart(user.id, selectedPharmacy?.pharmacy_id);
      await addToCart(cart.id, medicineId!, quantity, selectedPharmacy?.price || 0);

      // If prescription was uploaded, associate it with the order later at checkout
      if (medicine?.requires_prescription && prescriptionFile) {
        sessionStorage.setItem(`prescription_${medicineId}`, JSON.stringify({
          file: prescriptionFile.name,
          timestamp: Date.now()
        }));
      }

      showToast(td('addToCartSuccess'), 'success');
      navigate('/cart');
    } catch (error: any) {
      showToast(error.message || labels.operationFailed, 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handlePrescriptionUpload = async (file: File) => {
    if (!user) {
      showToast('Please login to upload prescription', 'error');
      return;
    }

    try {
      setPrescriptionUploading(true);

      // Validate file
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        showToast('Only PDF, JPEG, and PNG files are allowed', 'error');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
      }

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop()?.toLowerCase() || file.type.split('/')[1];
      const fileName = `${user.id}-${medicineId}-${Date.now()}.${fileExt}`;
      const filePath = `prescriptions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload prescription file');
      }

      setPrescriptionFile(file);
      setShowPrescriptionModal(false);
      showToast('Prescription uploaded successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to upload prescription', 'error');
    } finally {
      setPrescriptionUploading(false);
    }
  };

  const handleAskPharmacist = () => {
    if (!user) {
      setShowLoginAlert(true);
      return;
    }
    navigate(`/chat?pharmacy=${selectedPharmacy?.pharmacy_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="animate-spin text-[#099aa7]" size={40} aria-label={labels.loading} />
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} aria-hidden="true" />
          <h3 className="text-xl font-bold text-[#1f2f31]">{labels.notFound}</h3>
        </div>
      </div>
    );
  }

  const lowestPrice = availability.length > 0 ? availability[0].price : 0;

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20" dir={direction}>
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#099aa7] font-bold mb-8 hover:gap-3 transition-all focus:outline-none focus:ring-2 focus:ring-[#099aa7] rounded-lg px-2 py-1"
          aria-label={labels.back}
        >
          <ArrowLeft size={20} /> {labels.back}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Medicine Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm mb-8">
              <div className="grid gap-8 lg:grid-cols-[320px,1fr] mb-8 items-start">
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-inner">
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img 
                      src={getMedicineImageSrc(medicine)} 
                      alt={language === 'ar' && medicine.brand_name_ar ? medicine.brand_name_ar : medicine.brand_name} 
                      className="h-full w-full object-cover"
                      loading="eager"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = getMedicineImageSrc(null, language === 'ar' && medicine.brand_name_ar ? medicine.brand_name_ar : medicine.brand_name);
                        if (target.src !== fallback) {
                          console.warn('Failed to load medicine detail image, using placeholder:', target.src);
                          target.src = fallback;
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-4 block">
                      {medicine.dosage_form || labels.dosageFallback}
                    </span>
                    <h1 className="text-5xl font-heading font-bold text-[#1f2f31] mb-2">
                      {language === 'ar' && medicine.brand_name_ar ? medicine.brand_name_ar : medicine.brand_name}
                    </h1>
                    <p className="text-lg text-slate-500 font-medium">{language === 'ar' && medicine.generic_name_ar ? medicine.generic_name_ar : medicine.generic_name}</p>
                  </div>
                  <button
                  onClick={toggleSave}
                  className={`p-4 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    isSaved
                      ? 'bg-red-50 text-red-500'
                      : 'bg-slate-50 text-slate-400 hover:text-red-500'
                  }`}
                  aria-label={isSaved ? labels.unsaved : labels.saved}
                  title={isSaved ? labels.unsaved : labels.saved}
                >
                  <Heart size={24} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 pb-10 border-b border-slate-100">
                {medicine.strength && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      {labels.strength}
                    </p>
                    <p className="text-lg font-bold text-[#1f2f31]">{medicine.strength}</p>
                  </div>
                )}
                {medicine.manufacturer && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      {labels.manufacturer}
                    </p>
                    <p className="text-lg font-bold text-[#1f2f31]">{medicine.manufacturer}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    {labels.requiresPrescription}
                  </p>
                  <p className="text-lg font-bold text-[#1f2f31]">
                    {medicine.requires_prescription ? labels.yes : labels.no}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    {labels.availableAt}
                  </p>
                  <p className="text-lg font-bold text-[#1f2f31]">{availability.length} {labels.pharmacies}</p>
                </div>
              </div>

              {/* Description */}
              {medicine.description && (
                <div className="mb-10">
                  <h3 className="text-lg font-bold text-[#1f2f31] mb-4">{labels.aboutMedicine}</h3>
                  <p className="text-slate-600 leading-relaxed">{medicine.description}</p>
                </div>
              )}

              {/* Usage Instructions */}
              {medicine.usage_instructions && (
                <div className="mb-10">
                  <h3 className="text-lg font-bold text-[#1f2f31] mb-4">{labels.usageInstructions}</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {medicine.usage_instructions}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {medicine.warnings && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle size={20} /> {labels.warnings}
                  </h3>
                  <p className="text-orange-800 leading-relaxed whitespace-pre-wrap">
                    {medicine.warnings}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Availability & Purchase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            {/* Price Comparison */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1f2f31]">{labels.priceComparison}</h3>
                <span className="text-sm text-slate-500">{availability.length} {labels.pharmacies}</span>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availability.map((item, index) => {
                  const priceDiff = index === 0 ? 0 : ((item.price - availability[0].price) / availability[0].price * 100);
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedPharmacy(item)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#099aa7] ${
                        selectedPharmacy?.id === item.id
                          ? 'border-[#099aa7] bg-[#099aa7]/5'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                      aria-label={`${labels.choosePharmacy}: ${item.pharmacy?.name} - ${formatCurrency(item.price, language)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-[#1f2f31]">{item.pharmacy?.name}</p>
                            {index === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold uppercase tracking-wider rounded" aria-label={labels.bestPrice}>
                                <TrendingDown size={10} />
                                {labels.cheapest}
                              </span>
                            )}
                            {index > 0 && priceDiff > 0 && (
                              <span className="text-xs text-orange-600 font-semibold">
                                +{priceDiff.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            {item.pharmacy?.district}, {item.pharmacy?.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#099aa7]">
                            {formatCurrency(item.price, language)}
                          </p>
                          {index > 0 && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              +{formatCurrency(item.price - availability[0].price, language)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`font-bold uppercase tracking-widest ${
                          item.quantity > 10 ? 'text-[#099aa7]' : 'text-orange-500'
                        }`}>
                          {item.quantity > 10 ? labels.inStock : `${labels.limitedStock}: ${item.quantity}`}
                        </span>
                        {item.pharmacy?.delivery_available && (
                          <span className="text-[#099aa7] font-bold">{labels.deliveryAvailable}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purchase Section */}
            {selectedPharmacy && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm sticky top-32">
                <div className="mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    {labels.selectedPharmacy}
                  </p>
                  <p className="text-lg font-bold text-[#1f2f31] mb-1">{selectedPharmacy.pharmacy?.name}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} />
                    {selectedPharmacy.pharmacy?.street}, {selectedPharmacy.pharmacy?.district}
                  </div>
                </div>

                <div className="mb-8 pb-8 border-b border-slate-100">
                  <label htmlFor="quantity-input" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">
                    {labels.quantity}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#099aa7]"
                      aria-label={labels.decrease}
                    >
                      -
                    </button>
                    <input
                      id="quantity-input"
                      type="number"
                      min="1"
                      max={selectedPharmacy.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(selectedPharmacy.quantity, parseInt(e.target.value) || 1)))}
                      className="text-2xl font-bold text-[#1f2f31] w-12 text-center border-none outline-none"
                      aria-label={labels.quantity}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedPharmacy.quantity, quantity + 1))}
                      className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#099aa7]"
                      aria-label={labels.increase}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-600">{labels.unitPrice}</span>
                    <span className="font-bold text-[#1f2f31]">{formatCurrency(selectedPharmacy.price, language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-bold text-[#1f2f31]">{labels.totalPrice}</span>
                    <span className="text-3xl font-bold text-[#099aa7]">
                      {formatCurrency(selectedPharmacy.price * quantity, language)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full py-4 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-4 focus:outline-none focus:ring-2 focus:ring-[#099aa7] focus:ring-offset-2"
                  aria-label={labels.addToCart}
                >
                  <ShoppingCart size={20} />
                  {addingToCart ? labels.loading : labels.addToCart}
                </button>

                <button 
                  onClick={handleAskPharmacist}
                  className="w-full py-4 bg-slate-100 text-[#1f2f31] font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#099aa7] focus:ring-offset-2"
                  aria-label={labels.askPharmacist}
                >
                  <MessageSquare size={20} />
                  {labels.askPharmacist}
                </button>

                {medicine.requires_prescription && prescriptionFile && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-700">✓ Prescription uploaded</span>
                    <button
                      onClick={() => setPrescriptionFile(null)}
                      className="text-green-600 hover:text-green-800 focus:outline-none"
                      aria-label="Remove prescription"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {availability.length === 0 && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
                <AlertCircle className="mx-auto text-gray-300 mb-4" size={40} aria-hidden="true" />
                <p className="text-slate-600 font-medium">{labels.unavailable}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Login Alert Modal */}
        {showLoginAlert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-[#1f2f31]">Sign In Required</h3>
                <button
                  onClick={() => setShowLoginAlert(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-slate-600 mb-8">
                Please sign in to your account to add items to cart or chat with pharmacists.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginAlert(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLoginAlert(false);
                    navigate('/login');
                  }}
                  className="flex-1 py-3 bg-[#099aa7] text-white rounded-2xl font-bold hover:bg-[#088a96] transition-all"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Prescription Upload Modal */}
        {showPrescriptionModal && medicine?.requires_prescription && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-[#1f2f31]">Upload Prescription</h3>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-slate-600 mb-6">
                This medicine requires a prescription. Please upload a valid prescription file (PDF or image).
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePrescriptionUpload(file);
                    }
                  }}
                  disabled={prescriptionUploading}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#099aa7] hover:bg-[#099aa7]/5 transition-all">
                  <Upload className="mx-auto mb-3 text-slate-400" size={32} />
                  <p className="font-semibold text-slate-700 mb-1">Click to upload</p>
                  <p className="text-sm text-slate-500">PDF, JPEG, or PNG up to 10MB</p>
                  {prescriptionFile && (
                    <p className="text-sm text-green-600 mt-2">✓ {prescriptionFile.name}</p>
                  )}
                </div>
              </label>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  disabled={prescriptionUploading}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (prescriptionFile) {
                      setShowPrescriptionModal(false);
                    }
                  }}
                  disabled={!prescriptionFile || prescriptionUploading}
                  className="flex-1 py-3 bg-[#099aa7] text-white rounded-2xl font-bold hover:bg-[#088a96] transition-all disabled:opacity-50"
                >
                  {prescriptionUploading ? 'Uploading...' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineDetails;

