import { supabase } from '../lib/supabase';
import { ContactMessage, ContactMessageType } from '../types';

/**
 * Contact message service
 */
export const contactService = {
  /**
   * Submit a contact message
   */
  async submitContactMessage(
    data: {
      name: string;
      email: string;
      subject: string;
      message: string;
      messageType?: ContactMessageType;
      phone?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        return { success: false, error: 'Name is required' };
      }
      
      if (!data.email?.trim()) {
        return { success: false, error: 'Email is required' };
      }
      
      if (!data.subject?.trim()) {
        return { success: false, error: 'Subject is required' };
      }
      
      if (!data.message?.trim()) {
        return { success: false, error: 'Message is required' };
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      
      // Get current user if logged in
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      // Submit the contact message
      const { data: result, error } = await supabase.rpc('submit_contact_message', {
        p_name: data.name.trim(),
        p_email: data.email.trim(),
        p_subject: data.subject.trim(),
        p_message: data.message.trim(),
        p_message_type: data.messageType || 'general',
        p_phone: data.phone?.trim() || null,
        p_user_id: userId || null
      });
      
      if (error) {
        console.error('Error submitting contact message:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to submit contact message. Please try again.' 
        };
      }
      
      return { 
        success: true, 
        messageId: result 
      };
      
    } catch (error: any) {
      console.error('Exception in submitContactMessage:', error);
      return { 
        success: false, 
        error: error.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  },
  
  /**
   * Get user's contact messages (for logged-in users)
   */
  async getUserContactMessages(): Promise<ContactMessage[]> {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching contact messages:', error);
        throw error;
      }
      
      return data as ContactMessage[];
    } catch (error) {
      console.error('Exception in getUserContactMessages:', error);
      return [];
    }
  },
  
  /**
   * Get contact message by ID
   */
  async getContactMessageById(messageId: string): Promise<ContactMessage | null> {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('id', messageId)
        .single();
      
      if (error) {
        console.error('Error fetching contact message:', error);
        return null;
      }
      
      return data as ContactMessage;
    } catch (error) {
      console.error('Exception in getContactMessageById:', error);
      return null;
    }
  },
  
  /**
   * Get contact message statistics (admin only)
   */
  async getContactMessageStats() {
    try {
      const { data, error } = await supabase.rpc('get_contact_message_stats');
      
      if (error) {
        console.error('Error fetching contact message stats:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception in getContactMessageStats:', error);
      return null;
    }
  },
  
  /**
   * Validate contact form data
   */
  validateContactForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    // Name validation
    if (!data.name?.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
    
    // Email validation
    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address';
      } else if (data.email.length > 255) {
        errors.email = 'Email must be less than 255 characters';
      }
    }
    
    // Subject validation
    if (!data.subject?.trim()) {
      errors.subject = 'Subject is required';
    } else if (data.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters';
    } else if (data.subject.trim().length > 200) {
      errors.subject = 'Subject must be less than 200 characters';
    }
    
    // Message validation
    if (!data.message?.trim()) {
      errors.message = 'Message is required';
    } else if (data.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    } else if (data.message.trim().length > 5000) {
      errors.message = 'Message must be less than 5000 characters';
    }
    
    // Phone validation (optional)
    if (data.phone?.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.phone = 'Please enter a valid phone number';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};