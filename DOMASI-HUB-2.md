# Domasi Hub 2.0

New mobile-first frontend foundation for Domasi Hub.

## Architecture
- Static frontend + Capacitor
- Supabase Auth / PostgreSQL / Storage
- Client uses only the Supabase publishable key
- No service-role key is included
- Legacy application remains in `legacy/`
- New Capacitor web directory is `app/`

## Authentication
Signup uses full name, email, Domasi registration number, WhatsApp number and password. Registration number validation is client-side for UX only; authorization and uniqueness must be enforced by PostgreSQL/RLS.

## Database
Apply `supabase/schema.sql` in the Supabase SQL Editor before using listings, housing, academics, printing, services or notifications. That file creates tables, RLS, the signup profile trigger, welcome notifications, and Storage buckets `hub-public` / `hub-private`.

## Run
`npm install` then `npm run dev`.

## Android
`npx cap sync android` then `npx cap open android`.

## Important
The Supabase publishable key is intended for browser/mobile clients. Never put a Supabase service-role/secret key in frontend code.
