Stage 6 changes applied

What was updated in this pass:
- Removed remaining CUSTOMER_CONTENT runtime usage from customer/common pages and shared components.
- Moved these pages/components to t() driven text access:
  - Medicines
  - MedicineDetails
  - Profile
  - SavedMedicines
  - AddressManagement
  - Notifications
  - Chat
  - Orders
  - StatusBadge
  - ScrollToTop
- Expanded translation dictionaries for customer pages and shared common labels.
- Expanded translation dictionaries for pharmacist sections for later full migration.
- Confirmed the project still builds successfully after the changes.

Still recommended for a final pass:
- Admin pages Categories / Pharmacies / Reports still include local bilingual copy objects and should be moved to pure translation keys.
- Pharmacist Dashboard / Inventory / MedicineForm still include local bilingual copy objects and should be moved to pure translation keys.
- Some medicine/pharmacy data fields intentionally switch between Arabic and English data values (for example brand_name_ar vs brand_name). That is expected data localization, not a UI translation bug.
- A manual QA pass in both Arabic and English is still recommended to catch any wording issues not visible in a build-only review.
