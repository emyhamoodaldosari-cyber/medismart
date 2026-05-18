'use client';

import { Pharmacy } from '@/types';
import { buildWhatsAppLink } from '@/lib/utils';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
}

export default function PharmacyCard({ pharmacy }: PharmacyCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{pharmacy.name}</h3>
          <p className="text-sm text-slate-600">{pharmacy.city}, {pharmacy.district}</p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
          {pharmacy.delivery_available ? 'Delivery' : 'Pickup'}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-700">{pharmacy.street}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>Phone: {pharmacy.phone ?? 'N/A'}</span>
        {pharmacy.whatsapp_contact ? (
          <a href={buildWhatsAppLink(pharmacy.whatsapp_contact)} target="_blank" rel="noreferrer" className="text-pharmacy hover:underline">
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
