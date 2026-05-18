'use client';

import Link from 'next/link';
import { Medicine } from '@/types';
import { currency } from '@/lib/utils';

interface MedicineCardProps {
  medicine: Medicine;
  price?: number;
  availability?: boolean;
  pharmacyName?: string;
}

export default function MedicineCard({ medicine, price, availability, pharmacyName }: MedicineCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-medical-blue text-pharmacy-dark">
          <span className="text-lg font-semibold">{medicine.brand_name.charAt(0)}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{medicine.brand_name}</h3>
          <p className="text-sm text-slate-600">{medicine.generic_name}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{medicine.description ?? 'No description available yet.'}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
        <span>{medicine.dosage_form ?? 'Dosage not set'}</span>
        <span>{medicine.strength ?? 'Strength not set'}</span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {pharmacyName ? <span className="text-sm text-slate-500">Pharmacy: {pharmacyName}</span> : null}
        {typeof price === 'number' ? <span className="font-semibold text-pharmacy-dark">{currency(price)}</span> : null}
        {typeof availability === 'boolean' ? (
          <span className={availability ? 'text-green-600' : 'text-rose-600'}>
            {availability ? 'In stock' : 'Unavailable'}
          </span>
        ) : null}
      </div>
      <Link href={`/medicines/${medicine.id}`} className="mt-5 inline-flex text-sm font-semibold text-pharmacy hover:text-pharmacy-dark">
        View details
      </Link>
    </div>
  );
}
