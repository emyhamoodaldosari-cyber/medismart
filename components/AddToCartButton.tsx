'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { addToCart, ensureCart } from '@/services/cartService';
import Button from '@/components/Button';

interface AddToCartButtonProps {
  medicineId: string;
  pharmacyId?: string;
  price?: number;
}

export default function AddToCartButton({ medicineId, pharmacyId, price }: AddToCartButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAdd = async () => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!pharmacyId || typeof price !== 'number') {
      setMessage('No pharmacy pricing is available yet.');
      return;
    }

    setBusy(true);
    try {
      const cart = await ensureCart(user.id, pharmacyId);
      await addToCart(cart.id, pharmacyId, medicineId, 1, price);
      setMessage('Added to cart successfully.');
      router.push('/cart');
    } catch (error) {
      setMessage('Unable to add item to cart. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={handleAdd} disabled={busy || authLoading || !pharmacyId || typeof price !== 'number'}>
        {busy ? 'Adding…' : 'Add to cart'}
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
