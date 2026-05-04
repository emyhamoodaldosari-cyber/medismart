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
