# SCR-18 server integration requirements

UI implemented in PrivacyScreens.jsx and Profile.jsx. Existing local changes preserved. No backend code or deployed DB changed.

## Consent
Profile upsert sends consent_version (text) and consented_at (timestamptz) together with profile fields. Add these columns with RLS restricted to auth.uid() = user_id before signed-in saves can succeed. The server must validate consent on all dietary-profile writes; UI checks are not server enforcement. No success is shown on storage errors. Existing profiles must not be treated as proof of consent. Consent is requested on each save.

## Deletion
Provide authenticated Supabase RPC delete_my_data() with no user-id argument. Backend PR #19 provides this function: it uses auth.uid(), allows authenticated callers, deletes their scan_logs and clears dietary fields and consent atomically. The profile row and auth account remain. Configure permissions/RLS appropriately. It does not promise deletion of the Google or Supabase auth account. Client signs out only after successful deletion. Missing RPC shows an error and does not claim success. Do not replace this with separate non-atomic client deletes.

## Device-only storage
Decline signs out before setting guest mode and saves guestProfile locally. Existing server information is not removed by declining. Existing guest analysis flow sends profile in request body. Clearing storage/logout removes the browser copy, not an existing server copy.

## Confirm before release
Privacy notice explicitly flags unconfirmed hosting regions, external processing/retention, photo retention and service contact. Team must finalize these facts and wording before release. Figma: SCR-18-1/2/3/4.

## Backend PR #19 sync
The matching schema and RPC are now in kfood-backend/supabase/migrations/09_privacy_consent.sql. Apply this migration to the target Supabase project before end-to-end use. Local git sync does not apply SQL to Supabase. Actual database migration state has not been verified.
