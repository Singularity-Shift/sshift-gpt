import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'es', 'tr', 'kz', 'ru', 'zh'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Make sure locale is always a string and is a supported locale
  // If not valid or undefined, fall back to default locale
  const validLocale = typeof locale === 'string' && locales.includes(locale) 
    ? locale 
    : defaultLocale;

  return {
    locale: validLocale, // This will always be a string now
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
}); 