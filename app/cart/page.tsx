'use client';

import { useEffect, useState } from 'react';
import CartItem from '@/components/CartItem';
import { getCartForUser, getCartItems, removeCartItem, updateCartItem } from '@/services/cartService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Spinner from '@/components/Spinner';
import Button from '@/components/Button';

export default function CartPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadCart = async () => {
      setLoading(true);
      const cart = await getCartForUser(user.id);
      if (cart) {
        setCartId(cart.id);
        setCartItems(await getCartItems(cart.id));
      }
      setLoading(false);
    };

    loadCart();
  }, [user]);

  const handleQuantityChange = async (id: string, value: number) => {
    if (value < 1) return;
    await updateCartItem(id, value);
    if (cartId) setCartItems(await getCartItems(cartId));
  };

  const handleRemove = async (id: string) => {
    await removeCartItem(id);
    if (cartId) setCartItems(await getCartItems(cartId));
  };

  if (authLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <h1 className="text-3xl font-semibold text-slate-900">Your cart</h1>
        <p className="mt-3 text-slate-600">Manage your items before placing your order.</p>
      </div>
      {loading ? (
        <Spinner />
      ) : cartItems.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-slate-700 shadow-sm">Your cart is empty.</div>
      ) : (
        <div className="space-y-6">
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} onQuantityChange={handleQuantityChange} onRemove={handleRemove} />
          ))}
          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-600">Estimated total</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {cartItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2)} USD
                </p>
              </div>
              <Button variant="primary">Proceed to checkout</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
