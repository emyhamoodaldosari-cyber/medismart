'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MedicineCard from '@/components/MedicineCard';
import { Category, Medicine } from '@/types';
import { listCategories, searchMedicines } from '@/services/medicineService';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';

export default function MedicinesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setCategories(await listCategories());
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadMedicines = async () => {
      setLoading(true);
      setMedicines(await searchMedicines(keyword, selectedCategory || undefined));
      setLoading(false);
    };
    loadMedicines();
  }, [keyword, selectedCategory]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Browse medicines</h1>
            <p className="mt-3 text-slate-600">Search products, compare prices, and view inventory across pharmacies.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="search"
              placeholder="Search by brand or generic name"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-pharmacy focus:ring-2 focus:ring-pharmacy/10"
            />
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-pharmacy focus:ring-2 focus:ring-pharmacy/10"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full">
            <Spinner />
          </div>
        ) : medicines.length === 0 ? (
          <div className="col-span-full rounded-3xl bg-white p-8 text-slate-700 shadow-sm">No medicines matched your search.</div>
        ) : (
          medicines.map((medicine) => (
            <article key={medicine.id} className="col-span-1">
              <MedicineCard medicine={medicine} />
            </article>
          ))
        )}
      </section>

      <section className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Need help deciding?</h2>
            <p className="mt-2 text-slate-600">Messages are available to ask pharmacies about availability and orders.</p>
          </div>
          <Link href="/chat">
            <Button variant="secondary">Open chat</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
