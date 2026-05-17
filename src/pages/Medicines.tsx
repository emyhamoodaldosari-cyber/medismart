import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowUpDown, Filter, Heart, MapPin, MessageSquare, Search, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { InventoryItem } from '../types';
import { handleSupabaseError, OperationType } from '../utils/error-handler';
import { searchMedicines } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/localization';
import { getMedicineImageSrc } from '../utils/medicineImage';

interface MedicineCardProps {
  key?: React.Key;
  item: InventoryItem;
  onSave: (medicineId: string) => void | Promise<void>;
  language: 'en' | 'ar';
}

const MedicineCard = ({ item, onSave, language }: MedicineCardProps) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const tc = (key: string) => t(`customer.medicines.${key}`);

  useEffect(() => {
    if (user) void checkIfSaved();
  }, [user, item.medicine?.id]);

  const checkIfSaved = async () => {
    try {
      const { data } = await supabase
        .from('saved_medicines')
        .select('id')
        .eq('user_id', user?.id)
        .eq('medicine_id', item.medicine?.id)
        .single();
      setIsSaved(!!data);
    } catch {
      setIsSaved(false);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    void onSave(item.medicine?.id || '');
    setIsSaved((prev) => !prev);
  };

  const getStockStatus = () => {
    if (item.quantity === 0) return { label: tc('stock.out'), color: 'bg-red-50 text-red-600' };
    if (item.quantity <= 10) return { label: `${tc('stock.limited')}: ${item.quantity}`, color: 'bg-yellow-50 text-yellow-600' };
    return { label: tc('stock.in'), color: 'bg-green-50 text-green-600' };
  };

  const stockStatus = getStockStatus();
  const brandName = language === 'ar' && item.medicine?.brand_name_ar ? item.medicine.brand_name_ar : item.medicine?.brand_name;
  const genericName = language === 'ar' && item.medicine?.generic_name_ar ? item.medicine.generic_name_ar : item.medicine?.generic_name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => navigate(`/medicines/${item.medicine?.id}`)}
      className="relative bg-white rounded-2xl border border-slate-200 p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={handleSave}
          className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSaved ? 'bg-red-50 text-red-500 focus:ring-red-500' : 'bg-slate-50 text-slate-400 hover:text-red-500 focus:ring-red-500'}`}
        >
          <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img 
            src={getMedicineImageSrc(item.medicine, brandName)} 
            alt={brandName} 
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" 
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const placeholder = getMedicineImageSrc(null, brandName);
              if (target.src !== placeholder) {
                console.warn('Failed to load medicine image, using placeholder:', target.src);
                target.src = placeholder;
              }
            }}
          />
        </div>
        <div className="px-5 py-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#099aa7] mb-2 block">{item.medicine?.dosage_form || tc('dosageFallback')}</span>
          <h3 className="text-xl font-bold text-[#1f2f31] mb-1 group-hover:text-[#099aa7] transition-colors">{brandName}</h3>
          <p className="text-xs text-slate-500 font-medium">{genericName}</p>
        </div>
      </div>

      <div className="mb-4 px-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-slate-500">{tc('startingFrom')}</span>
          <span className="text-lg font-bold text-[#099aa7]">{formatCurrency(item.price, language)}</span>
        </div>
      </div>

      <div className="flex-grow space-y-4 mb-6">
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-4">
          <div className={`text-xs font-semibold px-3 py-1 rounded-lg ${stockStatus.color}`}>{stockStatus.label}</div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-center">
        <button onClick={(e) => { e.stopPropagation(); navigate(`/medicines/${item.medicine?.id}`); }} className="w-1/2 flex items-center justify-center gap-2 py-2 px-3 bg-[#099aa7] text-white rounded-lg hover:bg-[#088a96] transition-all text-xs font-semibold">
          <ShoppingCart size={14} />
          <span>{tc('view')}</span>
        </button>
      </div>
    </motion.div>
  );
};

const Medicines = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, direction, t } = useLanguage();
  const tc = (key: string) => t(`customer.medicines.${key}`);

  useEffect(() => {
    void fetchInventory();
  }, [searchParams]);

  useRealtimeSubscription(
    'medicines-inventory-updates',
    [
      { table: 'pharmacy_inventory', event: 'UPDATE', callback: (payload) => setItems((prev) => prev.map((item) => item.id === payload.new.id ? { ...item, ...payload.new } : item)) },
      { table: 'pharmacy_inventory', event: 'INSERT', callback: () => void fetchInventory() },
      { table: 'pharmacy_inventory', event: 'DELETE', callback: (payload) => setItems((prev) => prev.filter((item) => item.id !== payload.old.id)) },
    ],
    true,
  );

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await searchMedicines(searchQuery);
      setItems(data);
    } catch (error) {
      handleSupabaseError(error, OperationType.LIST, 'pharmacy_inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMedicine = async (medicineId: string) => {
    if (!user) {
      showToast(tc('loginRequired'), 'error');
      return;
    }
    try {
      const { data: existing } = await supabase.from('saved_medicines').select('id').eq('user_id', user.id).eq('medicine_id', medicineId).single();
      if (existing) {
        await supabase.from('saved_medicines').delete().eq('user_id', user.id).eq('medicine_id', medicineId);
        showToast(tc('removed'), 'success');
      } else {
        await supabase.from('saved_medicines').insert([{ user_id: user.id, medicine_id: medicineId }]);
        showToast(tc('saved'), 'success');
      }
    } catch (error: any) {
      showToast(error.message || tc('operationFailed'), 'error');
    }
  };

  // Group items by medicine_id to avoid duplicates, keeping the lowest price
  const uniqueMedicines = useMemo(() => {
    const medicineMap = new Map<string, InventoryItem>();
    items.forEach((item) => {
      const medId = item.medicine?.id;
      if (!medId) return;
      const existing = medicineMap.get(medId);
      if (!existing || item.price < existing.price) {
        medicineMap.set(medId, item);
      }
    });
    return Array.from(medicineMap.values());
  }, [items]);

  const filteredItems = useMemo(() => uniqueMedicines.filter((item) => {
    const query = searchQuery.toLowerCase();
    const arabicQuery = searchQuery;
    
    const queryMatch = 
      item.medicine?.brand_name.toLowerCase().includes(query) ||
      item.medicine?.generic_name.toLowerCase().includes(query) ||
      item.medicine?.description?.toLowerCase().includes(query) ||
      item.medicine?.manufacturer?.toLowerCase().includes(query) ||
      item.medicine?.dosage_form?.toLowerCase().includes(query) ||
      item.medicine?.strength?.toLowerCase().includes(query) ||
      item.medicine?.usage_instructions?.toLowerCase().includes(query) ||
      item.medicine?.warnings?.toLowerCase().includes(query) ||
      (item.medicine?.brand_name_ar && item.medicine.brand_name_ar.includes(arabicQuery)) ||
      (item.medicine?.generic_name_ar && item.medicine.generic_name_ar.includes(arabicQuery)) ||
      (item.medicine?.description_ar && item.medicine.description_ar.includes(arabicQuery));
    
    if (filterType === 'all') return queryMatch;
    return queryMatch && item.medicine?.dosage_form?.toLowerCase() === filterType.toLowerCase();
  }), [uniqueMedicines, searchQuery, filterType]);

  const sortedItems = useMemo(() => [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'name-az': return (a.medicine?.brand_name || '').localeCompare(b.medicine?.brand_name || '');
      case 'name-za': return (b.medicine?.brand_name || '').localeCompare(a.medicine?.brand_name || '');
      default: return 0;
    }
  }), [filteredItems, sortBy]);

  const dosageOptions = [
    { value: 'all', label: tc('dosageOptions.all') },
    { value: 'Tablet', label: tc('dosageOptions.tablet') },
    { value: 'Syrup', label: tc('dosageOptions.syrup') },
    { value: 'Injection', label: tc('dosageOptions.injection') },
    { value: 'Capsule', label: tc('dosageOptions.capsule') },
    { value: 'Cream', label: tc('dosageOptions.cream') },
    { value: 'Drops', label: tc('dosageOptions.drops') },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-20" dir={direction}>
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#099aa7] mb-3 block">{tc('eyebrow')}</span>
          <h1 className="text-4xl lg:text-5xl font-bold mb-8 text-[#1f2f31]">{tc('title')}</h1>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow group">
              <input type="text" placeholder={tc('searchPlaceholder')} className="w-full h-12 pl-12 pr-4 bg-white rounded-lg border border-slate-200 shadow-sm focus:ring-2 focus:ring-[#099aa7] focus:border-transparent transition-all text-base outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#099aa7] transition-colors" size={20} />
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="relative group">
                <select className="h-12 pl-12 pr-4 bg-white rounded-lg border border-slate-200 shadow-sm focus:ring-2 focus:ring-[#099aa7] focus:border-transparent transition-all appearance-none font-medium text-sm text-[#363f40] outline-none cursor-pointer min-w-[160px]" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  {dosageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#099aa7] transition-colors pointer-events-none" size={20} />
              </div>
              <div className="relative group">
                <select className="h-12 pl-12 pr-4 bg-white rounded-lg border border-slate-200 shadow-sm focus:ring-2 focus:ring-[#099aa7] focus:border-transparent transition-all appearance-none font-medium text-sm text-[#363f40] outline-none cursor-pointer min-w-[180px]" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="relevance">{tc('sort.relevance')}</option>
                  <option value="price-low">{tc('sort.priceLow')}</option>
                  <option value="price-high">{tc('sort.priceHigh')}</option>
                  <option value="name-az">{tc('sort.nameAz')}</option>
                  <option value="name-za">{tc('sort.nameZa')}</option>
                </select>
                <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#099aa7] transition-colors pointer-events-none" size={20} />
              </div>
            </div>
          </div>
        </div>

        {!loading && sortedItems.length > 0 && <div className="mb-6"><p className="text-sm text-slate-600"><span className="font-bold text-[#1f2f31]">{sortedItems.length}</span> {tc('results')}</p></div>}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-slate-200" />)}</div>
        ) : sortedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{sortedItems.map((item) => <MedicineCard key={item.id} item={item} onSave={handleSaveMedicine} language={language} />)}</div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-[#1f2f31] mb-2">{tc('noResultsTitle')}</h3>
            <p className="text-slate-600 mb-6">{tc('noResultsMessage')}</p>
            <button onClick={() => { setSearchQuery(''); setFilterType('all'); }} className="px-6 py-2 text-[#099aa7] font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-[#099aa7] rounded-lg">
              {tc('clearFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicines;
