import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ArrowRight, CheckCircle, Clock, FileText, Home, Loader, MapPin, Minus, Package, Plus, Shield, ShoppingCart, Store, Trash2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { Cart as CartType, CartItem, Order, OrderItem, OrderType, Prescription, UserAddress } from '../types';
import { addToCart, getCartItems, getOrCreateCart, getUserAddresses, placeOrder, removeFromCart, updateCartItem } from '../services/api';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/localization';

const Cart = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { language, direction, t } = useLanguage();
  const tcart = (key: string) => t(`customer.cart.${key}`);
  const tcommon = (key: string) => t(`customer.common.${key}`);
  const torders = (key: string) => t(`customer.orders.${key}`);

  const [cart, setCart] = useState<CartType | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pharmacyName, setPharmacyName] = useState('');
  const [deliveryFeeFromDb, setDeliveryFeeFromDb] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadCart = async () => {
      try {
        const userCart = await getOrCreateCart(user.id);
        setCart(userCart);
        const items = await getCartItems(userCart.id);
        setCartItems(items);

        if (userCart.pharmacy_id) {
          const { data: pharmacy } = await supabase
            .from('pharmacies')
            .select('name, delivery_available, delivery_fee')
            .eq('id', userCart.pharmacy_id)
            .single();

          if (pharmacy) {
            setPharmacyName(pharmacy.name);
            setDeliveryFeeFromDb(pharmacy.delivery_fee || 0);
            if (!pharmacy.delivery_available) {
              setOrderType('pickup');
            }
          }
        }

        const userAddresses = await getUserAddresses(user.id);
        setAddresses(userAddresses);
        const defaultAddress = userAddresses.find((addr) => addr.is_default);
        if (defaultAddress) setSelectedAddressId(defaultAddress.id);
      } catch (err: any) {
        console.error('Error loading cart:', err);
        showToast(tcart('loadError'), 'error');
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user]);

  const subtotal = useMemo(() => cartItems.reduce((total, item) => total + item.unit_price * item.quantity, 0), [cartItems]);
  const deliveryFee = orderType === 'delivery' ? deliveryFeeFromDb : 0;
  const total = subtotal + deliveryFee;
  const needsPrescription = useMemo(() => cartItems.some((item) => item.medicine?.requires_prescription), [cartItems]);
  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(cartItemId, newQuantity);
      setCartItems((prev) => prev.map((item) => item.id === cartItemId ? { ...item, quantity: newQuantity } : item));
      showToast(tcart('quantityUpdated'), 'success');
    } catch (err: any) {
      showToast(err.message || tcart('quantityError'), 'error');
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId);
      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
      showToast(tcart('itemRemoved'), 'success');
    } catch (err: any) {
      showToast(err.message || tcart('removeError'), 'error');
    }
  };

  const createPrescriptionRecord = async (): Promise<Prescription | null> => {
    if (!user || !prescriptionFile || !cart?.pharmacy_id) return null;

    showToast(tcart('uploadingPrescription'), 'info');
    const fileExt = prescriptionFile.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(filePath, prescriptionFile, { upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('prescriptions')
      .insert([
        {
          user_id: user.id,
          pharmacy_id: cart.pharmacy_id,
          storage_path: uploadData.path,
          file_name: prescriptionFile.name,
          mime_type: prescriptionFile.type,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Prescription;
  };

  const handleCheckout = async () => {
    if (!user || !cart) {
      showToast(tcart('loginWarning'), 'warning');
      navigate('/login');
      return;
    }
    if (!cartItems.length) {
      showToast(tcart('emptyWarning'), 'warning');
      return;
    }
    if (!cart.pharmacy_id) {
      showToast(tcart('missingPharmacy'), 'error');
      return;
    }
    if (orderType === 'delivery' && !selectedAddressId) {
      showToast(tcart('addressRequired'), 'error');
      return;
    }
    if (needsPrescription && !prescriptionFile) {
      showToast(tcart('prescriptionRequired'), 'error');
      return;
    }

    if (prescriptionFile) {
      const maxSize = 5 * 1024 * 1024;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (prescriptionFile.size > maxSize) {
        showToast(tcart('fileTooLarge'), 'error');
        return;
      }
      if (!allowedTypes.includes(prescriptionFile.type)) {
        showToast(tcart('invalidFileType'), 'error');
        return;
      }
    }

    setUploading(true);
    try {
      const prescription = prescriptionFile ? await createPrescriptionRecord() : null;
      const orderNumber = `MS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        order_number: orderNumber,
        user_id: user.id,
        pharmacy_id: cart.pharmacy_id,
        address_id: orderType === 'delivery' ? selectedAddressId || undefined : undefined,
        prescription_id: prescription?.id,
        order_type: orderType,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: total,
        notes: needsPrescription ? tcart('regulatedMedicines') : undefined,
      };

      const orderItems: Omit<OrderItem, 'id' | 'created_at'>[] = cartItems.map((item) => ({
        medicine_id: item.medicine_id,
        medicine_name: item.medicine?.brand_name || 'Medicine',
        dosage_form: item.medicine?.dosage_form,
        strength: item.medicine?.strength,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      await placeOrder(orderData, orderItems);
      await supabase.from('cart_items').delete().eq('cart_id', cart.id);
      showToast(tcart('orderSuccess'), 'success');
      setCartItems([]);
      setPrescriptionFile(null);
      setOrderPlaced(true);
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err.message || tcart('checkoutError'), 'error');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center" dir={direction}>
        <ShoppingCart className="mx-auto text-gray-200 mb-6" size={64} />
        <h2 className="text-2xl font-heading font-bold mb-4 text-[#1f2f31]">{tcart('signInTitle')}</h2>
        <p className="text-[#363f40] mb-8 text-lg">{tcart('signInMessage')}</p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all focus:outline-none focus:ring-2 focus:ring-[#099aa7] focus:ring-offset-2"
        >
          <span>{tcart('signInTitle')}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-32 text-center" dir={direction}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-4xl font-heading font-bold mb-4 text-[#1f2f31]">{tcart('orderSuccess')}</h2>
          <p className="text-[#363f40] mb-10 max-w-md mx-auto">
            {language === 'ar'
              ? 'تم إرسال طلبك إلى الصيدلية للمراجعة، وستصلك إشعارات عند تحديث الحالة.'
              : 'Your order has been sent to the pharmacy for review. You will receive updates as the status changes.'}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={() => navigate('/medicines')} className="px-8 py-3 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] shadow-lg shadow-[#099aa7]/20 transition-all">
              {tcart('continueShopping')}
            </button>
            <button onClick={() => navigate('/orders')} className="px-8 py-3 bg-gray-100 text-[#099aa7] font-bold rounded-xl hover:bg-[#099aa7]/10 transition-all">
              {torders('title')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center" dir={direction}>
        <div className="w-12 h-12 border-4 border-[#099aa7] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="container mx-auto px-4 py-32 text-center" dir={direction}>
        <ShoppingCart className="mx-auto text-gray-200 mb-6" size={64} />
        <h2 className="text-2xl font-heading font-bold mb-4 text-[#1f2f31]">{tcart('emptyTitle')}</h2>
        <p className="text-[#363f40] mb-8 text-lg">{tcart('emptyMessage')}</p>
        <Link to="/medicines" className="inline-flex items-center gap-2 px-8 py-4 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all">
          <span>{tcart('continueShopping')}</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-12 lg:py-24" dir={direction}>
      <div className="container mx-auto px-4">
        <div className="mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-4 block">{tcart('eyebrow')}</span>
          <h1 className="text-5xl font-heading font-bold tracking-tight text-[#1f2f31]">{tcart('title')}</h1>
          {pharmacyName && (
            <p className="text-slate-600 mt-2 flex items-center gap-2">
              <Store size={16} />
              <span>{tcart('selectedPharmacy')}: <strong>{pharmacyName}</strong></span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white p-8 rounded-[32px] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-8 w-full">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-[#099aa7] group-hover:bg-[#099aa7] group-hover:text-white transition-colors duration-500">
                    <Package size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1f2f31] mb-1 tracking-tight">{language === 'ar' && item.medicine?.brand_name_ar ? item.medicine.brand_name_ar : item.medicine?.brand_name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">{language === 'ar' && item.medicine?.generic_name_ar ? item.medicine.generic_name_ar : item.medicine?.generic_name}</p>
                    {item.medicine?.requires_prescription && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider border border-orange-100">
                        <FileText size={10} className="mr-1.5" />
                        {tcart('regulatedMedicines')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-6 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50">
                  <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100 shadow-inner">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-2 text-gray-400 hover:text-[#099aa7] transition-colors"><Minus size={16} /></button>
                    <span className="w-10 text-center font-bold text-[#363f40]">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-2 text-gray-400 hover:text-[#099aa7] transition-colors"><Plus size={16} /></button>
                  </div>
                  <div className="text-2xl font-heading font-bold text-[#1f2f31] tracking-tighter whitespace-nowrap">{formatCurrency(item.unit_price * item.quantity, language)}</div>
                  <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={24} /></button>
                </div>
              </div>
            ))}

            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-[#1f2f31] mb-6 tracking-tight">{tcart('orderType')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setOrderType('delivery')} className={`p-6 rounded-2xl border-2 transition-all ${orderType === 'delivery' ? 'border-[#099aa7] bg-[#099aa7]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <Home className={`mx-auto mb-3 ${orderType === 'delivery' ? 'text-[#099aa7]' : 'text-slate-400'}`} size={32} />
                  <p className="font-bold text-[#1f2f31] text-center">{tcart('delivery')}</p>
                  <p className="text-xs text-slate-500 text-center mt-1">{deliveryFee > 0 ? formatCurrency(deliveryFee, language) : tcart('free')}</p>
                </button>
                <button onClick={() => setOrderType('pickup')} className={`p-6 rounded-2xl border-2 transition-all ${orderType === 'pickup' ? 'border-[#099aa7] bg-[#099aa7]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <Store className={`mx-auto mb-3 ${orderType === 'pickup' ? 'text-[#099aa7]' : 'text-slate-400'}`} size={32} />
                  <p className="font-bold text-[#1f2f31] text-center">{tcart('pickup')}</p>
                  <p className="text-xs text-slate-500 text-center mt-1">{tcart('free')}</p>
                </button>
              </div>
            </div>

            {orderType === 'delivery' && (
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                  <h3 className="text-xl font-bold text-[#1f2f31] tracking-tight">{tcart('selectAddress')}</h3>
                  <Link to="/addresses" className="text-sm font-bold text-[#099aa7] hover:underline">{tcart('addAddress')}</Link>
                </div>
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <button key={address.id} onClick={() => setSelectedAddressId(address.id)} className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedAddressId === address.id ? 'border-[#099aa7] bg-[#099aa7]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-start gap-3">
                          <MapPin className={`mt-1 flex-shrink-0 ${selectedAddressId === address.id ? 'text-[#099aa7]' : 'text-slate-400'}`} size={20} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-bold text-[#1f2f31]">{address.title}</p>
                              {address.is_default && <span className="text-[9px] font-bold uppercase tracking-widest text-[#099aa7] bg-[#099aa7]/10 px-2 py-0.5 rounded">{tcommon('setDefault')}</span>}
                            </div>
                            <p className="text-sm text-slate-600">{address.street}{address.building_no && `, ${address.building_no}`}</p>
                            <p className="text-sm text-slate-600">{address.district}, {address.city}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl">
                    <MapPin className="mx-auto text-slate-300 mb-3" size={40} />
                    <p className="text-slate-600 font-medium mb-4">{tcart('selectAddress')}</p>
                    <Link to="/addresses" className="inline-flex items-center gap-2 px-6 py-3 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all">
                      <Plus size={18} /> {tcart('addAddress')}
                    </Link>
                  </div>
                )}
                {!selectedAddressId && addresses.length > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                    <FileText className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-orange-800">{tcart('addressRequired')}</p>
                  </div>
                )}
              </div>
            )}

            {needsPrescription && (
              <div className="bg-orange-50/30 border-2 border-dashed border-orange-100 p-10 rounded-[40px] relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-orange-400 shadow-xl shadow-orange-900/5">
                    <FileText size={32} />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-orange-900 mb-2 tracking-tight">{tcart('uploadPrescription')}</h3>
                    <p className="text-sm text-orange-800/70 mb-8 leading-relaxed max-w-lg">{tcart('prescriptionHint')}</p>
                    <div className="relative group">
                      <input type="file" id="prescription-upload" className="hidden" accept="image/*,.pdf" onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)} />
                      <label htmlFor="prescription-upload" className="flex flex-col items-center justify-center w-full py-14 bg-white/40 border-2 border-dashed border-orange-200 rounded-[32px] cursor-pointer hover:bg-white hover:border-[#099aa7]/40 transition-all shadow-sm active:scale-[0.98]">
                        {prescriptionFile ? (
                          <div className="flex flex-col items-center gap-2 text-[#099aa7] font-bold">
                            <CheckCircle size={32} className="mb-2" />
                            <span className="text-xs uppercase tracking-widest">{prescriptionFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-orange-200 group-hover:text-[#099aa7] transition-colors mb-4" size={40} />
                            <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#099aa7] transition-colors uppercase tracking-[0.22em]">{tcart('uploadPrescription')}</span>
                            <span className="text-[9px] text-slate-400 mt-2 uppercase tracking-widest font-bold opacity-60">5 MB • JPG • PNG • PDF</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl" />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-gray-200/50 sticky top-32 border border-gray-100">
              <h3 className="text-2xl font-bold mb-8 tracking-tight text-[#1f2f31]">{tcart('cartSummary')}</h3>
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  {orderType === 'delivery' ? <Home className="text-[#099aa7]" size={20} /> : <Store className="text-[#099aa7]" size={20} />}
                  <span className="font-bold text-[#1f2f31]">{orderType === 'delivery' ? tcart('delivery') : tcart('pickup')}</span>
                </div>
                {orderType === 'delivery' && selectedAddress && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{tcart('deliveryDetails')}</p>
                    <p className="text-sm font-bold text-[#1f2f31]">{selectedAddress.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{selectedAddress.street}, {selectedAddress.district}</p>
                  </div>
                )}
              </div>

              <div className="space-y-5 mb-10">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400"><span>{tcart('subtotal')}</span><span className="text-[#363f40]">{formatCurrency(subtotal, language)}</span></div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400"><span>{tcart('deliveryFee')}</span><span className="text-[#363f40]">{deliveryFee === 0 ? copy.free : formatCurrency(deliveryFee, language)}</span></div>
                <div className="pt-6 border-t border-gray-50 flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#099aa7] mb-1">{tcart('total')}</div>
                    <div className="text-4xl font-heading font-bold tracking-tighter text-[#1f2f31]">{formatCurrency(total, language)}</div>
                  </div>
                </div>
              </div>

              <button onClick={handleCheckout} disabled={uploading || !cartItems.length || (orderType === 'delivery' && !selectedAddressId)} className="w-full py-5 bg-[#099aa7] text-white font-bold rounded-2xl shadow-xl shadow-[#099aa7]/20 hover:bg-[#088a96] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? <span>{tcart('processing')}</span> : <><span>{tcart('placeOrder')}</span><ArrowRight size={18} /></>}
              </button>

              {(orderType === 'delivery' && !selectedAddressId && addresses.length > 0) && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl"><p className="text-xs text-orange-800 text-center font-medium">{tcart('addressRequired')}</p></div>
              )}

              <div className="mt-8 flex items-center justify-center gap-6 text-[9px] uppercase font-bold text-gray-300 tracking-widest">
                <div className="flex items-center gap-2"><Shield size={14} /><span>{tcart('secure')}</span></div>
                <div className="w-1 h-1 bg-gray-100 rounded-full" />
                <div className="flex items-center gap-2"><Clock size={14} /><span>{tcart('fast')}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
