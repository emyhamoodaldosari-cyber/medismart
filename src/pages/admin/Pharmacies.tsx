import React, { useEffect, useState } from 'react';
import {
  Building2,
  DollarSign,
  Edit,
  ImagePlus,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Store,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import { pharmacyService } from '../../services/pharmacyService';
import { Pharmacy } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminPageHeader from '../../components/AdminPageHeader';
import EmptyState from '../../components/EmptyState';
import FormModal from '../../components/FormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';

interface PharmacyFormData {
  name: string;
  phone: string;
  whatsapp_contact: string;
  email: string;
  city: string;
  district: string;
  street: string;
  latitude: string;
  longitude: string;
  opening_time: string;
  closing_time: string;
  delivery_available: boolean;
  delivery_fee: string;
  is_active: boolean;
}

type DialogState =
  | { type: 'delete'; pharmacy: Pharmacy }
  | { type: 'toggle'; pharmacy: Pharmacy }
  | null;

const createInitialFormData = (): PharmacyFormData => ({
  name: '',
  phone: '',
  whatsapp_contact: '',
  email: '',
  city: '',
  district: '',
  street: '',
  latitude: '',
  longitude: '',
  opening_time: '',
  closing_time: '',
  delivery_available: true,
  delivery_fee: '0',
  is_active: true,
});

const AdminPharmacies = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [formData, setFormData] = useState<PharmacyFormData>(createInitialFormData());
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const copy = {
    title: t('screens.adminPharmacies.title'),
    subtitle: t('screens.adminPharmacies.subtitle'),
    searchPlaceholder: t('screens.adminPharmacies.searchPlaceholder'),
    summaryActive: t('screens.adminPharmacies.summaryActive'),
    summaryDelivery: t('screens.adminPharmacies.summaryDelivery'),
    summaryCities: t('screens.adminPharmacies.summaryCities'),
    addAction: t('screens.adminPharmacies.addAction'),
    editTitle: t('screens.adminPharmacies.editTitle'),
    addTitle: t('screens.adminPharmacies.addTitle'),
    formDescription: t('screens.adminPharmacies.formDescription'),
    tableName: t('screens.adminPharmacies.tableName'),
    tableLocation: t('screens.adminPharmacies.tableLocation'),
    tableContact: t('screens.adminPharmacies.tableContact'),
    tableHours: t('screens.adminPharmacies.tableHours'),
    tableDelivery: t('screens.adminPharmacies.tableDelivery'),
    tableStatus: t('screens.adminPharmacies.tableStatus'),
    tableActions: t('screens.adminPharmacies.tableActions'),
    deliveryEnabled: t('screens.adminPharmacies.deliveryEnabled'),
    deliveryDisabled: t('screens.adminPharmacies.deliveryDisabled'),
    logoLabel: t('screens.adminPharmacies.logoLabel'),
    logoHint: t('screens.adminPharmacies.logoHint'),
    removeLogo: t('screens.adminPharmacies.removeLogo'),
    noLogo: t('screens.adminPharmacies.noLogo'),
    fields: {
      name: t('screens.adminPharmacies.fields.name'),
      phone: t('screens.adminPharmacies.fields.phone'),
      whatsapp: t('screens.adminPharmacies.fields.whatsapp'),
      email: t('screens.adminPharmacies.fields.email'),
      city: t('screens.adminPharmacies.fields.city'),
      district: t('screens.adminPharmacies.fields.district'),
      street: t('screens.adminPharmacies.fields.street'),
      latitude: t('screens.adminPharmacies.fields.latitude'),
      longitude: t('screens.adminPharmacies.fields.longitude'),
      opening: t('screens.adminPharmacies.fields.opening'),
      closing: t('screens.adminPharmacies.fields.closing'),
      deliveryFee: t('screens.adminPharmacies.fields.deliveryFee'),
      deliveryAvailable: t('screens.adminPharmacies.fields.deliveryAvailable'),
      active: t('screens.adminPharmacies.fields.active'),
    },
    placeholders: {
      name: t('screens.adminPharmacies.placeholders.name'),
      phone: t('screens.adminPharmacies.placeholders.phone'),
      whatsapp: t('screens.adminPharmacies.placeholders.whatsapp'),
      email: t('screens.adminPharmacies.placeholders.email'),
      city: t('screens.adminPharmacies.placeholders.city'),
      district: t('screens.adminPharmacies.placeholders.district'),
      street: t('screens.adminPharmacies.placeholders.street'),
      latitude: t('screens.adminPharmacies.placeholders.latitude'),
      longitude: t('screens.adminPharmacies.placeholders.longitude'),
      deliveryFee: t('screens.adminPharmacies.placeholders.deliveryFee'),
    },
    requiredMessage: t('screens.adminPharmacies.requiredMessage'),
    loadError: t('screens.adminPharmacies.loadError'),
    saveError: t('screens.adminPharmacies.saveError'),
    createSuccess: t('screens.adminPharmacies.createSuccess'),
    updateSuccess: t('screens.adminPharmacies.updateSuccess'),
    deleteSuccess: t('screens.adminPharmacies.deleteSuccess'),
    toggleSuccessOn: t('screens.adminPharmacies.toggleSuccessOn'),
    toggleSuccessOff: t('screens.adminPharmacies.toggleSuccessOff'),
    emptyTitle: t('screens.adminPharmacies.emptyTitle'),
    emptyMessage: t('screens.adminPharmacies.emptyMessage'),
    confirmDeleteTitle: t('screens.adminPharmacies.confirmDeleteTitle'),
    confirmDeleteMessage: t('screens.adminPharmacies.confirmDeleteMessage'),
    confirmToggleOnTitle: t('screens.adminPharmacies.confirmToggleOnTitle'),
    confirmToggleOnMessage: t('screens.adminPharmacies.confirmToggleOnMessage'),
    confirmToggleOffTitle: t('screens.adminPharmacies.confirmToggleOffTitle'),
    confirmToggleOffMessage: t('screens.adminPharmacies.confirmToggleOffMessage'),
    editAction: t('screens.adminPharmacies.editAction'),
    deleteAction: t('screens.adminPharmacies.deleteAction'),
    deactivateAction: t('screens.adminPharmacies.deactivateAction'),
    activateAction: t('screens.adminPharmacies.activateAction'),
    sar: t('screens.adminPharmacies.currency'),
    uploadNew: t('screens.adminPharmacies.uploadNew'),
  };

  useEffect(() => {
    void loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      setLoading(true);
      const data = await pharmacyService.getAllPharmacies();
      setPharmacies(data);
    } catch (error: any) {
      showToast(error.message || copy.loadError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedPharmacy(null);
    setFormData(createInitialFormData());
    setLogoFile(null);
    setRemoveLogo(false);
    setShowFormModal(true);
  };

  const openEditModal = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setFormData({
      name: pharmacy.name,
      phone: pharmacy.phone || '',
      whatsapp_contact: pharmacy.whatsapp_contact || '',
      email: pharmacy.email || '',
      city: pharmacy.city,
      district: pharmacy.district || '',
      street: pharmacy.street || '',
      latitude: pharmacy.latitude?.toString() || '',
      longitude: pharmacy.longitude?.toString() || '',
      opening_time: pharmacy.opening_time || '',
      closing_time: pharmacy.closing_time || '',
      delivery_available: pharmacy.delivery_available,
      delivery_fee: pharmacy.delivery_fee?.toString() || '0',
      is_active: pharmacy.is_active,
    });
    setLogoFile(null);
    setRemoveLogo(false);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setShowFormModal(false);
    setSelectedPharmacy(null);
    setLogoFile(null);
    setRemoveLogo(false);
    setFormData(createInitialFormData());
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const uniqueCities = ['all', ...Array.from(new Set(pharmacies.map(p => p.city))).sort()];
  
  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    if (!normalizedSearch && filterStatus === 'all' && filterDelivery === 'all' && filterCity === 'all') return true;
    
    const matchesSearch = !normalizedSearch || [pharmacy.name, pharmacy.city, pharmacy.district || '', pharmacy.email || '']
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && pharmacy.is_active) ||
      (filterStatus === 'inactive' && !pharmacy.is_active);
    
    const matchesDelivery = filterDelivery === 'all' ||
      (filterDelivery === 'enabled' && pharmacy.delivery_available) ||
      (filterDelivery === 'disabled' && !pharmacy.delivery_available);
    
    const matchesCity = filterCity === 'all' || pharmacy.city === filterCity;
    
    return matchesSearch && matchesStatus && matchesDelivery && matchesCity;
  });

  const stats = {
    active: pharmacies.filter((p) => p.is_active).length,
    delivery: pharmacies.filter((p) => p.delivery_available).length,
    cities: new Set(pharmacies.map((p) => p.city)).size,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim() || !formData.street.trim() || formData.delivery_fee === '') {
      showToast(copy.requiredMessage, 'error');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      whatsapp_contact: formData.whatsapp_contact.trim() || undefined,
      email: formData.email.trim() || undefined,
      city: formData.city.trim(),
      district: formData.district.trim() || undefined,
      street: formData.street.trim(),
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      opening_time: formData.opening_time || undefined,
      closing_time: formData.closing_time || undefined,
      delivery_available: formData.delivery_available,
      delivery_fee: Number(formData.delivery_fee || 0),
      is_active: formData.is_active,
      logo_url: selectedPharmacy?.logo_url,
    };

    try {
      setSubmitting(true);
      if (selectedPharmacy) {
        await pharmacyService.updatePharmacy(selectedPharmacy.id, payload, logoFile || undefined, removeLogo);
        showToast(copy.updateSuccess, 'success');
      } else {
        await pharmacyService.createPharmacy(payload, logoFile || undefined);
        showToast(copy.createSuccess, 'success');
      }
      closeFormModal();
      await loadPharmacies();
    } catch (error: any) {
      showToast(error.message || copy.saveError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDialog = async () => {
    if (!dialogState) return;
    try {
      setDialogLoading(true);
      if (dialogState.type === 'delete') {
        await pharmacyService.deletePharmacy(dialogState.pharmacy.id);
        showToast(copy.deleteSuccess, 'success');
      } else {
        await pharmacyService.togglePharmacyStatus(dialogState.pharmacy.id, !dialogState.pharmacy.is_active);
        showToast(dialogState.pharmacy.is_active ? copy.toggleSuccessOff : copy.toggleSuccessOn, 'success');
      }
      setDialogState(null);
      await loadPharmacies();
    } catch (error: any) {
      showToast(error.message || copy.saveError, 'error');
    } finally {
      setDialogLoading(false);
    }
  };

  const renderFieldLabel = (label: string, required = false) => (
    <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <div className="container mx-auto max-w-7xl">
        <AdminPageHeader
          title={copy.title}
          subtitle={copy.subtitle}
          action={{
            label: copy.addAction,
            onClick: openCreateModal,
            icon: <Plus size={18} />,
          }}
          onRefresh={loadPharmacies}
          refreshing={loading}
        />

        <div className="grid gap-5 md:grid-cols-3 mb-8">
          {[
            { icon: <Store size={22} />, label: copy.summaryActive, value: stats.active },
            { icon: <Truck size={22} />, label: copy.summaryDelivery, value: stats.delivery },
            { icon: <MapPin size={22} />, label: copy.summaryCities, value: stats.cities },
          ].map((item) => (
            <div key={item.label} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#099aa7]/10 text-[#099aa7]">{item.icon}</div>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <h2 className="mt-2 text-3xl font-bold text-[#1f2f31]">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-4 rtl:right-4" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm outline-none transition focus:border-[#099aa7] focus:bg-white ltr:pl-11 ltr:pr-4 rtl:pr-11 rtl:pl-4"
              />
            </div>
            <div className="text-sm font-medium text-slate-500">
              {filteredPharmacies.length} / {pharmacies.length}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-[#099aa7] focus:bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            
            <select
              value={filterDelivery}
              onChange={(e) => setFilterDelivery(e.target.value as 'all' | 'enabled' | 'disabled')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-[#099aa7] focus:bg-white"
            >
              <option value="all">All Delivery</option>
              <option value="enabled">Delivery Enabled</option>
              <option value="disabled">No Delivery</option>
            </select>
            
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-[#099aa7] focus:bg-white"
            >
              {uniqueCities.map(city => (
                <option key={city} value={city}>
                  {city === 'all' ? 'All Cities' : city}
                </option>
              ))}
            </select>
            
            {(filterStatus !== 'all' || filterDelivery !== 'all' || filterCity !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterDelivery('all');
                  setFilterCity('all');
                  setSearchQuery('');
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {filteredPharmacies.length === 0 && !loading ? (
          <div className="rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <EmptyState icon={Building2} title={copy.emptyTitle} message={copy.emptyMessage} action={{ label: copy.addAction, onClick: openCreateModal }} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr className="text-start text-xs uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-6 py-4 font-semibold">{copy.tableName}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableLocation}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableContact}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableHours}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableDelivery}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableStatus}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPharmacies.map((pharmacy) => (
                    <tr key={pharmacy.id} className="align-top hover:bg-slate-50/50">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                            {pharmacy.logo_url ? (
                              <img src={pharmacy.logo_url} alt={pharmacy.name} className="h-full w-full object-cover" />
                            ) : (
                              <Store size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-[#1f2f31]">{pharmacy.name}</h3>
                            {pharmacy.email && <p className="text-sm text-slate-500">{pharmacy.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        <div className="space-y-1">
                          <p className="font-medium text-[#1f2f31]">{pharmacy.city}</p>
                          {pharmacy.district && <p>{pharmacy.district}</p>}
                          {pharmacy.street && <p>{pharmacy.street}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        <div className="space-y-2">
                          {pharmacy.phone && <div className="flex items-center gap-2"><Phone size={14} /> <span>{pharmacy.phone}</span></div>}
                          {pharmacy.whatsapp_contact && <div className="flex items-center gap-2"><Phone size={14} /> <span>{pharmacy.whatsapp_contact}</span></div>}
                          {pharmacy.email && <div className="flex items-center gap-2"><Mail size={14} /> <span>{pharmacy.email}</span></div>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {pharmacy.opening_time || pharmacy.closing_time
                          ? `${pharmacy.opening_time || '--:--'} - ${pharmacy.closing_time || '--:--'}`
                          : '—'}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        <div className="space-y-2">
                          <div className="font-semibold text-[#1f2f31]">
                            {pharmacy.delivery_available ? copy.deliveryEnabled : copy.deliveryDisabled}
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            <DollarSign size={12} /> {pharmacy.delivery_fee.toFixed(2)} {copy.sar}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><StatusBadge status={pharmacy.is_active ? 'active' : 'inactive'} type="active" /></td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => openEditModal(pharmacy)} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#099aa7]/30 hover:bg-[#099aa7]/5 hover:text-[#099aa7]" title={copy.editAction}><Edit size={18} /></button>
                          <button
                            onClick={() => setDialogState({ type: 'toggle', pharmacy })}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                            title={pharmacy.is_active ? copy.deactivateAction : copy.activateAction}
                          >
                            <Truck size={18} />
                          </button>
                          <button onClick={() => setDialogState({ type: 'delete', pharmacy })} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600" title={copy.deleteAction}><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <FormModal
          isOpen={showFormModal}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          title={selectedPharmacy ? copy.editTitle : copy.addTitle}
          loading={submitting}
          submitText={selectedPharmacy ? t('actions.update') : t('actions.add')}
          size="xl"
        >
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{copy.formDescription}</div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                {renderFieldLabel(copy.fields.name, true)}
                <input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder={copy.placeholders.name} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.email)}
                <input value={formData.email} type="email" onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} placeholder={copy.placeholders.email} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.phone)}
                <input value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} placeholder={copy.placeholders.phone} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.whatsapp)}
                <input value={formData.whatsapp_contact} onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp_contact: e.target.value }))} placeholder={copy.placeholders.whatsapp} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.city, true)}
                <input value={formData.city} onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))} placeholder={copy.placeholders.city} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.district)}
                <input value={formData.district} onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))} placeholder={copy.placeholders.district} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div className="md:col-span-2">
                {renderFieldLabel(copy.fields.street, true)}
                <input value={formData.street} onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))} placeholder={copy.placeholders.street} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.opening)}
                <input type="time" value={formData.opening_time} onChange={(e) => setFormData((prev) => ({ ...prev, opening_time: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.closing)}
                <input type="time" value={formData.closing_time} onChange={(e) => setFormData((prev) => ({ ...prev, closing_time: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.latitude)}
                <input value={formData.latitude} onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))} placeholder={copy.placeholders.latitude} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.longitude)}
                <input value={formData.longitude} onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))} placeholder={copy.placeholders.longitude} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.fields.deliveryFee, true)}
                <input type="number" min="0" step="0.01" value={formData.delivery_fee} onChange={(e) => setFormData((prev) => ({ ...prev, delivery_fee: e.target.value }))} placeholder={copy.placeholders.deliveryFee} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
              <div>
                {renderFieldLabel(copy.logoLabel)}
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition hover:border-[#099aa7]/40 hover:bg-white">
                  <span className="inline-flex items-center gap-2"><Upload size={16} /> {logoFile ? logoFile.name : copy.uploadNew}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </label>
                <p className="mt-2 text-xs text-slate-500">{copy.logoHint}</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="preview" className="h-full w-full object-cover" />
                    ) : selectedPharmacy?.logo_url && !removeLogo ? (
                      <img src={selectedPharmacy.logo_url} alt={selectedPharmacy.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus size={20} className="text-slate-400" />
                    )}
                  </div>
                  {selectedPharmacy?.logo_url && (
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={removeLogo} onChange={(e) => setRemoveLogo(e.target.checked)} />
                      {copy.removeLogo}
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
              <label className="flex items-center gap-3 text-sm font-semibold text-[#1f2f31]">
                <input type="checkbox" checked={formData.delivery_available} onChange={(e) => setFormData((prev) => ({ ...prev, delivery_available: e.target.checked }))} />
                {copy.fields.deliveryAvailable}
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-[#1f2f31]">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))} />
                {copy.fields.active}
              </label>
            </div>
          </div>
        </FormModal>

        <ConfirmDialog
          isOpen={dialogState !== null}
          onClose={() => setDialogState(null)}
          onConfirm={handleConfirmDialog}
          loading={dialogLoading}
          type={dialogState?.type === 'delete' ? 'danger' : 'warning'}
          title={
            dialogState?.type === 'delete'
              ? copy.confirmDeleteTitle
              : dialogState?.pharmacy.is_active
                ? copy.confirmToggleOffTitle
                : copy.confirmToggleOnTitle
          }
          message={
            dialogState?.type === 'delete'
              ? copy.confirmDeleteMessage
              : dialogState?.pharmacy.is_active
                ? copy.confirmToggleOffMessage
                : copy.confirmToggleOnMessage
          }
          confirmText={dialogState?.type === 'delete' ? copy.deleteAction : dialogState?.pharmacy.is_active ? copy.deactivateAction : copy.activateAction}
        />
      </div>
    </div>
  );
};

export default AdminPharmacies;
