# Stage 5 – Additional Notes

## Implemented in this package
- Unified the runtime translation source through `i18nData.ts`.
- Improved language fallback in `LanguageContext`.
- Added route-level lazy loading and Vite manual chunks to reduce the main bundle.
- Added medicine image fallback rendering so medicines always display with an image.
- Added pharmacist medicine image upload/replacement support with Supabase Storage.
- Updated pharmacist inventory and medicine details/listing to show images.

## Remaining recommended improvements
- Migrate the remaining page-local copy objects into the translation source completely so every page uses `t()` or one shared i18n model.
- Add storage bucket SQL/policies for `medicine-images` if not already created in Supabase.
- Review all pages manually in Arabic and English and replace any remaining mixed wording.
- Add image upload support for admin-created medicines too if you later expose medicine creation in admin screens.
