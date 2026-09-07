# Domasi Hub

Domasi Hub is a campus-focused web and mobile app built for students to discover and share useful resources, services, and updates within their university community. The app includes a marketplace, accommodation listings, academic resource access, student services, notifications, and a management portal for posting content.

## Features

- Campus marketplace for buying and selling items
- Accommodation and hostel listings
- Academic resource vault for course materials and past papers
- Student service and skill listings
- Notifications and bulletin updates
- Student profile and account flow
- Management portal to publish marketplace, printing, and accommodation listings
- Capacitor wrapper for Android and iOS mobile deployment
- Supabase integration for auth, database, and storage

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend / Data: Supabase
- Mobile packaging: Capacitor
- Native wrappers: Android + iOS
- Local static hosting: `npx serve`

## Project Structure

```text
DomasiHub/
├── app/                     # Main web application files
│   ├── css/                 # Stylesheets
│   ├── js/                  # Frontend logic and page scripts
│   ├── assets/              # Shared assets/icons/images
│   ├── *.html               # Pages such as home, portal, signin, signup
│   ├── index.html           # Redirect entry page
│   └── manifest.json        # PWA manifest
├── android/                 # Android Capacitor project
├── ios/                     # iOS Capacitor project
├── supabase/
│   └── migrations/          # SQL schema and setup migration files
├── capacitor.config.json    # Capacitor configuration
├── package.json             # Scripts and dependencies
├── .gitignore              # Git ignore configuration
└── README.md               # Project documentation
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ installed
- npm installed
- A Supabase project created
- Android Studio and/or Xcode for native builds (optional for web-only development)

## Installation

```bash
npm install
```

## Run Locally

To serve the web app locally:

```bash
npm run dev
```

This starts a local static server for the `app` folder.

Open the served URL in your browser, usually:

```text
http://localhost:3000
```

## Capacitor Commands

After installing dependencies, you can sync the web app with the native platforms:

```bash
npx cap sync
```

Open Android Studio:

```bash
npx cap open android
```

Open Xcode:

```bash
npx cap open ios
```

## Supabase Setup

This project uses Supabase for authentication, database tables, and storage. The schema is defined in:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_profile_trigger.sql`

The frontend initializes Supabase in `app/js/supabase-client.js` using the configured project URL and anonymous key.

### Optional override

If needed, you can set the values before the script loads:

```html
<script>
  window.DOMASI_SUPABASE_URL = "https://your-project.supabase.co";
  window.DOMASI_SUPABASE_ANON_KEY = "your-anon-key";
</script>
```

## Key Database Tables

The schema includes tables for:

- `profiles`
- `listings`
- `academic_resources`
- `skill_services`
- `campus_landmarks`
- `bulletins`

A storage bucket named `domasi-hub` is also configured for uploaded media and documents.

## Main App Pages

The app includes pages such as:

- `app/home.html` — landing page and search dashboard
- `app/portal.html` — management portal for posting listings
- `app/marketplace.html` — marketplace view
- `app/accommodation.html` — accommodation listings
- `app/academics.html` — academic content access
- `app/signin.html` and `app/signup.html` — auth flows
- `app/profile.html` — user profile
- `app/notifications.html` — user notifications

## Notes

- The app is primarily a static frontend with Supabase-backed functionality.
- The `app/index.html` page redirects to `home.html`.
- The project is configured as a mobile app via Capacitor, so it can be packaged for Android and iOS from the same codebase.

## Development Notes

To customize the app for a production environment:

1. Update the Supabase project URL and anon key in the client config.
2. Review and apply the SQL migrations in Supabase.
3. Test the app locally using the static server.
4. Run `npx cap sync` before building mobile apps.

## License

This project does not currently include a license file. If you plan to publish or distribute it, add an appropriate license such as MIT or Apache 2.0.
