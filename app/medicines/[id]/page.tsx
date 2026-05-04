import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import { getMedicineById, getPriceComparison } from '@/services/medicineService';
import { currency } from '@/lib/utils';

export default async function MedicineDetailPage({ params }: { params: { id: string } }) {
  const medicine = await getMedicineById(params.id);
  if (!medicine) {
    notFound();
  }

  const pricing = await getPriceComparison(params.id);
  const bestStore = pricing[0];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-pharmacy-dark">Medicine details</p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-900">{medicine.brand_name}</h1>
            <p className="mt-4 max-w-2xl text-slate-600">{medicine.description ?? 'Detailed information about this medicine is not available yet.'}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Generic name</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{medicine.generic_name}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Dosage form</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{medicine.dosage_form ?? 'N/A'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Strength</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{medicine.strength ?? 'N/A'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Manufacturer</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{medicine.manufacturer ?? 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-pharmacy-light p-8 text-pharmacy-dark shadow-inner">
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Best available price</h2>
                {bestStore ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-slate-600">Pharmacy: {bestStore.pharmacy.name}</p>
                    <p className="text-2xl font-semibold text-slate-900">{currency(bestStore.price)}</p>
                    <p className={bestStore.in_stock ? 'text-green-600' : 'text-rose-600'}>
                      {bestStore.in_stock ? 'Available now' : 'Unavailable'}
                    </p>
                    <AddToCartButton medicineId={medicine.id} pharmacyId={bestStore.pharmacy.id} price={bestStore.price} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">No pricing information is available for this medicine yet.</p>
                )}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Medicine information</h2>
                <div className="mt-4 space-y-4 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">Usage:</span> {medicine.usage_instructions ?? 'Not available'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Warnings:</span> {medicine.warnings ?? 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <h2 className="text-2xl font-semibold text-slate-900">Price comparison</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricing.length === 0 ? (
            <div className="col-span-full rounded-3xl bg-slate-50 p-8 text-slate-500">No pharmacies have published pricing for this item yet.</div>
          ) : (
            pricing.map((item) => (
              <div key={item.pharmacy.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">{item.pharmacy.name}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{currency(item.price)}</p>
                <p className={item.in_stock ? 'text-green-600' : 'text-rose-600'}>{item.in_stock ? 'In stock' : 'Unavailable'}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
