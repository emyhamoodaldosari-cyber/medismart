'use client';

import { CartItem as CartItemType } from '@/types';
import { currency } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType & { medicine?: { brand_name: string }; pharmacy?: { name: string } };
  onQuantityChange: (id: string, value: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">{item.medicine?.brand_name ?? 'Medicine'}</h4>
          <p className="text-sm text-slate-600">{item.pharmacy?.name ?? 'Selected pharmacy'}</p>
          <p className="mt-2 text-sm text-slate-600">Unit price: {currency(item.unit_price)}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(event) => onQuantityChange(item.id, Number(event.target.value))}
            className="w-20 rounded-2xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button onClick={() => onRemove(item.id)} className="rounded-full bg-rose-100 px-4 py-2 text-sm text-rose-700 hover:bg-rose-200">
            Remove
          </button>
        </div>
      </div>
      <div className="mt-4 text-sm text-slate-700">Total: {currency(item.quantity * item.unit_price)}</div>
    </div>
  );
}
