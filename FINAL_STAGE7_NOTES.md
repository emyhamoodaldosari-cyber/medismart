Final stage 7 notes
===================

Implemented in this stage:
- Moved the remaining admin + pharmacist page UI strings to runtime translation access through t().
- Added dedicated translation keys under screens.* for the remaining admin/pharmacist pages.
- Finalized Home hero typography/layout so the main headline is more responsive and readable across screen sizes.
- Verified the project still builds successfully after the changes.

Additional fixes still recommended:
- Manual screen-by-screen QA in browser for Arabic and English on mobile, tablet, and desktop.
- Some text shown from database records (for example brand_name_ar / brand_name) is data-driven and not part of the translation dictionary; that is expected.
- Consider adding a Features anchor/link in the public header if you want fuller landing-page navigation.
- Review Supabase Storage/RLS policies for medicine images so uploads remain limited to pharmacist/admin roles only.
- Add visual regression testing or screenshot QA before final academic submission.
