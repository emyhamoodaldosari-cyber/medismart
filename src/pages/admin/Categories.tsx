import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus, Search, Edit, Trash2, Tags, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminPageHeader from '../../components/AdminPageHeader';
import EmptyState from '../../components/EmptyState';
import FormModal from '../../components/FormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const initialForm = {
  name_ar: '',
  name_en: '',
  description: '',
  is_active: true,
};

const CategoryManagement = () => {
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const copy = {
    title: t('screens.adminCategories.title'),
    subtitle: t('screens.adminCategories.subtitle'),
    addAction: t('screens.adminCategories.addAction'),
    searchPlaceholder: t('screens.adminCategories.searchPlaceholder'),
    activeCount: t('screens.adminCategories.activeCount'),
    bilingualCount: t('screens.adminCategories.bilingualCount'),
    totalCount: t('screens.adminCategories.totalCount'),
    emptyTitle: t('screens.adminCategories.emptyTitle'),
    emptyMessage: t('screens.adminCategories.emptyMessage'),
    addTitle: t('screens.adminCategories.addTitle'),
    editTitle: t('screens.adminCategories.editTitle'),
    formDescription: t('screens.adminCategories.formDescription'),
    nameAr: t('admin.categories.nameAr'),
    nameEn: t('admin.categories.nameEn'),
    description: t('admin.categories.descriptionEn'),
    isActive: t('admin.categories.isActive'),
    nameArPlaceholder: t('admin.categories.nameArPlaceholder'),
    nameEnPlaceholder: t('admin.categories.nameEnPlaceholder'),
    descriptionPlaceholder: language === 'ar' ? t('admin.categories.descriptionArPlaceholder') : t('admin.categories.descriptionEnPlaceholder'),
    requiredError: t('screens.adminCategories.requiredError'),
    created: t('screens.adminCategories.created'),
    updated: t('screens.adminCategories.updated'),
    deleted: t('screens.adminCategories.deleted'),
    loadError: t('screens.adminCategories.loadError'),
    saveError: t('screens.adminCategories.saveError'),
    deleteError: t('screens.adminCategories.deleteError'),
    tableCategory: t('screens.adminCategories.tableCategory'),
    tableDescription: t('screens.adminCategories.tableDescription'),
    tableStatus: t('screens.adminCategories.tableStatus'),
    tableCreated: t('screens.adminCategories.tableCreated'),
    tableActions: t('screens.adminCategories.tableActions'),
    edit: t('actions.edit'),
    delete: t('actions.delete'),
    confirmDeleteTitle: t('screens.adminCategories.confirmDeleteTitle'),
    confirmDeleteMessage: t('screens.adminCategories.confirmDeleteMessage'),
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCategories((data as Category[]) || []);
    } catch (error: any) {
      showToast(error.message || copy.loadError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = [category.name_ar, category.name_en, category.description || ''].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && category.is_active) ||
      (filterStatus === 'inactive' && !category.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name_ar.trim() || !formData.name_en.trim()) {
      showToast(copy.requiredError, 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', selectedCategory.id);
        if (error) throw error;
        showToast(copy.updated, 'success');
      } else {
        const { error } = await supabase.from('categories').insert([{ ...formData }]);
        if (error) throw error;
        showToast(copy.created, 'success');
      }
      setShowFormModal(false);
      setSelectedCategory(null);
      setFormData(initialForm);
      await fetchCategories();
    } catch (error: any) {
      showToast(error.message || copy.saveError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeleteLoading(true);
      const { error } = await supabase.from('categories').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      showToast(copy.deleted, 'success');
      setConfirmDelete(null);
      await fetchCategories();
    } catch (error: any) {
      showToast(error.message || copy.deleteError, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedCategory(null);
    setFormData(initialForm);
    setShowFormModal(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      description: category.description || '',
      is_active: category.is_active,
    });
    setShowFormModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
      <div className="container mx-auto max-w-7xl">
        <AdminPageHeader
          title={copy.title}
          subtitle={copy.subtitle}
          action={{ label: copy.addAction, onClick: openAddModal, icon: <Plus size={18} /> }}
          onRefresh={fetchCategories}
          refreshing={loading}
        />

        <div className="mb-6 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
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
            
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-[#099aa7] focus:bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              
              {(filterStatus !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Clear Filters
                </button>
              )}
              
              <div className="text-sm font-medium text-slate-500">
                {filteredCategories.length} / {categories.length}
              </div>
            </div>
          </div>
        </div>

        {filteredCategories.length === 0 && !loading ? (
          <div className="rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <EmptyState icon={FolderOpen} title={copy.emptyTitle} message={copy.emptyMessage} action={{ label: copy.addAction, onClick: openAddModal }} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr className="text-start text-xs uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-6 py-4 font-semibold">{copy.tableCategory}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableDescription}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableStatus}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableCreated}</th>
                    <th className="px-6 py-4 font-semibold">{copy.tableActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="font-semibold text-[#1f2f31]">{language === 'ar' ? category.name_ar : category.name_en}</p>
                          <p className="text-sm text-slate-500">{language === 'ar' ? category.name_en : category.name_ar}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">{category.description || '—'}</td>
                      <td className="px-6 py-5"><StatusBadge type="active" status={category.is_active ? 'active' : 'inactive'} /></td>
                      <td className="px-6 py-5 text-sm text-slate-600">{new Date(category.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(category)} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#099aa7]/30 hover:bg-[#099aa7]/5 hover:text-[#099aa7]" title={copy.edit}><Edit size={18} /></button>
                          <button onClick={() => setConfirmDelete(category)} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600" title={copy.delete}><Trash2 size={18} /></button>
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
          onClose={() => {
            if (!submitting) {
              setShowFormModal(false);
              setSelectedCategory(null);
              setFormData(initialForm);
            }
          }}
          onSubmit={handleSave}
          title={selectedCategory ? copy.editTitle : copy.addTitle}
          loading={submitting}
          submitText={selectedCategory ? t('actions.update') : t('actions.add')}
          size="lg"
        >
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{copy.formDescription}</div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.nameAr} <span className="text-red-500">*</span></label>
                <input value={formData.name_ar} onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))} placeholder={copy.nameArPlaceholder} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" dir="rtl" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.nameEn} <span className="text-red-500">*</span></label>
                <input value={formData.name_en} onChange={(e) => setFormData((prev) => ({ ...prev, name_en: e.target.value }))} placeholder={copy.nameEnPlaceholder} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" dir="ltr" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.description}</label>
                <textarea value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder={copy.descriptionPlaceholder} rows={4} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]" />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-[#1f2f31]">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))} />
              {copy.isActive}
            </label>
          </div>
        </FormModal>

        <ConfirmDialog
          isOpen={Boolean(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
          title={copy.confirmDeleteTitle}
          message={copy.confirmDeleteMessage}
          confirmText={copy.delete}
          type="danger"
        />
      </div>
    </div>
  );
};

export default CategoryManagement;
