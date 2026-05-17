import { supabase } from '../lib/supabase';
import { Pharmacy } from '../types';
import { storageService } from './storageService';

/**
 * Pharmacy Service - Aligned with database schema
 * Uses real schema fields from pharmacies table
 */
export const pharmacyService = {
  async getAllPharmacies(): Promise<Pharmacy[]> {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data as Pharmacy[]) || [];
  },

  async getPharmacyById(id: string): Promise<Pharmacy> {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Pharmacy;
  },

  async getActivePharmacies(): Promise<Pharmacy[]> {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return (data as Pharmacy[]) || [];
  },

  async createPharmacy(
    pharmacy: Omit<Pharmacy, 'id' | 'created_at' | 'updated_at'>,
    logoFile?: File
  ): Promise<Pharmacy> {
    // Ensure bucket exists
    await storageService.ensureBucketExists();

    // First create the pharmacy record
    const { data, error } = await supabase
      .from('pharmacies')
      .insert([{
        ...pharmacy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Upload logo if provided
    if (logoFile && data) {
      try {
        const logoUrl = await storageService.uploadPharmacyLogo(logoFile, data.id);
        
        // Update pharmacy with logo URL
        const { data: updatedData, error: updateError } = await supabase
          .from('pharmacies')
          .update({ logo_url: logoUrl })
          .eq('id', data.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updatedData as Pharmacy;
      } catch (uploadError) {
        console.error('Logo upload failed:', uploadError);
        // Return pharmacy without logo if upload fails
        return data as Pharmacy;
      }
    }
    
    return data as Pharmacy;
  },

  async updatePharmacy(
    id: string,
    updates: Partial<Omit<Pharmacy, 'id' | 'created_at'>>,
    logoFile?: File,
    removeLogo?: boolean
  ): Promise<void> {
    // Handle logo removal
    if (removeLogo) {
      const { data: currentPharmacy } = await supabase
        .from('pharmacies')
        .select('logo_url')
        .eq('id', id)
        .single();

      if (currentPharmacy?.logo_url) {
        await storageService.deletePharmacyLogo(currentPharmacy.logo_url);
      }

      updates.logo_url = null as any;
    }

    // Handle logo upload
    if (logoFile) {
      await storageService.ensureBucketExists();

      // Delete old logo if exists
      const { data: currentPharmacy } = await supabase
        .from('pharmacies')
        .select('logo_url')
        .eq('id', id)
        .single();

      if (currentPharmacy?.logo_url) {
        await storageService.deletePharmacyLogo(currentPharmacy.logo_url);
      }

      // Upload new logo
      const logoUrl = await storageService.uploadPharmacyLogo(logoFile, id);
      updates.logo_url = logoUrl;
    }

    // Update pharmacy
    const { error } = await supabase
      .from('pharmacies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async deletePharmacy(id: string): Promise<void> {
    // Get pharmacy to delete logo
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('logo_url')
      .eq('id', id)
      .single();

    // Delete logo if exists
    if (pharmacy?.logo_url) {
      await storageService.deletePharmacyLogo(pharmacy.logo_url);
    }

    // Delete pharmacy
    const { error } = await supabase
      .from('pharmacies')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async togglePharmacyStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('pharmacies')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  }
};
