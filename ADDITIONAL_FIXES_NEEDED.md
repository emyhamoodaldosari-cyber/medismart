# Additional fixes still recommended

This project now includes a stronger admin and pharmacist implementation with:
- professional pharmacy CRUD modal flow with logo upload support
- category management modal flow and confirmation dialogs
- improved reports page with full Arabic/English content switching
- improved pharmacist dashboard
- improved pharmacist inventory management with confirmation dialog
- improved pharmacist medicine add/edit page
- clean TypeScript build and lint success

## Still recommended after this stage

1. **Complete shared translations for all remaining screens**
   Some screens still rely on mixed sources (`translations.ts`, `customerContent.ts`, and local page dictionaries). The app works, but a final central i18n unification is still recommended.

2. **Admin users page final UX pass**
   The users page is already functional, but it can still benefit from the same upgraded modal/layout polish level used in pharmacies and categories.

3. **Shared orders page pharmacist/customer split**
   The same `Orders.tsx` page is reused for customers and pharmacists. It works, but a future dedicated pharmacist orders screen would improve operational clarity.

4. **Image/storage hardening**
   Pharmacy logo upload works through the current storage service, but production deployment should confirm:
   - bucket policies
   - file size validation in UI and backend policies
   - consistent fallback images

5. **Bundle size optimization**
   Production build still shows a large chunk warning. Add route-level lazy loading and manual chunking for admin/pharmacist areas.

6. **Final visual consistency pass**
   The admin/pharmacist pages are significantly improved, but a last global pass is still recommended for:
   - spacing consistency
   - status color consistency
   - table responsiveness
   - mobile polish

7. **Repository hygiene**
   Before final submission/deployment, remove or review:
   - `.env`
   - `.env.local`
   - `firebase-debug.log`
   - unused docs/logs
   - old generated zip files

8. **Database/content validation**
   Ensure all seeded data and schema columns match the final UI assumptions, especially:
   - `logo_url`
   - Arabic medicine/category fields
   - pharmacist-to-pharmacy assignments
   - realtime-enabled tables
