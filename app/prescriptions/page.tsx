'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { listPrescriptions, listPrescriptionItems } from '@/services/prescriptionService';
import Spinner from '@/components/Spinner';
import { formatDate } from '@/lib/utils';

export default function PrescriptionsPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [itemsByPrescription, setItemsByPrescription] = useState<Record<string, any[]>>({});
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadPrescriptions = async () => {
      setLoading(true);
      const prescriptionsData = await listPrescriptions(user.id);
      setPrescriptions(prescriptionsData);

      const itemsPromises = prescriptionsData.map(async (prescription) => {
        return [prescription.id, await listPrescriptionItems(prescription.id)] as const;
      });
      const loadedItems = Object.fromEntries(await Promise.all(itemsPromises));
      setItemsByPrescription(loadedItems);
      setLoading(false);
    };

    loadPrescriptions();
  }, [user]);

  if (authLoading || loading) {
    return <Spinner />;
  }

  if (!user) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <p className="text-lg text-slate-700">Please sign in to view your prescriptions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <h1 className="text-3xl font-semibold text-slate-900">Prescriptions</h1>
        <p className="mt-3 text-slate-600">View your doctor prescriptions and suggested medicines in one place.</p>
      </section>

      {prescriptions.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-slate-700 shadow-sm">No prescriptions have been uploaded yet.</div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((prescription) => (
            <section key={prescription.id} className="rounded-[2rem] bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(prescription.created_at)}</p>
                </div>
                <p className="rounded-full bg-pharmacy-light px-4 py-2 text-sm font-semibold text-pharmacy-dark">{prescription.doctor_name ?? 'Doctor not specified'}</p>
              </div>
              <div className="mt-6 space-y-4">
                {itemsByPrescription[prescription.id]?.length ? (
                  itemsByPrescription[prescription.id].map((item) => (
                    <div key={item.id} className="rounded-3xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{item.medicine?.brand_name ?? 'Medicine'}</p>
                      <p className="text-sm text-slate-600">{item.medicine?.generic_name ?? 'Generic name not available'}</p>
                      <p className="mt-2 text-sm text-slate-600">{item.dosage ?? 'Dosage information not available'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">No items were found for this prescription.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
