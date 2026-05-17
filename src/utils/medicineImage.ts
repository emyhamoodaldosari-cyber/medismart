import { Medicine } from '../types';
import { supabase } from '../lib/supabase';

const createSvgPlaceholder = (label: string) => {
  const text = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f766e" />
          <stop offset="100%" stop-color="#0891b2" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" rx="36" fill="url(#bg)" />
      <circle cx="120" cy="108" r="48" fill="rgba(255,255,255,.18)" />
      <circle cx="500" cy="76" r="28" fill="rgba(255,255,255,.12)" />
      <circle cx="520" cy="320" r="42" fill="rgba(255,255,255,.08)" />
      <g fill="#ffffff" opacity="0.92">
        <rect x="116" y="154" width="368" height="110" rx="26" fill="rgba(255,255,255,.14)" />
        <rect x="158" y="122" width="284" height="156" rx="32" fill="rgba(255,255,255,.16)" />
        <path d="M300 126c19 0 35 16 35 35v42c0 19-16 35-35 35s-35-16-35-35v-42c0-19 16-35 35-35zm0 18c-9 0-17 8-17 17v42c0 9 8 17 17 17s17-8 17-17v-42c0-9-8-17-17-17z" />
      </g>
      <text x="300" y="325" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" text-anchor="middle" fill="#ffffff">${text}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getMedicineImageSrc = (medicine?: Partial<Medicine> | null, fallbackLabel?: string) => {
  // Check if image_url exists and is not empty
  if (medicine?.image_url && medicine.image_url.trim()) {
    let imageUrl = medicine.image_url.trim();
    
    // If it's already a full URL (starts with http:// or https://)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a data URL
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    // If it's a storage path, convert to public URL
    try {
      const { data } = supabase.storage
        .from('medicine-images')
        .getPublicUrl(imageUrl);
      
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch (error) {
      console.warn('Failed to get public URL for medicine image:', error);
    }
  }
  
  // Return placeholder if no valid image
  const label = fallbackLabel || medicine?.brand_name_ar || medicine?.brand_name || medicine?.generic_name_ar || medicine?.generic_name || 'Medicine';
  return createSvgPlaceholder(label);
};
