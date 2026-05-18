import { supabase } from '@/lib/supabase';
import type { Category, Medicine, Pharmacy } from '@/types';

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name_en');
  if (error) throw error;
  return data ?? [];
}

export async function searchMedicines(keyword: string, categoryId?: string): Promise<Medicine[]> {
  const query = supabase.from('medicines').select('*').ilike('brand_name', `%${keyword}%`).or(`generic_name.ilike.%${keyword}%`);
  if (categoryId) query.eq('category_id', categoryId);
  const { data, error } = await query.order('brand_name');
  if (error) throw error;
  return data ?? [];
}

export async function getMedicineById(id: string): Promise<Medicine | null> {
  const { data, error } = await supabase.from('medicines').select('*').eq('id', id).single();
  if (error) throw error;
  return data ?? null;
}

export async function getPriceComparison(id: string): Promise<Array<{ pharmacy: Pharmacy; price: number; in_stock: boolean }>> {
  const { data, error } = await supabase
    .from('pharmacy_inventory')
    .select('price,in_stock,pharmacy_id,pharmacies(*)')
    .eq('medicine_id', id)
    .in('pharmacy_id', (await supabase.from('pharmacies').select('id').eq('is_active', true).returns<string[]>()).data ?? [])
    .order('price');

  if (error) throw error;
  return (
    data?.map((item: any) => ({
      pharmacy: item.pharmacies,
      price: Number(item.price),
      in_stock: item.in_stock,
    })) ?? []
  );
}
