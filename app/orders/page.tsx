'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listOrders } from '@/services/orderService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Spinner from '@/components/Spinner';

export default function OrdersPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      setLoading(true);
      setOrders(await listOrders(user.id));
      setLoading(false);
    };

    loadOrders();
  }, [user]);

  if (authLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <h1 className="text-3xl font-semibold text-slate-900">Your orders</h1>
        <p className="mt-3 text-slate-600">Track status updates and review recent purchases.</p>
      </div>
      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-slate-700 shadow-sm">No orders found yet.</div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-pharmacy/60">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Order #{order.order_number}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{order.status}</p>
                </div>
                <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
