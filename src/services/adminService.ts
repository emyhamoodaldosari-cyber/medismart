import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

/**
 * Admin User Service - Aligned with profiles table schema
 */
export const adminUserService = {
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data as UserProfile[]) || [];
  },

  async updateUserRole(userId: string, newRole: string): Promise<void> {
    // Validate role
    const validRoles = ['customer', 'pharmacist', 'admin'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async updateUserPharmacy(userId: string, pharmacyId: string | null): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ pharmacy_id: pharmacyId })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  }
};
