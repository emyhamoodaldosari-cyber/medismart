import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storageService } from '../../services/storageService';
import { getMedicineImageSrc } from '../../utils/medicineImage';

interface CategoryOption {
  id: string;
  name_en: string;
  name_ar: string;
}

const PharmacistMedicineForm = () => {
  const { medicineId } = useParams<{ medicineId?: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(Boolean(medicineId));
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [formData, setFormData] = useState({
    brand_name: '',
    brand_name_ar: '',
    generic_name: '',
    generic_name_ar: '',
    description: '',
    description_ar: '',
    dosage_form: '',
    strength: '',
    manufacturer: '',
    image_url: '',
    usage_instructions: '',
    warnings: '',
    requires_prescription: false,
    category_id: '',
    is_active: true,
  });
  const [inventoryData, setInventoryData] = useState({
    quantity: 0,
    price: 0,
    expiry_date: '',
    low_stock_threshold: 5,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const copy = {
    back: t('screens.pharmacistMedicineForm.back'),
    addTitle: t('screens.pharmacistMedicineForm.addTitle'),
    editTitle: t('screens.pharmacistMedicineForm.editTitle'),
    subtitleAdd: t('screens.pharmacistMedicineForm.subtitleAdd'),
    subtitleEdit: t('screens.pharmacistMedicineForm.subtitleEdit'),
    loadCategoryError: t('screens.pharmacistMedicineForm.loadCategoryError'),
    loadMedicineError: t('screens.pharmacistMedicineForm.loadMedicineError'),
    saveError: t('screens.pharmacistMedicineForm.saveError'),
    saveSuccessAdd: t('screens.pharmacistMedicineForm.saveSuccessAdd'),
    saveSuccessEdit: t('screens.pharmacistMedicineForm.saveSuccessEdit'),
    requiredError: t('screens.pharmacistMedicineForm.requiredError'),
    medicineInfo: t('screens.pharmacistMedicineForm.medicineInfo'),
    inventoryInfo: t('screens.pharmacistMedicineForm.inventoryInfo'),
    fields: {
      brandEn: t('screens.pharmacistMedicineForm.fields.brandEn'),
      brandAr: t('screens.pharmacistMedicineForm.fields.brandAr'),
      genericEn: t('screens.pharmacistMedicineForm.fields.genericEn'),
      genericAr: t('screens.pharmacistMedicineForm.fields.genericAr'),
      dosage: t('screens.pharmacistMedicineForm.fields.dosage'),
      strength: t('screens.pharmacistMedicineForm.fields.strength'),
      manufacturer: t('screens.pharmacistMedicineForm.fields.manufacturer'),
      category: t('screens.pharmacistMedicineForm.fields.category'),
      descriptionEn: t('screens.pharmacistMedicineForm.fields.descriptionEn'),
      descriptionAr: t('screens.pharmacistMedicineForm.fields.descriptionAr'),
      instructions: t('screens.pharmacistMedicineForm.fields.instructions'),
      warnings: t('screens.pharmacistMedicineForm.fields.warnings'),
      imageUrl: t('screens.pharmacistMedicineForm.fields.imageUrl'),
      imageUpload: t('screens.pharmacistMedicineForm.fields.imageUpload'),
      imagePreview: t('screens.pharmacistMedicineForm.fields.imagePreview'),
      removeImage: t('screens.pharmacistMedicineForm.fields.removeImage'),
      requiresPrescription: t('screens.pharmacistMedicineForm.fields.requiresPrescription'),
      active: t('screens.pharmacistMedicineForm.fields.active'),
      quantity: t('screens.pharmacistMedicineForm.fields.quantity'),
      price: t('screens.pharmacistMedicineForm.fields.price'),
      expiry: t('screens.pharmacistMedicineForm.fields.expiry'),
      threshold: t('screens.pharmacistMedicineForm.fields.threshold'),
    },
    placeholders: {
      brandEn: t('screens.pharmacistMedicineForm.placeholders.brandEn'),
      brandAr: t('screens.pharmacistMedicineForm.placeholders.brandAr'),
      genericEn: t('screens.pharmacistMedicineForm.placeholders.genericEn'),
      genericAr: t('screens.pharmacistMedicineForm.placeholders.genericAr'),
      dosage: t('screens.pharmacistMedicineForm.placeholders.dosage'),
      strength: t('screens.pharmacistMedicineForm.placeholders.strength'),
      manufacturer: t('screens.pharmacistMedicineForm.placeholders.manufacturer'),
      category: t('screens.pharmacistMedicineForm.placeholders.category'),
      descriptionEn: t('screens.pharmacistMedicineForm.placeholders.descriptionEn'),
      descriptionAr: t('screens.pharmacistMedicineForm.placeholders.descriptionAr'),
      instructions: t('screens.pharmacistMedicineForm.placeholders.instructions'),
      warnings: t('screens.pharmacistMedicineForm.placeholders.warnings'),
      imageUrl: t('screens.pharmacistMedicineForm.placeholders.imageUrl'),
      imageUpload: t('screens.pharmacistMedicineForm.placeholders.imageUpload'),
    },
    dosageOptions: [
      t('screens.pharmacistMedicineForm.dosageOptions.tablet'),
      t('screens.pharmacistMedicineForm.dosageOptions.capsule'),
      t('screens.pharmacistMedicineForm.dosageOptions.syrup'),
      t('screens.pharmacistMedicineForm.dosageOptions.injection'),
      t('screens.pharmacistMedicineForm.dosageOptions.cream'),
      t('screens.pharmacistMedicineForm.dosageOptions.ointment'),
      t('screens.pharmacistMedicineForm.dosageOptions.drops'),
    ],
  };

  useEffect(() => {
    void fetchCategories();
    if (medicineId) void fetchMedicine();
  }, [medicineId]);

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id,name_en,name_ar').eq('is_active', true).order('name_en');
      if (error) throw error;
      setCategories((data as CategoryOption[]) || []);
    } catch (error: any) {
      showToast(error.message || copy.loadCategoryError, 'error');
    }
  };

  const fetchMedicine = async () => {
    try {
      const { data, error } = await supabase.from('medicines').select('*').eq('id', medicineId).single();
      if (error) throw error;
      setFormData({
        brand_name: data.brand_name || '',
        brand_name_ar: data.brand_name_ar || '',
        generic_name: data.generic_name || '',
        generic_name_ar: data.generic_name_ar || '',
        description: data.description || '',
        description_ar: data.description_ar || '',
        dosage_form: data.dosage_form || '',
        strength: data.strength || '',
        manufacturer: data.manufacturer || '',
        image_url: data.image_url || '',
        usage_instructions: data.usage_instructions || '',
        warnings: data.warnings || '',
        requires_prescription: data.requires_prescription || false,
        category_id: data.category_id || '',
        is_active: data.is_active !== false,
      });
      setImagePreview(data.image_url || '');
      setImageFile(null);
      setRemoveCurrentImage(false);

      if (profile?.pharmacy_id) {
        const { data: inventory } = await supabase
          .from('pharmacy_inventory')
          .select('*')
          .eq('medicine_id', medicineId)
          .eq('pharmacy_id', profile.pharmacy_id)
          .single();

        if (inventory) {
          setInventoryData({
            quantity: inventory.quantity || 0,
            price: inventory.price || 0,
            expiry_date: inventory.expiry_date || '',
            low_stock_threshold: inventory.low_stock_threshold || 5,
          });
        }
      }
    } catch (error: any) {
      showToast(error.message || copy.loadMedicineError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveCurrentImage(false);
    } catch (error: any) {
      showToast(error.message || copy.saveError, 'error');
    }
  };

  const clearSelectedImage = () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setRemoveCurrentImage(Boolean(medicineId));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.brand_name.trim() || !formData.generic_name.trim() || Number(inventoryData.price) <= 0) {
      showToast(copy.requiredError, 'error');
      return;
    }

    try {
      setSubmitting(true);
      let currentMedicineId = medicineId;

      const medicinePayload = {
        ...formData,
        brand_name: formData.brand_name?.trim() || '',
        brand_name_ar: formData.brand_name_ar?.trim() || null,
        generic_name: formData.generic_name?.trim() || '',
        generic_name_ar: formData.generic_name_ar?.trim() || null,
        description: formData.description?.trim() || null,
        description_ar: formData.description_ar?.trim() || null,
        dosage_form: formData.dosage_form || null,
        strength: formData.strength?.trim() || null,
        manufacturer: formData.manufacturer?.trim() || null,
        image_url: removeCurrentImage ? null : formData.image_url?.trim() || null,
        usage_instructions: formData.usage_instructions?.trim() || null,
        warnings: formData.warnings?.trim() || null,
        category_id: formData.category_id || null,
      };

      if (medicineId) {
        const { error } = await supabase.from('medicines').update(medicinePayload).eq('id', medicineId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('medicines').insert([medicinePayload]).select('id').single();
        if (error) throw error;
        currentMedicineId = data.id;
      }

      if (!currentMedicineId) {
        throw new Error(copy.saveError);
      }

      if (removeCurrentImage && formData.image_url) {
        await storageService.deleteMedicineImage(formData.image_url);
      }

      if (imageFile) {
        await storageService.ensureMedicineImagesBucketExists();
        if (formData.image_url) {
          await storageService.deleteMedicineImage(formData.image_url);
        }
        const uploadedImageUrl = await storageService.uploadMedicineImage(imageFile, currentMedicineId);
        const { error } = await supabase.from('medicines').update({ image_url: uploadedImageUrl }).eq('id', currentMedicineId);
        if (error) throw error;
      }

      if (!profile?.pharmacy_id) {
        throw new Error(copy.saveError);
      }

      const inventoryPayload = {
        pharmacy_id: profile.pharmacy_id,
        medicine_id: currentMedicineId,
        quantity: Number(inventoryData.quantity),
        price: Number(inventoryData.price),
        expiry_date: inventoryData.expiry_date || null,
        low_stock_threshold: Number(inventoryData.low_stock_threshold),
        in_stock: Number(inventoryData.quantity) > 0,
        is_active: true,
      };

      const { data: existingInventory } = await supabase
        .from('pharmacy_inventory')
        .select('id')
        .eq('pharmacy_id', profile.pharmacy_id)
        .eq('medicine_id', currentMedicineId)
        .single();

      if (existingInventory?.id) {
        const { error } = await supabase.from('pharmacy_inventory').update(inventoryPayload).eq('id', existingInventory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pharmacy_inventory').insert([inventoryPayload]);
        if (error) throw error;
      }

      showToast(medicineId ? copy.saveSuccessEdit : copy.saveSuccessAdd, 'success');
      navigate('/pharmacist/inventory');
    } catch (error: any) {
      showToast(error.message || copy.saveError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="animate-spin text-[#099aa7]" size={40} />
      </div>
    );
  }

  const inputClass = 'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#099aa7]';

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-24">
      <div className="container mx-auto max-w-6xl">
        <button onClick={() => navigate('/pharmacist/inventory')} className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#099aa7]/30 hover:bg-slate-50">
          <ArrowLeft size={18} />
          {copy.back}
        </button>

        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-4xl font-heading font-bold text-[#1f2f31]">{medicineId ? copy.editTitle : copy.addTitle}</h1>
            <p className="mt-2 text-slate-600">{medicineId ? copy.subtitleEdit : copy.subtitleAdd}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-5">
              <h2 className="text-xl font-bold text-[#1f2f31]">{copy.medicineInfo}</h2>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.brandEn} <span className="text-red-500">*</span></label>
                  <input value={formData.brand_name} onChange={(e) => setFormData((prev) => ({ ...prev, brand_name: e.target.value }))} placeholder={copy.placeholders.brandEn} className={inputClass} dir="ltr" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.brandAr}</label>
                  <input value={formData.brand_name_ar} onChange={(e) => setFormData((prev) => ({ ...prev, brand_name_ar: e.target.value }))} placeholder={copy.placeholders.brandAr} className={inputClass} dir="rtl" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.genericEn} <span className="text-red-500">*</span></label>
                  <input value={formData.generic_name} onChange={(e) => setFormData((prev) => ({ ...prev, generic_name: e.target.value }))} placeholder={copy.placeholders.genericEn} className={inputClass} dir="ltr" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.genericAr}</label>
                  <input value={formData.generic_name_ar} onChange={(e) => setFormData((prev) => ({ ...prev, generic_name_ar: e.target.value }))} placeholder={copy.placeholders.genericAr} className={inputClass} dir="rtl" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.dosage}</label>
                  <select value={formData.dosage_form} onChange={(e) => setFormData((prev) => ({ ...prev, dosage_form: e.target.value }))} className={inputClass}>
                    <option value="">{copy.placeholders.dosage}</option>
                    {copy.dosageOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.strength}</label>
                  <input value={formData.strength} onChange={(e) => setFormData((prev) => ({ ...prev, strength: e.target.value }))} placeholder={copy.placeholders.strength} className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.manufacturer}</label>
                  <input value={formData.manufacturer} onChange={(e) => setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))} placeholder={copy.placeholders.manufacturer} className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.category}</label>
                  <select value={formData.category_id} onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))} className={inputClass}>
                    <option value="">{copy.placeholders.category}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{language === 'ar' ? category.name_ar : category.name_en}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.imageUpload}</label>
                  <div className="grid gap-4 lg:grid-cols-[180px,1fr]">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-inner">
                      <div className="aspect-[4/3] w-full overflow-hidden">
                        <img 
                          src={imagePreview || getMedicineImageSrc(formData)} 
                          alt={formData.brand_name || formData.generic_name || 'Medicine'} 
                          className="h-full w-full object-cover"
                          loading="eager"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallback = getMedicineImageSrc(null, formData.brand_name || formData.generic_name);
                            if (target.src !== fallback) {
                              console.warn('Failed to load medicine form image, using placeholder:', target.src);
                              target.src = fallback;
                            }
                          }}
                        />
                      </div>
                      <div className="border-t border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-500">{copy.fields.imagePreview}</div>
                    </div>
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#099aa7]/40 bg-white px-4 py-4 text-sm font-semibold text-[#099aa7] transition hover:border-[#099aa7] hover:bg-[#099aa7]/5">
                        <ImagePlus size={18} />
                        <span>{copy.fields.imageUpload}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelection} />
                      </label>
                      <p className="text-xs text-slate-500">{copy.placeholders.imageUpload}</p>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.imageUrl}</label>
                        <input value={formData.image_url} onChange={(e) => { setFormData((prev) => ({ ...prev, image_url: e.target.value })); if (!imageFile) setImagePreview(e.target.value.trim()); setRemoveCurrentImage(false); }} placeholder={copy.placeholders.imageUrl} className={inputClass} dir="ltr" />
                      </div>
                      {(imagePreview || formData.image_url) && (
                        <button type="button" onClick={clearSelectedImage} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                          <Trash2 size={16} />
                          {copy.fields.removeImage}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.descriptionEn}</label>
                  <textarea value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} rows={4} placeholder={copy.placeholders.descriptionEn} className={inputClass} dir="ltr" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.descriptionAr}</label>
                  <textarea value={formData.description_ar} onChange={(e) => setFormData((prev) => ({ ...prev, description_ar: e.target.value }))} rows={4} placeholder={copy.placeholders.descriptionAr} className={inputClass} dir="rtl" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.instructions}</label>
                  <textarea value={formData.usage_instructions} onChange={(e) => setFormData((prev) => ({ ...prev, usage_instructions: e.target.value }))} rows={4} placeholder={copy.placeholders.instructions} className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.warnings}</label>
                  <textarea value={formData.warnings} onChange={(e) => setFormData((prev) => ({ ...prev, warnings: e.target.value }))} rows={4} placeholder={copy.placeholders.warnings} className={inputClass} />
                </div>
              </div>
              <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
                <label className="flex items-center gap-3 text-sm font-semibold text-[#1f2f31]">
                  <input type="checkbox" checked={formData.requires_prescription} onChange={(e) => setFormData((prev) => ({ ...prev, requires_prescription: e.target.checked }))} />
                  {copy.fields.requiresPrescription}
                </label>
                <label className="flex items-center gap-3 text-sm font-semibold text-[#1f2f31]">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))} />
                  {copy.fields.active}
                </label>
              </div>
            </section>

            <section className="space-y-5 border-t border-slate-100 pt-8">
              <h2 className="text-xl font-bold text-[#1f2f31]">{copy.inventoryInfo}</h2>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.quantity}</label>
                  <input type="number" min="0" value={inventoryData.quantity} onChange={(e) => setInventoryData((prev) => ({ ...prev, quantity: Number(e.target.value) }))} className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.price} <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" value={inventoryData.price} onChange={(e) => setInventoryData((prev) => ({ ...prev, price: Number(e.target.value) }))} className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.expiry}</label>
                  <input type="date" value={inventoryData.expiry_date} onChange={(e) => setInventoryData((prev) => ({ ...prev, expiry_date: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1f2f31]">{copy.fields.threshold}</label>
                  <input type="number" min="0" value={inventoryData.low_stock_threshold} onChange={(e) => setInventoryData((prev) => ({ ...prev, low_stock_threshold: Number(e.target.value) }))} className={inputClass} />
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
              <button type="button" onClick={() => navigate('/pharmacist/inventory')} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#099aa7]/30 hover:bg-slate-50">
                {t('actions.cancel')}
              </button>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-2xl bg-[#099aa7] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#099aa7]/20 transition hover:bg-[#088a96] disabled:opacity-50">
                {submitting && <Loader size={16} className="animate-spin" />}
                {medicineId ? t('actions.update') : t('actions.add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PharmacistMedicineForm;
