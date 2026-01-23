# i18n Full UI Design (Explore + Settings)

Date: 2026-01-23

## Context

Lightdash currently has partial i18n (auth + core nav). We need full UI
internationalization with default Simplified Chinese and a user-visible
language switcher. The i18n runtime exists, but most UI strings are still
hardcoded. We also need a consolidated environment variable reference
for common frontend/backend and deployment settings.

## Goals

- Default UI language is zh-CN; user can switch to en.
- Language detection order: persisted choice (localStorage) -> browser
  navigator -> zh-CN.
- Missing translation keys render as the key string (no silent fallback).
- Logged-in users persist language to `preferred_language`; if absent, write
  the current language on first login.
- Full i18n coverage for Explore pages and all Settings pages.
- Frontend validation messages and UI toasts are localized.
- Numbers, dates, and relative time are formatted per locale (basic
  formatting only).
- Add `docs/ENVIRONMENT.md` with grouped env var list + examples.

## Non-goals

- Backend error messages are not localized (kept as-is).
- No additional languages beyond zh-CN and en.
- No advanced locale rules beyond standard Intl/dayjs/date-fns formatting.

## Scope

Namespaces (domain-based):
- `common`, `auth`, `explore`, `settings`, `validation`, `toast`

Pages/components in scope:
- Explore: explorer header, sidebar, filters, empty states, menus, save/share/
  download actions, tooltips.
- Settings: organization, projects, users/roles, integrations, warehouse
  connections, email/scheduler, service accounts, API tokens, and other
  settings pages.
- Frontend form validation and user-facing notifications.

## Architecture

- `packages/frontend/src/i18n/index.ts`
  - `supportedLngs: ['zh-CN', 'en']`
  - `fallbackLng: false` so missing keys show the key.
  - `detection.order: ['localStorage', 'navigator']`
  - `convertDetectedLanguage` uses `normalizeLanguage` (e.g., en-US -> en).
- `resources.ts` loads per-namespace resources from `locales/`.
- Add `useFormatters` (or similar) to expose `Intl.NumberFormat`,
  `Intl.DateTimeFormat`, and `Intl.RelativeTimeFormat` for the current locale,
  and to sync dayjs/date-fns locale on language change.

## Components

- `LanguageSwitcher` (logged-in): stays in UserMenu, updates i18n and persists
  `preferred_language` via user update mutation.
- `AuthLanguageSwitcher` (logged-out): add to login landing page (header or
  footer), updates i18n + localStorage without user API calls.
- `useApplyPreferredLanguage`:
  - If `user.preferredLanguage` exists and differs from current, call
    `changeLanguage`.
  - If missing, keep current language and persist it to user profile.

## Data Flow

1) App init: i18n loads from localStorage -> navigator -> zh-CN.
2) Logged-in boot:
   - If user has preference, apply it.
   - If no preference, keep current language and write it to user profile.
3) Language switch:
   - `changeLanguage` updates UI and localStorage; if logged in, also persists
     to `preferred_language`.
4) Rendering:
   - All UI strings use `useTranslation` with domain namespaces.
   - Validation and toast messages use `validation`/`toast` namespaces.

## Error Handling

- Missing translation keys render as the key itself.
- Backend error messages remain unchanged.
- Date/number formatting failures fall back to raw values.

## Testing

- Logic tests only (no tests for translation JSON or migration files):
  - `useApplyPreferredLanguage` writes default preference when missing.
  - `LanguageSwitcher` triggers `changeLanguage` + `updateUser`.
  - `useFormatters` updates locale-specific formatters on language change.

## Rollout & Docs

- Add `docs/ENVIRONMENT.md` (grouped env vars + examples).
- Incrementally convert Explore + Settings strings to i18n.
- QA: verify default zh-CN, language switch on login + logout, key fallback,
  and date/number formatting.
