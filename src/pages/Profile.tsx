import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Mail, Phone, LogOut, Edit3, Save, X, UserRound, MapPin, Plus, Trash2, Home as HomeIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { UserAddress } from '../types';

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { direction, t } = useLanguage();
  const tp = (key: string) => t(`customer.profile.${key}`);
  const tc = (key: string) => t(`customer.common.${key}`);

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: '',
    city: '',
    district: '',
    street: '',
    building_number: '',
    floor: '',
    apartment: '',
    additional_info: '',
    is_default: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({ full_name: profile.full_name || '', phone: profile.phone || '' });
    }
  }, [profile]);

  useEffect(() => {
    if (user && profile?.role === 'customer') {
      fetchAddresses();
    }
  }, [user, profile]);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch (err: any) {
      console.error('Error fetching addresses:', err);
    }
  };

  const roleLabel = useMemo(() => {
    if (!profile) return '';
    return tp(`roleLabels.${profile.role}`);
  }, [profile, tp]);

  const initials = useMemo(() => {
    if (!profile?.full_name) return 'MS';
    return profile.full_name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [profile?.full_name]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      showToast(tp('signedOut'), 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.message || tp('signOutError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    if (!formData.full_name.trim()) {
      showToast(tp('fullName'), 'error');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setEditing(false);
      showToast(tp('profileUpdated'), 'success');
    } catch (err: any) {
      showToast(err.message || tp('updateError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    if (!addressForm.title || !addressForm.city || !addressForm.street) {
      showToast(tp('addressRequired'), 'error');
      return;
    }

    try {
      setLoading(true);
      if (addressForm.is_default) {
        await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id);
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('user_addresses')
          .update({ ...addressForm, updated_at: new Date().toISOString() })
          .eq('id', editingAddress.id);
        if (error) throw error;
        showToast(tp('addressUpdated'), 'success');
      } else {
        const { error } = await supabase
          .from('user_addresses')
          .insert([{ ...addressForm, user_id: user.id }]);
        if (error) throw error;
        showToast(tp('addressAdded'), 'success');
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        title: '',
        city: '',
        district: '',
        street: '',
        building_number: '',
        floor: '',
        apartment: '',
        additional_info: '',
        is_default: false,
      });
      fetchAddresses();
    } catch (err: any) {
      showToast(err.message || tp('addressError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm(tp('confirmDeleteAddress'))) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('user_addresses').delete().eq('id', id);
      if (error) throw error;
      showToast(tp('addressDeleted'), 'success');
      fetchAddresses();
    } catch (err: any) {
      showToast(err.message || tp('deleteError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setAddressForm({
      title: address.title,
      city: address.city,
      district: address.district,
      street: address.street,
      building_number: address.building_number || '',
      floor: address.floor || '',
      apartment: address.apartment || '',
      additional_info: address.additional_info || '',
      is_default: address.is_default,
    });
    setShowAddressForm(true);
  };

  if (!user || !profile) {
    return (
      <div className="p-20 text-center">
        <p className="text-gray-500">{tp('loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-12 lg:py-24" dir={direction}>
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-4 block">{tp('eyebrow')}</span>
            <h1 className="text-5xl font-heading font-bold tracking-tight text-[#1f2f31]">
              {tp('title')}<span className="text-[#099aa7]">.</span>
            </h1>
            <p className="text-[#363f40] font-medium mt-3 max-w-2xl">{tp('subtitle')}</p>
          </div>
          <button
            onClick={() => setEditing((prev) => !prev)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-[#1f2f31] font-bold hover:border-[#099aa7]/30 hover:text-[#099aa7] transition-all"
          >
            {editing ? <X size={16} /> : <Edit3 size={16} />}
            <span>{editing ? tc('cancel') : tp('editProfile')}</span>
          </button>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-sm shadow-[#1f2f31]/5"
          >
            <div className={`flex flex-col md:flex-row md:items-center gap-8 ${direction === 'rtl' ? 'md:flex-row-reverse' : ''}`}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#099aa7] to-[#077a85] flex items-center justify-center text-white text-3xl font-bold uppercase border-4 border-white shadow-lg">
                {initials}
              </div>
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{tp('fullName')}</label>
                      <input
                        value={formData.full_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{tp('phone')}</label>
                      <input
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#099aa7] text-white font-bold hover:bg-[#088a96] transition-all disabled:opacity-60"
                      >
                        <Save size={16} />
                        <span>{loading ? tc('loading') : tp('saveChanges')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setFormData({ full_name: profile.full_name || '', phone: profile.phone || '' });
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-[#1f2f31] font-bold hover:bg-slate-200 transition-all"
                      >
                        <X size={16} />
                        <span>{tc('cancel')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-[#1f2f31] tracking-tight">{profile.full_name}</h2>
                    <div className={`flex flex-wrap items-center gap-3 mt-3 ${direction === 'rtl' ? 'md:justify-start' : ''}`}>
                      <span className="px-4 py-2 rounded-full bg-[#099aa7]/10 text-[#099aa7] text-[10px] font-bold uppercase tracking-widest border border-[#099aa7]/20">
                        {roleLabel}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {tp('userId')}: {user.id.slice(0, 8)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm shadow-[#1f2f31]/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#099aa7]">
                  <Mail size={22} />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{tp('email')}</div>
                  <div className="font-bold text-[#1f2f31] break-all">{profile.email}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm shadow-[#1f2f31]/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#099aa7]">
                  <Phone size={22} />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{tp('phone')}</div>
                  <div className="font-bold text-[#1f2f31]">{profile.phone || tc('notProvided')}</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-sm shadow-[#1f2f31]/5"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3 tracking-tight text-[#1f2f31]">
                <UserRound className="text-[#099aa7]" size={24} />
                {tp('roleTitle')}
              </h3>
            </div>
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#099aa7] text-white text-sm font-bold uppercase tracking-widest">
                <UserRound size={14} />
                {roleLabel}
              </div>
            </div>
          </motion.div>

          {profile.role === 'customer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-sm shadow-[#1f2f31]/5"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3 tracking-tight text-[#1f2f31]">
                  <MapPin className="text-[#099aa7]" size={24} />
                  {tp('addresses')}
                </h3>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({
                      title: '',
                      city: '',
                      district: '',
                      street: '',
                      building_number: '',
                      floor: '',
                      apartment: '',
                      additional_info: '',
                      is_default: false,
                    });
                    setShowAddressForm(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#099aa7] text-white font-bold hover:bg-[#088a96] transition-all text-sm"
                >
                  <Plus size={16} />
                  {tp('addAddress')}
                </button>
              </div>

              {showAddressForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-3xl border border-gray-200">
                  <h4 className="font-bold text-lg mb-4 text-[#1f2f31]">
                    {editingAddress ? tp('editAddress') : tp('addNewAddress')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {tp('addressTitle')}
                      </label>
                      <input
                        value={addressForm.title}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder={tp('addressTitlePlaceholder')}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {tp('city')}
                      </label>
                      <input
                        value={addressForm.city}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {tp('district')}
                      </label>
                      <input
                        value={addressForm.district}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {tp('street')}
                      </label>
                      <input
                        value={addressForm.street}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {tp('buildingNumber')}
                      </label>
                      <input
                        value={addressForm.building_number}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, building_number: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {tp('floor')}
                      </label>
                      <input
                        value={addressForm.floor}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, floor: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {tp('apartment')}
                      </label>
                      <input
                        value={addressForm.apartment}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, apartment: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {tp('additionalInfo')}
                      </label>
                      <textarea
                        value={addressForm.additional_info}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, additional_info: e.target.value }))}
                        rows={2}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-[#099aa7]/10 focus:border-[#099aa7]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                          className="w-5 h-5 rounded border-slate-300 text-[#099aa7] focus:ring-[#099aa7]"
                        />
                        <span className="text-sm font-bold text-[#1f2f31]">{tp('setAsDefault')}</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSaveAddress}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#099aa7] text-white font-bold hover:bg-[#088a96] transition-all disabled:opacity-60"
                    >
                      <Save size={16} />
                      {loading ? tc('loading') : tp('saveAddress')}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-[#1f2f31] font-bold hover:bg-slate-200 transition-all"
                    >
                      <X size={16} />
                      {tc('cancel')}
                    </button>
                  </div>
                </div>
              )}

              {addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-6 bg-gray-50 rounded-3xl border border-gray-200 hover:border-[#099aa7]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <HomeIcon size={16} className="text-[#099aa7]" />
                            <h4 className="font-bold text-lg text-[#1f2f31]">{address.title}</h4>
                            {address.is_default && (
                              <span className="px-2 py-1 rounded-full bg-[#099aa7] text-white text-[9px] font-bold uppercase">
                                {tp('default')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.street}, {address.district}, {address.city}
                            {address.building_number && ` - ${tp('building')} ${address.building_number}`}
                            {address.floor && ` - ${tp('floor')} ${address.floor}`}
                            {address.apartment && ` - ${tp('apartment')} ${address.apartment}`}
                          </p>
                          {address.additional_info && (
                            <p className="text-xs text-gray-500 mt-2">{address.additional_info}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="p-2 rounded-xl bg-white border border-gray-200 text-[#099aa7] hover:bg-[#099aa7]/10 transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="p-2 rounded-xl bg-white border border-gray-200 text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <MapPin size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium">{tp('noAddresses')}</p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full md:w-[30%] py-6 text-[11px] font-bold uppercase tracking-widest text-white bg-[#099aa7] hover:bg-[#088a96] rounded-3xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <LogOut size={16} />
              <span>{loading ? tp('signingOut') : tp('signOut')}</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
