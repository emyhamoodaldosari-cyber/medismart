import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, MapPin, Loader, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserAddress } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const AddressManagement = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { direction, t } = useLanguage();
  const ta = (key: string) => t(`customer.addresses.${key}`);
  const tc = (key: string) => t(`customer.common.${key}`);

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    district: '',
    street: '',
    building_no: '',
    is_default: false,
  });

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses((data as UserAddress[]) || []);
    } catch (error: any) {
      showToast(error.message || ta('loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', city: '', district: '', street: '', building_no: '', is_default: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.city || !formData.district || !formData.street) {
      showToast(ta('requiredError'), 'error');
      return;
    }

    try {
      if (formData.is_default) {
        await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user?.id);
      }

      if (editingId) {
        const { error } = await supabase
          .from('user_addresses')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
        showToast(ta('updated'), 'success');
      } else {
        const { error } = await supabase.from('user_addresses').insert([
          {
            user_id: user?.id,
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        if (error) throw error;
        showToast(ta('created'), 'success');
      }

      resetForm();
      fetchAddresses();
    } catch (error: any) {
      showToast(error.message || ta('saveError'), 'error');
    }
  };

  const handleEdit = (address: UserAddress) => {
    setFormData({
      title: address.title,
      city: address.city,
      district: address.district,
      street: address.street,
      building_no: address.building_no || '',
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm(`${copy.deletePrompt}\n${copy.deleteMessage}`)) return;
    try {
      const { error } = await supabase.from('user_addresses').delete().eq('id', addressId);
      if (error) throw error;
      showToast(ta('deleted'), 'success');
      fetchAddresses();
    } catch (error: any) {
      showToast(error.message || ta('deleteError'), 'error');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user?.id);
      await supabase.from('user_addresses').update({ is_default: true }).eq('id', addressId);
      showToast(ta('defaultUpdated'), 'success');
      fetchAddresses();
    } catch (error: any) {
      showToast(error.message || ta('defaultError'), 'error');
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
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-12 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-4 block">{ta('eyebrow')}</span>
            <h1 className="text-5xl font-heading font-bold text-[#1f2f31] mb-2">{ta('title')}</h1>
            <p className="text-slate-600 font-medium">
              {addresses.length} {addresses.length === 1 ? ta('subtitleOne') : ta('subtitleMany')}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all flex items-center gap-2"
            >
              <Plus size={20} /> {ta('addAddress')}
            </button>
          )}
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-[#1f2f31] mb-6">{editingId ? ta('editAddress') : ta('addNew')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#1f2f31] mb-2">{ta('label')} *</label>
                  <input type="text" placeholder={t('customer.addresses.placeholders.title')} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#099aa7] focus:ring-4 focus:ring-[#099aa7]/10 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2f31] mb-2">{ta('city')} *</label>
                  <input type="text" placeholder={t('customer.addresses.placeholders.city')} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#099aa7] focus:ring-4 focus:ring-[#099aa7]/10 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2f31] mb-2">{ta('district')} *</label>
                  <input type="text" placeholder={t('customer.addresses.placeholders.district')} value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#099aa7] focus:ring-4 focus:ring-[#099aa7]/10 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1f2f31] mb-2">{ta('street')} *</label>
                  <input type="text" placeholder={t('customer.addresses.placeholders.street')} value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#099aa7] focus:ring-4 focus:ring-[#099aa7]/10 outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#1f2f31] mb-2">{ta('buildingOptional')}</label>
                  <input type="text" placeholder={t('customer.addresses.placeholders.building')} value={formData.building_no} onChange={(e) => setFormData({ ...formData, building_no: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#099aa7] focus:ring-4 focus:ring-[#099aa7]/10 outline-none transition-all" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <input type="checkbox" id="default" checked={formData.is_default} onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-[#099aa7] cursor-pointer" />
                <label htmlFor="default" className="font-medium text-[#1f2f31] cursor-pointer">{ta('defaultToggle')}</label>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-3 bg-[#099aa7] text-white font-bold rounded-xl hover:bg-[#088a96] transition-all">
                  {editingId ? ta('editAddress') : ta('addAddress')}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 py-3 bg-slate-100 text-[#1f2f31] font-bold rounded-xl hover:bg-slate-200 transition-all">
                  {tc('cancel')}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {addresses.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-16 border border-dashed border-slate-200 text-center">
            <MapPin className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-2xl font-bold text-[#1f2f31] mb-2">{ta('emptyTitle')}</h3>
            <p className="text-slate-600 mb-8">{ta('emptyMessage')}</p>
            <button onClick={() => setShowForm(true)} className="px-8 py-4 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] transition-all inline-flex items-center gap-2">
              <Plus size={20} /> {ta('addAddress')}
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address, idx) => (
              <motion.div key={address.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`bg-white rounded-2xl border-2 p-6 transition-all ${address.is_default ? 'border-[#099aa7] bg-[#099aa7]/5' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="text-[#099aa7]" size={20} />
                    <div>
                      <h3 className="font-bold text-[#1f2f31] text-lg">{address.title}</h3>
                      {address.is_default && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#099aa7] flex items-center gap-1 mt-1">
                          <Check size={12} /> {ta('defaultLabel')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-6 pb-6 border-b border-slate-100">
                  <p className="text-slate-600"><span className="font-bold text-[#1f2f31]">{address.street}</span>{address.building_no && `, ${ta('building')} ${address.building_no}`}</p>
                  <p className="text-slate-600">{address.district}, {address.city}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => handleEdit(address)} className="flex-1 py-2 px-4 bg-slate-50 text-[#1f2f31] font-bold rounded-lg hover:bg-slate-100 transition-all text-sm flex items-center justify-center gap-2">
                    <Edit size={16} /> {tc('edit')}
                  </button>
                  {!address.is_default && (
                    <button onClick={() => handleSetDefault(address.id)} className="flex-1 py-2 px-4 bg-[#099aa7]/10 text-[#099aa7] font-bold rounded-lg hover:bg-[#099aa7]/20 transition-all text-sm">
                      {ta('setDefault')}
                    </button>
                  )}
                  <button onClick={() => handleDelete(address.id)} className="py-2 px-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressManagement;
