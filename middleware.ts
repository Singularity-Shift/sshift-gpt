import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './frontend-chat/i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: defaultLocale,

  // Auto-detect user's locale from browser settings
  localeDetection: true,

  // Force locale prefix for all languages (e.g., /en, /es)
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except for:
  // - API routes: /api
  // - Next.js internal paths: /_next
  // - Vercel internal paths: /_vercel
  // - Files with extensions: /.*\\..*
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}; 