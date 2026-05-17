import { supabase } from '../lib/supabase';

const PHARMACY_LOGOS_BUCKET = 'pharmacy-logos';
const MEDICINE_IMAGES_BUCKET = 'medicine-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const validateImageFile = (file: File) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }
};

const extractStoragePath = (fileUrl: string, bucketName: string): string | null => {
  if (!fileUrl) return null;
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const index = fileUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(fileUrl.slice(index + marker.length));
};

const uploadPublicImage = async (bucketName: string, file: File, folder: string, entityId: string) => {
  validateImageFile(file);

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${entityId}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error('Failed to upload image');
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return publicUrl;
};

const deletePublicImage = async (bucketName: string, fileUrl: string) => {
  const filePath = extractStoragePath(fileUrl, bucketName);
  if (!filePath) return;

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);
  if (error) {
    console.error('Storage delete error:', error);
  }
};

const ensureBucketExists = async (bucketName: string) => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });

      if (error && !error.message.includes('already exists')) {
        console.error('Bucket creation error:', error);
      }
    }
  } catch (error) {
    console.error(`Error ensuring bucket exists (${bucketName}):`, error);
  }
};

export const storageService = {
  async uploadPharmacyLogo(file: File, pharmacyId: string): Promise<string> {
    return uploadPublicImage(PHARMACY_LOGOS_BUCKET, file, 'logos', pharmacyId);
  },

  async deletePharmacyLogo(logoUrl: string): Promise<void> {
    await deletePublicImage(PHARMACY_LOGOS_BUCKET, logoUrl);
  },

  async uploadMedicineImage(file: File, medicineId: string): Promise<string> {
    return uploadPublicImage(MEDICINE_IMAGES_BUCKET, file, 'medicines', medicineId);
  },

  async deleteMedicineImage(imageUrl: string): Promise<void> {
    await deletePublicImage(MEDICINE_IMAGES_BUCKET, imageUrl);
  },

  async ensureBucketExists(): Promise<void> {
    await ensureBucketExists(PHARMACY_LOGOS_BUCKET);
  },

  async ensureMedicineImagesBucketExists(): Promise<void> {
    await ensureBucketExists(MEDICINE_IMAGES_BUCKET);
  },

  getPlaceholderImage(label: string) {
    const safeLabel = encodeURIComponent(label || 'Medicine');
    return `https://placehold.co/600x400/f1f5f9/0f172a?text=${safeLabel}`;
  },
};
