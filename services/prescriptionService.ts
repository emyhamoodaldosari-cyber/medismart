import { supabase } from '@/lib/supabase';
import type { Prescription, PrescriptionItem } from '@/types';

export async function listPrescriptions(userId: string): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listPrescriptionItems(
  prescriptionId: string,
): Promise<Array<PrescriptionItem & { medicine?: { brand_name: string; generic_name: string } }>> {
  const { data, error } = await supabase
    .from('prescription_items')
    .select('*, medicines(brand_name, generic_name)')
    .eq('prescription_id', prescriptionId);

  if (error) throw error;
  return data ?? [];
}

export async function uploadPrescriptionFile(file: File, userId: string, medicineId?: string): Promise<{ path: string; url: string }> {
  // Validate file
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Only PDF, JPEG, and PNG files are allowed');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB');
  }

  // Upload to Supabase storage
  const fileExt = file.name.split('.').pop()?.toLowerCase() || file.type.split('/')[1];
  const fileName = `${userId}-${medicineId || Date.now()}-${Date.now()}.${fileExt}`;
  const filePath = `prescriptions/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('prescriptions')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Prescription upload error:', uploadError);
    throw new Error('Failed to upload prescription file');
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('prescriptions').getPublicUrl(filePath);

  return { path: filePath, url: publicUrl };
}

export async function createPrescriptionRecord(
  userId: string,
  pharmacyId: string | undefined,
  storagePath: string,
  fileName: string,
  mimeType: string,
  doctorName?: string,
  notes?: string,
): Promise<Prescription> {
  const { data, error } = await supabase
    .from('prescriptions')
    .insert({
      user_id: userId,
      pharmacy_id: pharmacyId,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      doctor_name: doctorName,
      notes: notes,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Prescription;
}

export async function getPrescriptionById(prescriptionId: string): Promise<Prescription | null> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('id', prescriptionId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Prescription | null;
}
