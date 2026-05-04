import { notFound } from 'next/navigation';
import { currency, formatDate } from '@/lib/utils';
import { getOrderById, getOrderItems } from '@/services/orderService';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) {
    notFound();
  }

  const items = await getOrderItems(order.id);
  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-pharmacy-dark">Order details</p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-900">Order #{order.order_number}</h1>
          </div>
          <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-700">
            <p>Status</p>
            <p className="mt-2 font-semibold text-slate-900">{order.status}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-6">
            <p className="text-sm text-slate-500">Order date</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(order.created_at)}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-6">
            <p className="text-sm text-slate-500">Order type</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{order.order_type === 'delivery' ? 'Home delivery' : 'Pickup'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <h2 className="text-2xl font-semibold text-slate-900">Items</h2>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.medicine?.generic_name ?? 'Medicine'}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{item.medicine?.brand_name ?? 'Unknown medicine'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                  <p className="mt-1 font-semibold text-slate-900">{currency(item.quantity * item.unit_price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 rounded-3xl bg-pharmacy-light p-6 text-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">Order total</p>
          <p className="text-2xl font-semibold">{currency(total)}</p>
        </div>
      </section>
    </div>
  );
}
